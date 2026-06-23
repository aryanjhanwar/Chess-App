# Production-Grade Chess Application Architecture Strategy

This document details the recommended structural plan and strategy to scale the chess application into a production-grade, highly performant product. It addresses decoupling front-end views, consolidating shared logic, and preparing the workspace for backend integrations (e.g. database persistence, authentication, matchmaking, and WebSocket-based live play).

---

## 1. The Target Architecture: Turborepo / pnpm Monorepo

For a production-grade application featuring a client web app, backend server, and shared engine packages, a **Monorepo** using workspace tools (`pnpm`, `yarn workspaces`, or `npm workspaces`) is the industry standard.

### Proposed Directory Layout

```
/ (Workspace Root)
  ├── package.json
  ├── pnpm-workspace.yaml (or npm workspaces config)
  │
  ├── apps/
  │   ├── web-client/            (Vite + React Frontend - Consolidated Single Page App)
  │   │   ├── src/
  │   │   │   ├── components/    (Reusable layout shells, buttons, modals, overlays)
  │   │   │   ├── features/      (Domain-specific screens & routing)
  │   │   │   │   ├── play/      (Play against local/AI/remote opponent)
  │   │   │   │   ├── analysis/  (Engine game analysis, move tooltips, graphs)
  │   │   │   │   └── review/    (Post-game analysis review mode)
  │   │   │   ├── state/         (Jotai global state configuration)
  │   │   │   └── App.jsx
  │   │   ├── index.html
  │   │   └── vite.config.js
  │   │
  │   └── api-server/            (Node.js / Express or Go Backend - for future use)
  │       ├── src/
  │       │   ├── routes/        (API Endpoints - /auth, /games, /matchmaking)
  │       │   ├── services/      (Business logic - game verification, rating updates)
  │       │   ├── sockets/       (WebSockets handler - live matchmaking & live move relay)
  │       │   ├── models/        (Database schemas - MongoDB/PostgreSQL schemas)
  │       │   └── index.js
  │       └── package.json
  │
  └── packages/
      ├── chess-core/            (Pure Chess Engine & Analysis - Zero UI Dependencies)
      │   ├── src/
      │   │   ├── engine/        (Custom Bitboard engine implementation)
      │   │   ├── stockfish/     (UCI client wrappers, WASM stockfish loaders)
      │   │   └── analysis/      (Win percentages, accuracy scores, Elo estimations)
      │   └── package.json
      │
      ├── ui-kit/                (Shared Board Rendering Components)
      │   ├── src/
      │   │   ├── ChessBoardView/(SVG grid, animation handlers, drag/drop helpers)
      │   │   ├── PawnPromotion/ (Glassmorphic radial promotion dial)
      │   │   ├── EvaluationBar/ (Evaluation bar calculations and graphics)
      │   │   └── themes/        (Board surfaces, piece sets, global theme maps)
      │   └── package.json
      │
      └── shared-types/          (Shared typescript/JSON validation schemas)
```

---

## 2. Step-by-Step Migration Strategy

### Step 1: Unify the Frontends (Immediately)
Currently, there is a split between `src/App.jsx` (main play screen) and `src/analysis/chessapp/` (analysis screen).
- **Action**: Merge the two React bundles into a single unified dashboard (Single Page Application) with a routing layer (e.g. `react-router-dom`).
- **Benefit**: Removes duplicated `capturedPieces`, `evaluationBar`, and layout wrappers.

### Step 2: Establish `@chess/core` & `@chess/ui` Packages
Extract the consolidated chess rules and engines from `src/shared/chess` into local packages:
- **`@chess/core`**: Contains our custom Bitboard move generator, Stockfish wrapper workers, and evaluation formulas.
- **`@chess/ui`**: Holds `ChessBoardView`, `PawnPromotionUI`, custom piece graphics, and board color themes.
- **Benefit**: The backend API server can import `@chess/core` to validate PGN moves and verify win/lose states authoritatively without duplicating code.

### Step 3: Implement Unified Jotai/Redux State Stores
Migrate the frontend states into a structured Jotai store. Global configuration options like volume, piece style, or active board colors should be stored in unified atoms:
- Local storage middleware will automatically sync configuration edits.
- Modifying settings on the main menu immediately applies settings across Play, Review, and Engine Analysis screens without state sync lag.

---

## 3. Backend Integration Blueprint

Once the frontend code is clean, the backend can be integrated cleanly:

```mermaid
graph TD
    Client1[Web Client White] <-->|WebSocket Connection| WS[WebSocket Server / Matchmaker]
    Client2[Web Client Black] <-->|WebSocket Connection| WS
    WS <-->|Validate Moves| Core[@chess/core package]
    WS <-->|Persist Results| DB[(Database / Redis)]
```

### Matchmaking & Live Play (WebSocket Server)
- Using **Socket.io** or native WebSockets, players query `/matchmake` and join lobby pools.
- The server initializes games, generates unique IDs, and routes moves between player sockets.
- The server runs the `@chess/core` library internally to validate moves, checking if a player is attempting an illegal move or promoting a pawn illegally, securing the server against client-side hacking.

### Authentication & DB Layer
- **Authentication**: JWT or OAuth2 (Google/GitHub login) to secure endpoints.
- **Persistent Data**:
  - **User profile**: Username, current Elo rating, custom settings.
  - **Match histories**: Store PGN strings, timestamps, analysis results, and accuracies.
  - **Leaderboard**: Redis sorted sets for fast global Elo leaderboards.
