# ♟️ Chess App — Senior Engineer Code Audit

> Brutally honest, real-world engineering standards. No sugarcoating.

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Critical Bugs](#critical-bugs)
3. [File-by-File Review](#file-by-file-review)
4. [Performance Analysis](#performance-analysis)
5. [UI/UX Audit](#uiux-audit)
6. [Database Readiness](#database-readiness)
7. [Deployment Readiness](#deployment-readiness)
8. [Recommended Folder Structure](#recommended-folder-structure)
9. [Priority Action Plan](#priority-action-plan)

---

## Architecture Overview

**Stack:** React 19 + Vite + TailwindCSS v4 + Custom Bitboard Engine + Stockfish WASM + PeerJS (P2P) + Jotai + React Query

**What's working well:**
- Custom bitboard chess engine is a genuinely impressive feat — clean separation from the React layer via a persistent `positionRef` pattern in `useGameEngine`
- The render-tick pattern (`bumpRender`) avoids stale closures over mutable bitboard state
- P2P multiplayer via PeerJS is architecturally sound
- Asset path utility (`toAssetPath`) correctly handles `BASE_URL` for subdirectory deployments
- `netlify.toml` has correct WASM MIME type and immutable cache headers

**Critical architectural problems:**
- `App.jsx` is **1,820 lines** — a God Component anti-pattern that owns everything
- Routing via `window.location.pathname` manual comparison is fragile and wrong
- Two parallel hardcoded board/piece/surface lists exist in `App.jsx` AND `SettingsModal.jsx` — data duplication
- `sections/` and `workers/` directories are **empty** (dead folder scaffolding)
- `src/enginecode.cpp` (111KB C++ file) has no business being in `src/` — it's not processed by the build

---

## Critical Bugs

### 🔴 BUG 1: `makeComputerMove` has a stale closure over `isComputerTurn`
**File:** `App.jsx` line ~1021–1028

```js
// BUGGY — isComputerTurn() reads gameMode/playerColor from closure at effect registration time
useEffect(() => {
  if (!uiCapabilities.canMovePieces) return;
  if (isComputerTurn()) {         // ← isComputerTurn is NOT in deps array
    const timer = setTimeout(() => makeComputerMove(), 300);
    return () => clearTimeout(timer);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps ← suppressed!
}, [currentTurn, gameMode, playerColor, uiCapabilities.canMovePieces]);
```

`isComputerTurn` is a **plain function** defined inside the component — it captures `gameMode` and `playerColor` at render time. Because it's not a `useCallback`, it re-creates every render, but the deps array literally suppresses the lint warning. The real bug: `makeComputerMove` is also not in the deps array and it captures `stockfish`, `fen`, `legalMovesMap`, etc.

**Fix:**
```js
const isComputerTurnRef = useRef(false);
// Or: wrap isComputerTurn in useCallback and add to deps
const isComputerTurn = useCallback((turn = currentTurn) => {
  if (gameMode !== 'computer') return false;
  return (playerColor === 'white' && turn === 'b') ||
         (playerColor === 'black' && turn === 'w');
}, [currentTurn, gameMode, playerColor]);
```

---

### 🔴 BUG 2: P2P remote move applied synchronously inside a React effect

**File:** `App.jsx` lines 1361–1365

```js
if (msg.type === 'move' && msg.move && isMultiplayerGame) {
  remoteApplyingMoveRef.current = true;
  performMove(msg.move);        // ← calls engineExecuteMove, then p2p.sendMessage
  remoteApplyingMoveRef.current = false;
}
```

`performMove` internally calls `p2p.sendMessage` (line 781) guarded by `!remoteApplyingMoveRef.current`. Setting the ref synchronously before *and* after `performMove` **works by coincidence** in synchronous React rendering, but it's a race condition — if `performMove` ever batches state, the ref may be read as false by the time `sendMessage` runs. Additionally, the `new_game` message handler (lines 1367–1372) sets the same ref around `handleNewGame()`, which calls multiple state setters — again not safe.

**Fix:** Instead of a mutable ref flag, handle the echo prevention inside `useP2PGame` by tracking a `pendingLocalMoves` set, or pass a callback path (not a flag) to `p2p.sendMessage`.

---

### 🔴 BUG 3: Timer side effects inside `setWhiteTime` updater function

**File:** `useChessTimer.js` lines 26–37

```js
setWhiteTime(prev => {
  const newTime = prev - 100;
  if (newTime <= 10000 && prev > 10000 && !lowTimeWarningPlayed.current.w) {
    playTenSecondsSound();                     // ← SIDE EFFECT in state updater!
    lowTimeWarningPlayed.current.w = true;
  }
  if (newTime <= 0) {
    playGameEndSound();                        // ← SIDE EFFECT in state updater!
    setGameState('timeout');                   // ← CALLING setState inside setState updater!
    setIsTimerActive(false);                   // ← CALLING setState inside setState updater!
    setShowGameOverUI(true);                   // ← CALLING setState inside setState updater!
    return 0;
  }
  return newTime;
});
```

React **prohibits side effects inside state updater functions** — they may be called multiple times (StrictMode), and calling `setState` inside another `setState` updater triggers undefined behavior. In StrictMode (enabled in production-level `main.jsx`), the updater runs twice, meaning sounds play twice.

**Fix:**
```js
// Outside the updater — use useEffect to react to the time value
useEffect(() => {
  if (currentTurn === 'w' && whiteTime <= 0 && isTimerActive) {
    triggerTimeout();
  }
  if (currentTurn === 'w' && whiteTime <= 10000 && whiteTime > 9900) {
    playTenSecondsSound();
  }
}, [whiteTime, currentTurn]);
```

---

### 🔴 BUG 4: Routing is URL-string comparison, not a router

**File:** `main.jsx` lines 25–26

```js
const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
const RootComponent = pathname === '/analysis' ? AnalysisApp : App;
```

This breaks on **any deployment with a base path** (e.g. `/chess-app/analysis` would not match). It also means navigating to `/analysis` via `window.location.assign` (App.jsx line 969) causes a full page reload, losing all React state. There is also no 404 handling.

**Fix:** Use `react-router-dom` v6 with `BrowserRouter` + `Routes`, or at minimum use `import.meta.env.BASE_URL` to normalize the comparison.

---

### 🟡 BUG 5: `useReviewMode` — `goToPrevious`/`goToNext` return stale state

**File:** `useReviewMode.js` lines 62–79

```js
const goToPrevious = () => {
  setIsPlaying(false);
  if (reviewIndex > 0) {
    const newIndex = reviewIndex - 1;
    setReviewIndex(newIndex);
    return { state: reviewHistory[newIndex], index: newIndex }; // ← stale closure!
  }
  return null;
};
```

`reviewIndex` and `reviewHistory` are captured from the **last render**. If two navigations happen before a re-render (unlikely but possible in auto-play), the index is wrong. The design works today only because auto-play goes through `setReviewIndex` inside an interval callback — but the whole pattern is fragile.

**Fix:** Use `useRef` for the current index in interval callbacks, or restructure the hook to use a single reducer.

---

### 🟡 BUG 6: `useChessTimer` missing `whiteTime`/`blackTime` from deps

**File:** `useChessTimer.js` line 63

The hook receives `setWhiteTime` and `setBlackTime` but never `whiteTime` or `blackTime` — yet the timer logic depends on them implicitly via the updater. This is fine for the updater pattern itself, but the `isTimerActive` check at the beginning of the effect is stale — if the timer is stopped and restarted in rapid succession, a stale interval may still fire.

---

### 🟡 BUG 7: `ANALYSIS_HANDOFF_KEY` declared inside component body

**File:** `App.jsx` line 318

```js
function App() {
  const ANALYSIS_HANDOFF_KEY = 'chessapp_analysis_handoff_v1'; // re-created every render!
```

This is a constant that never changes — it should be module-level.

---

### 🟡 BUG 8: `sounds.js` creates Audio objects at module load time

**File:** `utils/sounds.js` lines 7–27

```js
const createSound = (filename) => {
  const audio = new Audio(`/sounds/${filename}`);  // ← hardcoded /sounds/ not base-URL aware!
  audio.preload = 'auto';
  return audio;
};
const sounds = {
  gameStart: createSound('game-start.mp3'),
  // ...
};
```

Two problems:
1. The path `/sounds/filename` ignores `BASE_URL` — will fail in subdirectory deployments (even though the app uses `toAssetPath` everywhere else).
2. Creating Audio objects at module load time in Node/SSR environments will throw.

**Fix:**
```js
// Use lazy initialization
let sounds = null;
function getSounds() {
  if (!sounds) {
    const base = import.meta.env?.BASE_URL ?? '/';
    sounds = {
      gameStart: new Audio(`${base}sounds/game-start.mp3`),
      // ...
    };
  }
  return sounds;
}
```

---

## File-by-File Review

### `src/App.jsx` — ⚠️ CRITICAL REFACTOR NEEDED

**Metrics:** 1,820 lines, ~50 `useState` calls, ~15 `useEffect` calls, ~12 `useMemo` calls, all in one component.

**Issues:**
- **God Component**: Owns game logic, UI state, timer state, P2P state, Stockfish state, review mode state, settings, and rendering. This violates the Single Responsibility Principle completely.
- **`isComputerTurn` is an arrow function defined inside the component** that's called inside effects — creates stale closure bugs (see Bug #1).
- **`console.log`/`console.warn`/`console.error` spread throughout** (lines 837, 990, 993, 1004, 1099, 1103, 1159, 1166, 1238, 1239). These are debug leftovers and will spam production console.
- **Duplicate static data**: `BOARD_IMAGE_MAP`, `BOARD_TEXTURE_MAP`, `BACKGROUND_PRESETS`, `APP_THEME_PRESETS` are all defined in `App.jsx` **and** replicated in `SettingsModal.jsx` (`BOARD_SURFACE_OPTIONS`, `BACKGROUND_OPTIONS`, `THEME_PRESETS`). This is a maintenance nightmare — if you add a board, you must update 2+ files.
- **Inline event handlers in JSX** (onMouseEnter/onMouseLeave on lines 1579–1580, 1593–1595, etc.) that create new function references every render, bypassing React.memo optimization.
- **`formatTime` function** defined inside the component but doesn't use component state — should be a utility function.
- **`displayBoard` computed via array spread+reverse** on every render without memoization (lines 1432–1434).
- **`STORAGE_KEYS` declared twice** — once inside `App` for `ANALYSIS_HANDOFF_KEY`, and the `STORAGE_KEYS` object is module-level but `ANALYSIS_HANDOFF_KEY` is not.

**`canStartGame` prop duplication:**
```js
// In App.jsx render — RightPanel:
canStartGame={uiCapabilities.canStartGame}  // ← derived from uiCapabilities
// And also a separate prop:
canPlayFriend={uiCapabilities.canOpenMultiplayer}
// Meanwhile MobileStartGamePanel also gets canStartGame
// And GamePanel gets canUseInGameActions
// Same data piped through 4 different channels
```

---

### `src/main.jsx` — ⚠️ FRAGILE ROUTING

See Bug #4. Also: `QueryClient` is created at module level but `QueryClientProvider` only wraps `AnalysisApp`, not `App`. If `App` ever needs React Query, it won't have a provider.

---

### `src/hooks/useGameEngine.js` — ✅ WELL DESIGNED, Minor Issues

The renderTick + useRef pattern is correct and clever. Issues:
- `syncFromUciMoves` rebuilds history without notation strings (`notation: ''`) — if this data is ever used for review, it'll show empty moves.
- The history entry includes a redundant `prevNotations` computation (line 291) that maps the entire history array just to spread it — O(n²) total for a full game. Use the existing `historyRef.current` directly.
- `getReviewSnapshots` does `positionToDisplayPieces(createStartingPosition())` on every call — this is a pure constant that could be cached.

---

### `src/hooks/useChessTimer.js` — 🔴 ANTI-PATTERN

See Bug #3. The hook's API is also poorly designed — it receives *too many* setters from the parent (6 setter functions). A better pattern is to return timer state and let the parent react.

---

### `src/hooks/useReviewMode.js` — 🟡 WORKS BUT FRAGILE

- `getCurrentReviewState` is defined as an arrow function inside the returned object on line 120 — it captures `reviewHistory` and `reviewIndex` from closure, which is fine now but creates subtle bugs if callers try to use it in their own effects without including it in deps.
- The `reviewHistoryLengthRef` workaround (line 14) is a code smell — exists only because the interval closure doesn't have current state. This is the classic "stale closure in interval" problem and the standard fix is `useRef` for the mutable value.

---

### `src/hooks/useP2PGame.js` — ✅ SOLID

Clean, well-structured. Only concern is TURN credentials hardcoded in source (lines 10–23):
```js
{
  urls: 'turn:openrelay.metered.ca:80',
  username: 'openrelayproject',      // ← hardcoded public credentials
  credential: 'openrelayproject',    // ← not a secret but should be env var
}
```

---

### `src/components/ChessBoardView.jsx` — ✅ GOOD, Minor Issues

- `Square` is correctly memoized with `React.memo`.
- `isValidMoveSquare` and `isLastMoveSquare` (lines 214–215) are plain functions defined inside the component body — they'd be stale closures if referenced in effects, but since they're only used inside JSX, it's okay. Still, they should use `useCallback` or be inlined.
- The fallback image chain (lines 5–31) is clever but complex. Storing fallback attempt count in `element.dataset` is a valid technique.
- **Missing `aria-label` on clickable squares** — accessibility gap.

---

### `src/components/RightPanel.jsx` — 🟡 PROP DRILLING OVERLOAD

Receives 30+ props and passes most of them straight to `GamePanel`. This is the classic prop drilling problem that Jotai (already installed!) is meant to solve.

**Unused prop:** `onActiveTopOptionChange` is accepted (line 42) but `onPlayFriend` prop is not actually exposed in `App.jsx` — wait, it is on line 1809. But `onActiveTopOptionChange` is never passed from `App.jsx`. It's a dead prop parameter.

---

### `src/components/GamePanel.jsx` — 🟡 MOVE HISTORY NOT SCROLLED TO BOTTOM

When new moves are added, the move history div doesn't auto-scroll to the latest move. Chess.com, Lichess — all auto-scroll. This is a missing UX feature.

**Fix:**
```js
const moveHistoryRef = useRef(null);
useEffect(() => {
  if (moveHistoryRef.current) {
    moveHistoryRef.current.scrollTop = moveHistoryRef.current.scrollHeight;
  }
}, [moveHistory.length]);
```

Also: move pairs are computed every render with a `for` loop inside the component body — this should be `useMemo`.

---

### `src/components/SettingsModal.jsx` — 🔴 DATA DUPLICATION

**`BOARD_SURFACE_OPTIONS`** (lines 46–78) and **`PIECE_SET_OPTIONS`** (lines 101–111) are fully hardcoded here as static arrays, **even though `App.jsx` passes in `boardSurfaceOptions` and `pieceSetOptions` props dynamically loaded from `asset-manifest.json`**. The component falls back to the static arrays if props are empty (line 186–196), creating two separate sources of truth.

**`BOARD_SURFACE_OPTIONS` also uses hardcoded `/assets/boards/` paths** (line 48+) instead of `toAssetPath()` — will break in subdirectory deployments. (Note: they do `toAssetPath` after resolving, line 190–193, but the initial static list is wrong.)

---

### `src/utils/sounds.js` — 🔴 See Bug #8

---

### `src/utils/assetPath.js` — ✅ WELL DONE

Correctly handles BASE_URL. No issues.

---

### `src/utils/stockfishUtils.js` — ✅ CLEAN

Well documented, well typed for JavaScript. The `getDifficultySettings` could use `Object.freeze()` to prevent accidental mutation, but it's minor.

---

### `src/data/openings.js` — ⚠️ 452KB FILE

A 452KB JavaScript file containing chess opening data is imported at startup. There's no evidence it's used (no imports of it found in the main game flow). Even if used, it should be:
1. Loaded lazily with dynamic `import()`
2. Fetched as a JSON file at runtime, not bundled into the main JS chunk

This file alone adds **~450KB** to the initial bundle.

---

### `package.json` — 🟡 ISSUES

- **`"main": "eslint.config.js"`** — this is wrong. The `main` field should point to your entry point (or be omitted for frontend apps). It currently points to your ESLint config.
- Both `tailwindcss` and `@tailwindcss/vite` are in `dependencies` (not `devDependencies`) — they should be dev-only.
- `firebase` is in dependencies but zero Firebase usage found in the codebase (searched: no imports). This adds **~500KB** to the bundle for nothing.
- `@mui/material` + `@emotion/react` + `@emotion/styled` + `@mui/lab` in dependencies — but the app uses Tailwind. No MUI components found in non-analysis code. May be used only by the analysis page. If so, should be lazy-loaded.
- `recharts` in dependencies — only used in analysis, should be lazy.

---

### `vite.config.js` — 🟡 ISSUES

```js
resolve: {
  alias: {
    '@': fileURLToPath(new URL('./src/analysis/chessapp', import.meta.url)),
  },
},
```

The `@` alias points to `src/analysis/chessapp`, **not** `src/`. This is non-standard (the Vite default is `src/`) and will confuse developers. Rename to a more descriptive alias like `@analysis`.

**Missing:** No chunk splitting strategy — the entire app plus Firebase, MUI, recharts, chess.js will be bundled together.

**Fix:**
```js
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-mui': ['@mui/material', '@emotion/react', '@emotion/styled'],
        'vendor-recharts': ['recharts'],
        'vendor-firebase': ['firebase'],
        'vendor-chess': ['chess.js'],
      }
    }
  }
}
```

---

### `.gitignore` — 🟡 MISSING ENTRIES

```
# Should be added:
.env
.env.*
!.env.example
lint.json          # 292KB — no business being in git
lint-report.txt    # 104KB — no business being in git
analysis.txt
update.txt
.tmp-*.cjs         # temp scripts shouldn't be committed
```

---

### `src/enginecode.cpp` — ⚠️ WRONG LOCATION

A 111KB C++ source file inside `src/` is processed by nothing and committed to the repo. Move to `engine-src/` or `docs/` or a submodule.

---

## Performance Analysis

### 1. Bundle Size (Estimated ~3-4MB uncompressed)

| Package | Approximate Size |
|---------|-----------------|
| `firebase` (unused in main app) | ~500KB |
| `@mui/material` + emotion | ~300KB |
| `recharts` | ~150KB |
| `openings.js` static data | ~450KB |
| `chess.js` (for analysis only) | ~100KB |
| Stockfish WASM | varies |

**Solution:** Code-split the analysis route. Everything in `src/analysis/` should be a lazy-loaded route module.

### 2. Board Flip Computation

**File:** `App.jsx` lines 1432–1456

```js
const displayBoard = effectiveBoardFlipped
  ? [...activeBoard].reverse().map(row => [...row].reverse())  // 8 new arrays every render!
  : activeBoard;
```

This creates 9 new arrays on every render when the board is flipped. With React's concurrent mode, this can happen frequently.

**Fix:** `useMemo`:
```js
const displayBoard = useMemo(() => {
  if (!effectiveBoardFlipped) return activeBoard;
  return [...activeBoard].reverse().map(row => [...row].reverse());
}, [activeBoard, effectiveBoardFlipped]);
```

### 3. `useGameEngine` — redundant history spread

**File:** `useGameEngine.js` lines 291–308

```js
const prevNotations = historyRef.current.map(e => e.notation); // O(n) every move!
// ...
historyRef.current = [...historyRef.current, {  // O(n) spread every move!
  // ...
  moveHistory: [...prevNotations, notation],    // another O(n) spread!
```

For a 100-move game, this is O(n²) total allocations for the history. Use a separate `notationsRef` that you push to directly, and compute `moveHistory` on demand.

### 4. `openings.js` — 452KB bundled

Already mentioned. Use `import()` lazy loading or a fetch call.

### 5. `pieceSetOptions` useMemo

**File:** `App.jsx` line 481–483

```js
const pieceSetOptions = useMemo(() => {
  return assetManifest.pieceSets;
}, [assetManifest.pieceSets]);
```

This `useMemo` does absolutely nothing — it just returns the same reference. Remove it.

---

## UI/UX Audit

### ✅ Good
- Clean glassmorphism aesthetic throughout
- Board flip and evaluation bar well implemented
- Responsive mobile nav with bottom bar
- Review mode controls are complete
- Pawn promotion UI works

### 🔴 Issues

#### 1. Move history doesn't auto-scroll
As noted in GamePanel review — this is a critical UX failure for any chess app.

#### 2. No loading state for Stockfish engine initialization
When Stockfish is loading, the computer move just silently doesn't happen. No spinner, no "Engine loading..." message. Players don't know to wait.

#### 3. Resign button confirmation UX is confusing
The `triggerResignHighlight` creates a pulsing yellow ring on the resign button for 2.2 seconds, then disappears. The intention is "click twice to resign" — but there's zero text explaining this. Users will be confused.

**Fix:** Show a tooltip or modal: "Click again to confirm resignation."

#### 4. No keyboard navigation support
The chess board has zero keyboard support. This is an accessibility failure — players cannot move pieces with keyboard.

#### 5. Timer display uses trailing spaces for alignment
```js
return `${mins}:${secs}   `;  // ← 3 trailing spaces to prevent layout shift
```
Use `font-variant-numeric: tabular-nums` CSS instead.

#### 6. Mobile board size is too small
`w-[calc(min(70px,(100vw-2rem)/8))]` — on a 375px iPhone, each square is `(375-32)/8 = 42.9px`. At 42px per square, pieces are barely touchable. The WCAG touch target minimum is 44×44px.

**Fix:**
```
w-[calc(min(72px,(100vw-1rem)/8))]
```

#### 7. "Chat" tab is shown but disabled — dead UI
The "Chat" tab in `RightPanel` (marked "coming soon" in the title attribute) adds visual clutter. Either implement it or hide it until ready.

#### 8. Multiplayer PIN is not visible to the HOST
Looking at `MultiplayerLobbyScreen` — users create a room with a PIN, but the generated PIN isn't prominently displayed for the host to share. (Based on `useP2PGame`'s `hostStartWithPin` flow.)

#### 9. `<title>` is "chessclone" 
**File:** `index.html` line 7. This should be the actual app name. Also missing: `meta description`, `og:title`, `og:description`, `og:image`, `theme-color`, `apple-mobile-web-app-capable`.

---

## Database Readiness

### Current State
All game state is ephemeral (in-memory React state) with a small localStorage footprint for preferences. There is no persistence of game history, user accounts, matchmaking, or rating.

### Recommended API Structure

```
POST   /api/games              → Create new game session
GET    /api/games/:id          → Fetch game state
PATCH  /api/games/:id/move     → Submit a move
POST   /api/games/:id/resign   → Resign game
POST   /api/games/:id/draw     → Offer/accept draw
GET    /api/games/:id/pgn      → Export PGN
GET    /api/users/:id/games    → Game history
POST   /api/auth/register
POST   /api/auth/login
GET    /api/leaderboard
```

### Schema Design

```sql
-- Users
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username    VARCHAR(32) UNIQUE NOT NULL,
  elo_rating  INTEGER DEFAULT 1200,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Games
CREATE TABLE games (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  white_user_id  UUID REFERENCES users(id),
  black_user_id  UUID REFERENCES users(id),
  pgn            TEXT,
  result         VARCHAR(10),  -- '1-0', '0-1', '1/2-1/2', '*'
  end_reason     VARCHAR(20),  -- 'checkmate','resignation','draw','timeout'
  time_control   VARCHAR(20),  -- '10+0', '5+3'
  created_at     TIMESTAMP DEFAULT NOW(),
  ended_at       TIMESTAMP
);

-- Moves (for per-move analysis later)
CREATE TABLE moves (
  id          BIGSERIAL PRIMARY KEY,
  game_id     UUID REFERENCES games(id),
  move_number INTEGER NOT NULL,
  san         VARCHAR(10),
  fen         TEXT,
  eval_cp     INTEGER,
  time_left   INTEGER,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

### Replace Hardcoded Patterns

1. **localStorage preferences** → `/api/users/:id/settings` (keep localStorage as offline cache)
2. **P2P PeerJS** → Add WebSocket game server for reliable message delivery and persistence
3. **openings.js** → Query a `positions` table keyed by FEN prefix

---

## Deployment Readiness

### ✅ Already Done
- `netlify.toml` correct with WASM MIME type
- SPA fallback redirect configured
- Asset caching headers set
- `vite.config.js` has `base: './'` (allows flexible path deployment)

### 🔴 Missing

#### 1. No `.env.example` file
The app has no environment variables whatsoever. Everything is hardcoded. At minimum:
```env
VITE_APP_NAME=ChessApp
VITE_PEER_SERVER_HOST=      # custom PeerJS server (optional)
VITE_TURN_CREDENTIAL=openrelayproject
VITE_ASSET_BASE_URL=        # CDN URL for assets
```

#### 2. No Content Security Policy headers
Missing in `netlify.toml`. For a chess app with Stockfish WASM, `SharedArrayBuffer` (for multi-threaded Stockfish) requires:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Cross-Origin-Opener-Policy = "same-origin"
    Cross-Origin-Embedder-Policy = "require-corp"
```

#### 3. No error boundary
The app has no `ErrorBoundary` component. If Stockfish throws, if PeerJS fails to load, or if the bitboard engine throws, the entire app goes blank with no user feedback.

**Fix:**
```jsx
class AppErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return <ErrorScreen error={this.state.error} onReset={() => window.location.reload()} />;
    }
    return this.props.children;
  }
}
```

#### 4. `dist/` not in `.gitignore` correctly... wait, it is ✅

#### 5. `lint.json` (292KB) and `lint-report.txt` (104KB) committed to repo — remove them.

---

## Recommended Folder Structure

```
src/
├── app/                        # App-level concerns
│   ├── App.jsx                 # Thin orchestrator only (~100 lines)
│   ├── router.jsx              # react-router-dom routes
│   ├── providers.jsx           # QueryClient, Jotai, etc.
│   └── ErrorBoundary.jsx
│
├── features/                   # Feature-sliced design
│   ├── game/                   # Core game feature
│   │   ├── hooks/
│   │   │   ├── useGameEngine.js
│   │   │   ├── useChessTimer.js
│   │   │   ├── usePawnPromotion.js
│   │   │   └── useReviewMode.js
│   │   ├── store/              # Jotai atoms for game state
│   │   │   └── gameAtoms.js
│   │   ├── GamePage.jsx        # Assembled game UI (~200 lines max)
│   │   └── index.js
│   │
│   ├── multiplayer/            # P2P feature
│   │   ├── hooks/
│   │   │   └── useP2PGame.js
│   │   ├── MultiplayerLobbyScreen.jsx
│   │   └── index.js
│   │
│   ├── analysis/               # Analysis feature (lazy-loaded)
│   │   └── [existing analysis files]
│   │
│   └── settings/               # Settings feature
│       ├── SettingsModal.jsx
│       └── settingsAtoms.js    # Jotai atoms for UI settings
│
├── engine/                     # Chess engine (pure logic, no React)
│   ├── bitboard/
│   ├── notation.js
│   └── pgn.js
│
├── lib/                        # Third-party integrations
│   ├── stockfish/
│   │   ├── useEngine.js
│   │   └── uciEngine.js
│   └── peerjs/
│       └── useP2PGame.js
│
├── shared/                     # Shared cross-feature code
│   ├── components/
│   │   ├── ChessBoardView.jsx
│   │   ├── EvaluationBar.jsx
│   │   └── PlayerCard.jsx
│   ├── constants/
│   │   ├── boardThemes.js      # Single source for all board/piece/bg data
│   │   └── gameConstants.js
│   └── utils/
│       ├── assetPath.js
│       ├── sounds.js
│       └── formatTime.js
│
└── assets/                     # Static assets (not in src ideally)
```

---

## Priority Action Plan

### 🔴 P0 — Fix Now (Bugs / Correctness)

| # | Action | File | Effort |
|---|--------|------|--------|
| 1 | Fix timer side effects inside state updater | `useChessTimer.js` | 1h |
| 2 | Wrap `isComputerTurn` in `useCallback`, fix computer move deps | `App.jsx` | 1h |
| 3 | Fix `sounds.js` to use BASE_URL and lazy init | `utils/sounds.js` | 30min |
| 4 | Move `ANALYSIS_HANDOFF_KEY` to module scope | `App.jsx` | 5min |

### 🟠 P1 — High Impact (Architecture)

| # | Action | File | Effort |
|---|--------|------|--------|
| 5 | Replace manual pathname routing with `react-router-dom` | `main.jsx` | 2h |
| 6 | Create `ErrorBoundary` component | New | 1h |
| 7 | Extract game state to Jotai atoms (use already-installed Jotai!) | New store | 4h |
| 8 | Split `App.jsx` into `GamePage.jsx` + sub-components | `App.jsx` | 6h |
| 9 | Create single source of truth for board/piece/bg data constants | New `constants/boardThemes.js` | 2h |

### 🟡 P2 — Performance

| # | Action | File | Effort |
|---|--------|------|--------|
| 10 | Memoize board flip computation (`displayBoard` useMemo) | `App.jsx` | 15min |
| 11 | Lazy-load analysis route (split ~1MB from main chunk) | `router.jsx` | 2h |
| 12 | Remove `firebase` if unused in main app | `package.json` | 30min |
| 13 | Remove `openings.js` from bundle; fetch lazily | `data/openings.js` | 1h |
| 14 | Move `tailwindcss` packages to devDependencies | `package.json` | 5min |
| 15 | Add Vite `manualChunks` for vendor splitting | `vite.config.js` | 30min |
| 16 | Add `useMemo` for movePairs in `GamePanel` | `GamePanel.jsx` | 15min |

### 🟢 P3 — UX / Polish

| # | Action | File | Effort |
|---|--------|------|--------|
| 17 | Auto-scroll move history to latest move | `GamePanel.jsx` | 30min |
| 18 | Add Stockfish loading state/indicator | `App.jsx` | 1h |
| 19 | Improve resign confirmation UX (tooltip/double-click pattern) | `GamePanel.jsx` | 1h |
| 20 | Fix `<title>` and add SEO meta tags | `index.html` | 30min |
| 21 | Fix timer trailing spaces (use CSS tabular-nums) | `App.jsx` | 15min |
| 22 | Increase mobile square touch target size | `ChessBoardView.jsx` | 15min |
| 23 | Add keyboard navigation to chess board | `ChessBoardView.jsx` | 4h |
| 24 | Hide "Chat" tab until implemented | `RightPanel.jsx` | 5min |

### 🔵 P4 — Deployment / Maintenance

| # | Action | File | Effort |
|---|--------|------|--------|
| 25 | Add `.env.example` with documented variables | New | 30min |
| 26 | Add COOP/COEP headers to `netlify.toml` for WASM threads | `netlify.toml` | 15min |
| 27 | Remove `lint.json`, `lint-report.txt`, `.tmp-*.cjs` from repo | `.gitignore` | 15min |
| 28 | Move `enginecode.cpp` out of `src/` | File move | 5min |
| 29 | Fix `"main"` field in `package.json` | `package.json` | 5min |
| 30 | Rename `@` alias to `@analysis` in `vite.config.js` | `vite.config.js` | 5min |

---

## Final Summary

This is a **genuinely impressive project** — a custom bitboard chess engine in JavaScript is rare and the P2P multiplayer implementation is clean. The UI looks polished. But the codebase has accumulated significant technical debt, primarily because:

1. **`App.jsx` was never split** as features were added — it became a 1,820-line monolith
2. **Static data was duplicated** rather than centralized
3. **Three critical React anti-patterns** exist (side effects in updaters, stale closures, incorrect routing)
4. **Bundle has ~1.5MB of unused/lazy-loadable dependencies**

The engine code and hook design are actually the best parts — they just need to be freed from the App.jsx monolith. Prioritize P0 fixes, then the routing + ErrorBoundary (P1), then split App.jsx — that will unlock everything else.
