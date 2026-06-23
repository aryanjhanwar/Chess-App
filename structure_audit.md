# Codebase Structure & Duplication Audit Report

This report outlines structural inconsistencies, redundant logic, and duplicated components between the **Main Chess Application** (`src/`) and the **Analysis Application** (`src/analysis/`). Addressing these issues will unify the codebase, improve performance, and reduce code maintenance churn.

---

## 1. Core Logic & Utility Duplications

### A. Sound Player Utilities
- **Main App**: `src/utils/sounds.js`
- **Analysis App**: `src/analysis/chessapp/lib/sounds.js`
- **Problem**: Both modules map move classifications (standard moves, captures, checks, castles, promotions, illegal moves) to audio assets (`/sounds/*.mp3`) and export play functions.
- **Proposed Solution**: Consolidate into `src/shared/chess/sounds/sounds.js` and share a single unified sound playing interface that respects a single volume configuration.

### B. Stockfish Engine Interfaces (`useEngine` / `useStockfish`)
- **Main App**: `src/hooks/useStockfish.js` and `src/hooks/useEngine.js`
- **Analysis App**: `src/analysis/chessapp/hooks/useEngine.js`
- **Problem**: Both hook sets load WASM/JS engine profiles, instantiate engine worker scripts, dispatch UCI messages (`go`, `position`, `stop`), and parse pv/eval lines.
- **Proposed Solution**: Consolidation into a single custom React hook inside `src/shared/chess/stockfish/useStockfishEngine.js` which manages state and web-worker instances.

### C. Game / Move Navigators
- **Main App**: `src/hooks/useGameEngine.js` / `src/features/game/useMoveExecution.js`
- **Analysis App**: `src/analysis/chessapp/hooks/useChessActions.js`
- **Problem**: Both files wrap `chess.js` to handle history indexing (forward/backward moves, goto start/end) and playing moves with safety bounds.
- **Proposed Solution**: Share a unified `useChessController` hook under `src/shared/chess/hooks/useChessController.js`.

### D. Asset Path Utilities
- **Main App**: `src/utils/assetPath.js`
- **Analysis App**: `src/analysis/chessapp/lib/publicPath.js`
- **Problem**: Both provide helper functions to prepend base paths or resolve URLs for images and sound files.
- **Proposed Solution**: Consolidate into `src/shared/chess/utils/assetPath.js`.

---

## 2. Component & UI Duplications

### A. Evaluation Bar
- **Main App**: `src/components/EvaluationBar.jsx` & `src/components/EvaluationBar.css`
- **Analysis App**: `src/analysis/chessapp/components/board/evaluationBar.jsx`
- **Problem**: Both calculate fill heights/widths based on centipawn evaluations or mate counts. They are styled slightly differently and maintain separate rendering trees.
- **Proposed Solution**: Unify into a single, clean glassmorphic component in `src/components/EvaluationBar.jsx` that accepts the evaluation state as props.

### B. Captured Pieces / Material Differentials
- **Main App**: Included in `src/components/PlayerCard.jsx`
- **Analysis App**: `src/analysis/chessapp/components/board/capturedPieces.jsx`
- **Problem**: Both count material balances and output visual arrays of captured piece icons.
- **Proposed Solution**: Extract the count logic into `src/shared/chess/analysis/chess.js` and implement a reusable `CapturedPiecesList` component in `src/components/CapturedPiecesList.jsx`.

### C. Settings and Theme Dialogs
- **Main App**: `src/components/SettingsModal.jsx` and `src/components/GameSettingsModal.jsx`
- **Analysis App**: `src/analysis/chessapp/sections/engineSettings/engineSettingsDialog.jsx` and `src/analysis/chessapp/sections/play/gameSettings/gameSettingsDialog.jsx`
- **Problem**: Both configure settings like Stockfish threads/workers, search depth, board theme colors, custom chess pieces, and sound configurations.
- **Proposed Solution**: Create a shared modal configuration interface that handles general display settings and binds configuration inputs to state.

---

## 3. Architectural Inconsistencies (Code Messiness)

### A. Mixed Board Rendering Libraries
- **Main App**: Uses a custom, high-performance HTML/SVG board renderer: `src/components/ChessBoardView.jsx` (which supports dragging, animations, custom piece imagery, and inline radial promotions).
- **Analysis App**:
  1. The **Analysis Panel** uses `ChessBoardView.jsx`.
  2. The **Versus-Computer Play Section** uses a third-party wrapper library: `react-chessboard` in `src/analysis/chessapp/components/board/index.jsx`.
- **Problem**: This creates code bloat, increases bundle size, and results in visual design discrepancies (e.g. dragging behavior, highlights, and radial promotion menus differ between screens).
- **Proposed Solution**: Completely replace `react-chessboard` references in the analysis app with the custom `ChessBoardView.jsx` component. This consolidates rendering logic and guarantees visual uniformity.

### B. Fragmented State Stores
- **Main App**: Utilizes standard React `useState` hooks, local storage sync hooks (`useUiSettings`), and prop-drilling/callback routing.
- **Analysis App**: Relies heavily on **Jotai** atoms for cross-component reactive state.
- **Problem**: Theme adjustments (e.g., switching piece set to *Staunty* or board style to *Classic Blue*) in the Main app settings do not sync with the Analysis app screen because they update completely separate state stores.
- **Proposed Solution**: Consolidation of UI settings, themes, and sound states into a single unified Jotai or React Context store.

### C. Inline Theme Logic
- **Main App**: Configures board colors, light/dark squares, textures, and background presets inline using `useMemo` hooks.
- **Analysis App**: Generates spin-hues and color presets separately in its board components.
- **Proposed Solution**: Consolidate theme presets and texture assets into a unified theme hook under `src/shared/themes/useBoardTheme.js` so that color schemes, piece sizes, and textures render consistently across all views.
