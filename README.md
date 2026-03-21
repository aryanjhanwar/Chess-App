# Chess Clone (React + Bitboard Engine + Stockfish)

A full-featured chess web application with a custom bitboard move engine, Stockfish computer opponent, game review mode, PGN export, responsive UI, and sound feedback.

This project focuses on:
- Correct legal chess rules with fast internal representation
- Smooth player experience on both desktop and mobile
- Human vs Human and Human vs Computer gameplay
- Replay/review workflow and rich game-state UX

## Table Of Contents
- Overview
- Tech Stack
- Feature Analysis
- Gameplay Rules Coverage
- Stockfish Integration
- Review Mode
- UI/UX (Desktop + Mobile)
- Project Structure
- Getting Started
- Scripts
- How To Play
- Build And Deployment
- Known Limitations
- Roadmap

## Overview
This app uses a custom JavaScript bitboard engine as the source of truth for chess state and legal move generation. The UI is built in React and styled with Tailwind CSS. For computer play and live evaluation, a Stockfish engine runs in a Web Worker.

Core outcomes:
- Legal move validation for all standard chess rules
- Reliable game-state transitions (playing, checkmate, stalemate, timeout, draw, resign)
- Move list, captured pieces, and material advantage tracking
- Replay mode with manual and auto-play navigation
- PGN generation with time-control metadata

## Tech Stack
- React 19
- Vite 7
- Tailwind CSS 4
- ESLint 9
- Custom bitboard chess engine (in `src/engine/bitboard`)
- Stockfish (Web Worker, local worker asset with fallback)

## Feature Analysis

### 1) Core Chess Engine
- Bitboard-backed position model for efficient move generation
- Legal move filtering and game-status detection
- FEN parsing/generation pipeline
- v2 move format with tags for special move handling

Engine modules:
- `src/engine/bitboard/position.js`
- `src/engine/bitboard/moveGen.js`
- `src/engine/bitboard/attacks.js`
- `src/engine/bitboard/magic.js`
- `src/engine/bitboard/constants.js`

### 2) Game Modes
- Human vs Human (local)
- Human vs Computer (Stockfish)

Computer mode includes:
- Player color selection (White/Black)
- Difficulty levels 1-10
- Difficulty mapped to Stockfish skill/depth/move time

### 3) Move Input And Board Interaction
- Click-to-select and click-to-move flow
- Drag-and-drop + touch-friendly interactions
- Legal move hints on target squares
- Last move highlight
- King-in-check highlight
- Board flip support

### 4) Timers And Time Controls
- Separate clocks for White/Black
- Increment support
- Multiple preset categories (bullet, blitz, rapid, daily)
- Timeout handling
- Low-time warning sound

### 5) Game End Handling
- Checkmate
- Stalemate
- Timeout
- Resignation
- Draw by agreement

End game UI includes rematch/new-game workflow and review entry.

### 6) Review Mode
- Step backward/forward through game snapshots
- Jump to start/end
- Auto-play mode with interval progression
- Move sounds and check cues in playback

### 7) Stockfish And Evaluation
- Web Worker-based UCI command flow
- Engine readiness and command lifecycle handling
- Best-move search for computer turns
- Live centipawn/mate evaluation shown in evaluation bar
- Reliability hardening for stale/mismatched responses

### 8) Notation And PGN
- Algebraic notation generation
- PGN export with headers and result
- Time control formatting in PGN metadata

### 9) Audio Feedback
Sounds are integrated for:
- Move
- Capture
- Castle
- Check
- Promotion
- Game start/end
- Low-time warning

### 10) Responsive UX
- Desktop layout with side panels and board center stage
- Mobile-first game setup flow
- Compact controls and readable game panel ordering on small screens

## Gameplay Rules Coverage
Supported standard rule logic includes:
- Legal movement for all piece types
- Castling legality and execution
- En passant legality and execution
- Pawn promotion (piece selection UI)
- Check/checkmate/stalemate state detection

## Stockfish Integration
Stockfish is managed via `src/hooks/useStockfish.js`.

Key implementation points:
- Initializes worker and UCI mode
- Uses local worker source first for stability
- Supports fallback worker path when needed
- Guards against stale bestmove results
- Timeouts and safe cancellation for pending move requests
- Exposes helper methods:
	- `setPosition(fen)`
	- `getBestMove(depth, moveTime)`
	- `evaluatePosition(fen, depth, moveTime)`
	- `setSkillLevel(level)`
	- `stopAnalysis()`
	- `newGame()`

Difficulty tuning lives in `src/utils/stockfishUtils.js`.

## Review Mode
Review state is managed by `src/hooks/useReviewMode.js` and consumed by the app/game panel controls.

It provides:
- Stateful navigation over snapshots
- Auto-play with toggle
- Boundaries (`canGoBack`, `canGoForward`)
- Smooth return to live game state

## UI/UX (Desktop + Mobile)

Main screens and key components:
- `src/App.jsx` - app orchestration and game flow
- `src/components/ChessBoardView.jsx` - board rendering and interactions
- `src/components/RightPanel.jsx` - desktop controls
- `src/components/MobileStartGamePanel.jsx` - mobile setup flow
- `src/components/GamePanel.jsx` - move list, turn info, actions
- `src/components/PlayerCard.jsx` - player and captured pieces display
- `src/components/EvaluationBar.jsx` - engine eval visualization
- Modals: game over, draw offer, settings, promotion

## Project Structure
```text
src/
	App.jsx
	main.jsx
	index.css
	components/
		ChessBoardView.jsx
		GamePanel.jsx
		RightPanel.jsx
		Sidebar.jsx
		MobileStartGamePanel.jsx
		PlayerCard.jsx
		EvaluationBar.jsx
		PawnPromotionUI.jsx
		GameOverModal.jsx
		DrawOfferModal.jsx
		ReviewModeControls.jsx
		SettingsModal.jsx
		start/
			StartPanelSections.jsx
			ActionButtons.jsx
			styleHelpers.js
	hooks/
		useGameEngine.js
		useStockfish.js
		useChessTimer.js
		useReviewMode.js
		usePawnPromotion.js
		useDragAndDrop.js
	engine/
		index.js
		notation.js
		pgn.js
		bitboard/
			attacks.js
			constants.js
			init.js
			inBetween.js
			magic.js
			moveGen.js
			position.js
			utils.js
	utils/
		helpers.js
		sounds.js
		stockfishUtils.js
	constants/
		theme.js

public/
	stockfish.js
	stockfish.wasm.js
	stockfish.worker.js
	stockfish-wrapper.js
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Install
```bash
npm install
```

### Run Dev Server
```bash
npm run dev
```

Default Vite host/port are configured in `vite.config.js`.

## Scripts
- `npm run dev` - start development server
- `npm run build` - create production build (`dist/`)
- `npm run preview` - preview production build locally
- `npm run lint` - run ESLint

## How To Play
1. Choose game mode (human or computer).
2. Select time control.
3. If computer mode is selected, choose side and difficulty.
4. Start game and play with click or drag input.
5. Use resign/draw controls from the game panel.
6. After game ends, open review mode to replay the game.

## Build And Deployment

Build production assets:
```bash
npm run build
```

Preview build:
```bash
npm run preview
```

Deploy `dist/` to your static host of choice (Vercel, Netlify, Cloudflare Pages, GitHub Pages, etc.).

## Known Limitations
- No automated test suite is wired yet (manual verification flow currently).
- Settings modal currently acts as a placeholder for future controls.
- Online multiplayer is not implemented (local + vs computer only).

## Roadmap
- Add automated tests:
	- Engine legality regression tests
	- UI integration tests
	- End-to-end smoke tests
- Expand settings:
	- Board themes
	- Piece sets
	- Audio toggles and volume
- Optional online multiplayer mode
- Optional opening book support for lower-latency computer responses

---

If you are forking this project for production use, start with engine tests and CI setup before adding new gameplay features.
# chess-engine-ui
