# Complete Application Architecture Overview

This document provides a detailed breakdown of the entire codebase architecture, outlining the purpose of every directory and file in the `src/` folder. The application is a highly advanced React-based Chess engine and analysis suite, integrating custom bitboard logic, Stockfish, and a fully-featured UI.

## 1. `src/components/` (Core UI Components)
This directory houses the foundational React components used to render the application.

- **`ChessBoardView.jsx`**: The core presentational component that renders the 8x8 grid, pieces, valid move indicators, and coordinates.
- **`EvaluationBar.jsx` / `EvaluationBar.css`**: The vertical bar indicating the current engine evaluation advantage (white vs black).
- **`Sidebar.jsx`**: The left-hand navigation and settings menu.
- **`RightPanel.jsx`**: The right-hand panel containing move history, engine lines, and controls.
- **`GamePanel.jsx`**: Manages the main play area containing the board and evaluation bar.
- **`PlayerCard.jsx`**: Renders a player's name, color, and captured pieces.
- **`DrawOfferModal.jsx` / `GameOverModal.jsx` / `GameSettingsModal.jsx` / `PawnPromotionUI.jsx` / `SettingsModal.jsx`**: Various popups and modals for game state interactions.
- **`ReviewModeControls.jsx`**: UI controls for navigating backwards and forwards through game history.
- **`MobileStartGamePanel.jsx` / `ModeSelectScreen.jsx` / `MultiplayerLobbyScreen.jsx`**: Components for setting up and initiating new games (P2P, Local, Computer).
- **`ErrorBoundary.jsx`**: React error boundary to gracefully catch and display rendering crashes.
- **`start/`**: Contains components specifically for the start/lobby screens (`ActionButtons.jsx`, `difficulty.js`, `StartPanelSections.jsx`, `styleHelpers.js`).

## 2. `src/engine/` (Core Bitboard Chess Engine)
This is the mathematical heart of the application, implementing chess logic entirely using 64-bit integers (Bitboards) for maximum performance.

- **`index.js`**: Main entry point exposing the engine API.
- **`notation.js`**: Translates internal moves to algebraic notation (e.g., e2e4 to e4).
- **`pgn.js`**: Parses and generates Portable Game Notation strings.
- **`bitboard/`**: 
  - `attacks.js`: Pre-calculated attack rays and patterns for pieces.
  - `constants.js`: Mathematical bitboard constants (files, ranks, diagonals).
  - `inBetween.js`: Ray intersection calculations for sliding pieces.
  - `init.js`: Initialization scripts for the engine state.
  - `magic.js`: Magic bitboard hashing for ultra-fast sliding piece move generation.
  - `moveGen.js`: The pseudo-legal and legal move generator.
  - `position.js`: Handles board state representation, making/unmaking moves, and fen strings.
  - `utils.js`: Bit manipulation utilities (popcount, LSB, MSB).

## 3. `src/hooks/` (React Integration Hooks)
These hooks bridge the raw mathematical logic/state with React's reactivity system.

- **`useGameEngine.js`**: The master hook that wraps the bitboard engine and exposes React state (board arrays, valid moves, check state).
- **`useStockfish.js`**: WebWorker interface connecting to Stockfish for computer moves and evaluation.
- **`useCustomAnalysisEngine.js` / `useAnalysisBackend.js`**: Hooks for driving the deep-analysis tab.
- **`useP2PGame.js`**: WebRTC/Socket hook for peer-to-peer multiplayer.
- **`useEngine.js`**: A standardized interface hook for interacting with UCI engines.
- **`useChessTimer.js`**: Handles blitz/bullet time controls.
- **`useDragAndDrop.js`**: Manages the complex state of picking up and dropping pieces.
- **`usePawnPromotion.js` / `useReviewMode.js`**: Specialized hooks for their respective domains.

## 4. `src/features/` (Domain-Specific Logic)
This directory organizes the application by feature domains rather than technical type.

- **`board/`**: `BoardContainer.jsx` (Orchestrates the layout of the `ChessBoardView` and `EvaluationBar`).
- **`game/`**: `GameModals.jsx`, `MobileGameArea.jsx`, `useComputerMove.js`, `useGameLifecycle.js`, `useMoveExecution.js` (Handles the life-cycle of a game, from start to checkmate).
- **`multiplayer/`**: `useMultiplayerController.js` (Manages networking state).
- **`navigation/`**: `MobileNavigation.jsx` (Mobile-specific routing).
- **`review/`**: `analysisHandoff.js`, `useReviewController.js` (Logic for post-game review).
- **`settings/`**: `storage.js`, `useUiSettings.js` (Local storage syncing for user preferences).
- **`assets/`**: `useAssetManifest.js` (Pre-loading logic for piece SVGs and themes).

## 5. `src/analysis/` (Deep Analysis Suite)
A massive, self-contained sub-application dedicated purely to post-game analysis (likely ported or adapted from an advanced open-source analysis tool).

- **`chessapp/components/`**: 
  - `board/` (`evaluationBar.jsx`, `capturedPieces.jsx`): Analysis-specific implementations of board elements.
  - `classification/` (`badge.jsx`, `icon.jsx`): Renders "Brilliant", "Blunder", "Inaccuracy" icons.
  - `ui/`: Standard UI elements used throughout the analysis tab.
- **`chessapp/sections/analysis/`**:
  - `board/` (`index.jsx`): The container for the board within the analysis tab.
  - `panelBody/`:
    - `analysisTab/` (`index.jsx`, `moveInfo.jsx`, `opening.jsx`, `playersMetric.jsx`): The main statistical readout.
    - `engineLines/`: Displays multiple lines of Stockfish thought.
    - `classificationTab/`: Breakdown of game accuracy.
    - `movesPanel/`: The interactive move list.
    - `graphTab/`: The evaluation advantage chart.
  - `panelHeader/`: Loading games and layout switching.
  - `panelToolbar/`: Navigation controls.
- **`chessapp/lib/`**: Deep engine calculations, UCI wrapper (`uciEngine.js`), and accuracy math (`accuracy.js`, `estimateElo.js`, `winPercentage.js`).
- **`chessapp/types/`**: Enums and JSDoc types for Lichess/Chess.com APIs.
- **`chessapp/shims/`**: Compatibility layers (`router.js`, `sentry.js`) for integrating this suite.

## 6. `src/lib/` (Core Libraries)
- **`chess.js`**: Core chess wrappers.
- **`math.js`**: Math utilities.
- **`engine/`**: 
  - Contains all compiled WebAssembly WebWorkers for Stockfish (`stockfish11.js`, `stockfish16.js`, `stockfish16_1.js`, `stockfish17.js`, `worker.js`).
  - `helpers/`: Scripts for classifying moves (`moveClassification.js`), calculating accuracy, and parsing engine output.

## 7. `src/constants/` & `src/data/` (Static Configuration)
- **`boardThemes.js` / `theme.js` / `uiPresets.js`**: Hardcoded color palettes, hex codes, and CSS definitions for the visual themes.
- **`openings.js`**: A database/trie of chess openings (ECO codes) used to name openings during play (e.g., "Sicilian Defense").

## 8. `src/contexts/` (React Contexts)
- **`AppViewContext.jsx`**: The global state provider that dictates which main screen the user is on (e.g., 'play', 'analysis', 'multiplayer').

## 9. `src/utils/` (General Utilities)
- **`analysisProtocol.js`**: Translates between the main app's format and the `src/analysis` sub-application format.
- **`assetPath.js`**: Resolves dynamic paths for SVGs and sounds based on user settings.
- **`helpers.js`**: Generic debouncing/throttling and UI utilities.
- **`sounds.js`**: Audio playback manager for move sounds, captures, and check alerts.
- **`stockfishUtils.js`**: Utilities for parsing deep Stockfish UCI stdout output into standard JSON arrays.

## 10. `src/screens/`
- **`AnalysisScreen.jsx`**: The top-level wrapper that mounts the `src/analysis/` suite into the main React DOM tree.

## 11. `src/shared/`
Contains abstracted logic (`useBoardAppearance.js`, `useUiSettings.js`) meant to be shared cleanly between the main game, the review mode, and the analysis mode.
