# Analysis App Guide

This file explains the analysis feature in this repository. It is meant to be a practical reference for the structure, main files, responsibilities, and data flow of the analysis experience.

## 1. What this app is

The analysis app is a separate, lazily loaded chess-analysis experience inside the repository. It is built around:

- a chess board view
- game loading from PGN, Lichess, or Chess.com
- engine-based analysis
- move classification and evaluation graphs
- persistence through IndexedDB

It is distinct from the main play app and is organized as its own feature area under src/analysis/chessapp.

## 2. Main entry points

### src/analysis/chessapp/pages/index.jsx
This is the main page for the analysis experience. It composes the board area, the analysis panel, and the available tabs.

### src/analysis/chessapp/sections/layout/index.jsx
This acts as the overall layout shell for the analysis workspace. It provides the surrounding app frame and shared layout state.

## 3. Folder structure overview

The analysis app is organized into the following folders:

- components: reusable UI pieces
- hooks: state and behavior hooks
- lib: helper modules and engine integration utilities
- pages: page entry points
- sections: feature-specific UI sections
- shims: compatibility wrappers
- types: enums and type definitions
- data: static data helpers

## 4. Components folder

### src/analysis/chessapp/components/LinearProgressBar.jsx
A simple progress bar used while analysis is running or loading data.

### src/analysis/chessapp/components/pageTitle.jsx
A title/heading component used for section headers.

### src/analysis/chessapp/components/slider.jsx
A reusable slider control used by settings or tuning UI.

### src/analysis/chessapp/components/prettyMoveSan/index.jsx
Renders SAN notation nicely in the analysis UI.

### src/analysis/chessapp/components/board/index.jsx
The main board surface for the analysis experience. It brings together board visuals, player headers, evaluation display, and move interactions.

### src/analysis/chessapp/components/board/capturedPieces.jsx
Displays pieces captured by each side and the resulting material balance.

### src/analysis/chessapp/components/board/evaluationBar.jsx
Shows the engine evaluation visually as a bar.

### src/analysis/chessapp/components/board/playerHeader.jsx
Renders information about each player above the board.

### src/analysis/chessapp/components/board/squareRenderer.jsx
Handles square-level rendering, highlights, move indicators, and styling based on move classification.

## 5. Hooks folder

### src/analysis/chessapp/hooks/useAtomLocalStorage.js
Keeps Jotai atom values synchronized with browser storage.

### src/analysis/chessapp/hooks/useChessActions.js
The main hook for mutating the game state. It wraps chess.js actions such as reset, move, undo, and navigation through moves.

### src/analysis/chessapp/hooks/useDebounce.js
A simple debounce helper used by remote game lookup inputs.

### src/analysis/chessapp/hooks/useEngine.js
Handles engine selection and engine-support checks for analysis.

### src/analysis/chessapp/hooks/useGameData.js
Derives metadata and context from the current game state.

### src/analysis/chessapp/hooks/useGameDatabase.js
Provides IndexedDB persistence for saving, loading, updating, and deleting analysis games.

### src/analysis/chessapp/hooks/useLocalStorage.js
A generic hook for reading and writing from local storage.

### src/analysis/chessapp/hooks/usePlayersData.js
Fetches or resolves player names, ratings, and avatars for the loaded game.

### src/analysis/chessapp/hooks/useScreenSize.js
Measures screen or viewport size so the board can resize properly.

## 6. Lib folder

### src/analysis/chessapp/lib/helpers.js
General-purpose helper functions used across the analysis app.

### src/analysis/chessapp/lib/math.js
Small math helpers used in evaluation and display logic.

### src/analysis/chessapp/lib/publicPath.js
Helps build correct asset paths for the deployed app.

### src/analysis/chessapp/lib/sentry.js
Sentry integration helper for error reporting.

### src/analysis/chessapp/lib/sounds.js
Audio helpers for move-related and error sounds.

### src/analysis/chessapp/lib/chess.js
Core chess logic helpers for PGN parsing, move-line conversion, notation, and evaluation formatting.

### src/analysis/chessapp/lib/chessCom.js
Fetches game data from Chess.com.

### src/analysis/chessapp/lib/lichess.js
Fetches game data from Lichess.

### src/analysis/chessapp/lib/firebase.js
Simple analytics or event logging helper.

## 7. Engine integration

The analysis app uses a dedicated engine layer under src/analysis/chessapp/lib/engine.

### src/analysis/chessapp/lib/engine/shared.js
Shared support logic for engine selection and capability checks.

### src/analysis/chessapp/lib/engine/worker.js
Worker-related helpers for the engine lifecycle.

### src/analysis/chessapp/lib/engine/uciEngine.js
The main wrapper that runs the engine and collects UCI/analysis output.

### src/analysis/chessapp/lib/engine/stockfish11.js
Wrapper for the Stockfish 11 bundle.

### src/analysis/chessapp/lib/engine/stockfish16.js
Wrapper for the Stockfish 16 bundle.

### src/analysis/chessapp/lib/engine/stockfish16_1.js
Wrapper for the Stockfish 16.1 bundle.

### src/analysis/chessapp/lib/engine/stockfish17.js
Wrapper for the Stockfish 17 bundle.

### Engine helpers

- accuracy.js calculates player accuracy.
- estimateElo.js estimates Elo from engine data.
- moveClassification.js classifies moves as strong, weak, blunder, mistake, or best.
- parseResults.js parses engine output into structured analysis objects.
- winPercentage.js converts evaluation into win/chance estimates.

## 8. Sections folder

### Analysis section
This is the main analysis workspace UI.

- src/analysis/chessapp/sections/analysis/states.js contains shared analysis-state atoms.
- src/analysis/chessapp/sections/analysis/hooks/useCurrentPosition.js derives the current position and evaluation context.
- src/analysis/chessapp/sections/analysis/board/index.jsx renders the board inside the analysis panel.

### Panel header
These files handle the top area of the analysis pane:

- panelHeader/index.jsx
- panelHeader/gamePanel.jsx
- panelHeader/loadGame.jsx
- panelHeader/analyzeButton.jsx

### Panel toolbar
These files handle navigation and quick actions:

- panelToolbar/index.jsx
- panelToolbar/flipBoardButton.jsx
- panelToolbar/goToLastPositionButton.jsx
- panelToolbar/nextMoveButton.jsx
- panelToolbar/saveButton.jsx

### Panel body
The main analysis UI is split into three tabs:

- analysisTab: engine evaluation, accuracy, move info, and opening information
- classificationTab: move-quality breakdowns and recap cards
- graphTab: evaluation chart rendered with Recharts

### Layout section
The layout section provides the overall shell and surrounding structure.

### Engine settings section
This area contains the engine settings dialog and related controls.

### Load game section
This area handles importing a game from:

- PGN text input
- Lichess
- Chess.com

### Play section
This area supports play-style flows and recap screens inside the analysis app.

## 9. Types folder

The types folder contains shared type definitions and enums used throughout the analysis app:

- enums.js
- engine.js
- eval.js
- game.js
- chessCom.js
- lichess.js

## 10. Data folder

### src/analysis/chessapp/data/openings.js
Contains opening data used by the opening display in the analysis panel.

## 11. How the app works conceptually

The analysis app follows a layered structure:

1. UI layer
   - pages, sections, and components show the board and analysis views

2. State layer
   - Jotai atoms and hooks manage the current game, board state, and analysis state

3. Engine layer
   - Stockfish wrappers and helpers produce evaluations and classifications

4. Data layer
   - IndexedDB and remote fetchers store and import games

## 12. Summary

In short, the analysis app is a modular feature built from:

- a board UI and analysis panel
- game loading flows
- engine evaluation and move classification
- persistence and remote game import
- reusable helper modules and state hooks

It is organized to keep the chess logic, engine integration, UI, and persistence concerns separated.
