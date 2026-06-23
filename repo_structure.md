# Repository Structure and File Index

This document provides an exhaustive, recursive index of every file and folder in the repository. Each entry includes its relative path and a clear one-line description of its role within the codebase.

---

## 1. Project Configuration & Metadata (Workspace Root)

* **`.env.example`**: Template file documenting required environment variables for third-party endpoints.
* **`.gitignore`**: Directives specifying which files and folders are ignored by Git version control.
* **`.tmp-rewrite-next-imports.cjs`**: Automation scratch script for rewriting Next.js styled imports into standard Vite import pathways.
* **`.tmp-transpile-chessapp.cjs`**: Script for transpiling and migrating React components from the Analysis sub-app.
* **`ANALYSIS_APP_GUIDE.md`**: Guide explaining how to build, run, and interact with the Analysis sub-application.
* **`architecture_overview.md`**: Systems overview detailing component hierarchies and core state cycles.
* **`code_audit_report.md`**: Review document mapping duplicates, compilation flags, and optimization requirements.
* **`eslint.config.js`**: Rules configuration for code quality, formatting, and linting standards.
* **`eslint_report.json`**: Linter compilation logs mapping static checks results.
* **`FEATURES_TO_BE_ADDED.md`**: Wishlist of chess play features and UI improvements.
* **`FIXED_UI.md`**: Summary of board alignment fixes and styling updates.
* **`frontend_refactoring_plan.md`**: Strategic refactoring blueprint for breaking down the App.jsx mega-component.
* **`index.html`**: Entry HTML template that bootstraps the client bundle.
* **`lint.json`**: Linter validation status logs.
* **`netlify.toml`**: Hosting and build redirection settings for Netlify.
* **`package-lock.json`**: Exact version lock files for all dependencies.
* **`package.json`**: Core project dependencies, metadata, and build scripts.
* **`PROJECT.md`**: General project guide and directory overview.
* **`project_strategy.md`**: Blueprint for monorepo workspaces and future backend server structures.
* **`README.md`**: Quickstart documentation, build guides, and application details.
* **`structure_audit.md`**: File-by-file audit of code duplicates between play and analysis apps.
* **`test-perft.mjs`**: Performance test script measuring search speeds for the bitboard move generator.
* **`update-app.mjs`**: Scratch script automating import alias updates.
* **`update.txt`**: Scratch notes.
* **`vite.config.js`**: Vite configuration containing Tailwind settings and `@` import alias mapping.

---

## 2. Core Application Root (`src/`)

* **`src/App.jsx`**: Main client-side orchestrator that manages time controls, clocks, and game layout frames.
* **`src/index.css`**: Main stylesheet containing Tailwinds base configurations and glassmorphic UI presets.
* **`src/main.jsx`**: Bootstrapping script that renders App.jsx into the DOM root.

### A. General Utilities (`src/utils/`)
* **`src/utils/analysisProtocol.js`**: Communication protocol wrapper for web-worker interactions.
* **`src/utils/assetPath.js`**: Asset path mapper that resolves chess piece directories.
* **`src/utils/helpers.js`**: Helper methods for formatting, timers, and basic validations.
* **`src/utils/sounds.js`**: Audio utility that plays cues for chess moves, captures, checks, and checkmates.
* **`src/utils/stockfishUtils.js`**: Helper functions that parse engine options and set threads count.

### B. Shared Chess Logic (`src/shared/chess/`)
* **`src/shared/chess/analysis/accuracy.js`**: Calculates move accuracy percentages based on engine evaluations.
* **`src/shared/chess/analysis/chess.js`**: Shared chess library counting captured pieces and material differences.
* **`src/shared/chess/analysis/estimateElo.js`**: Estimates player performance rating based on move quality.
* **`src/shared/chess/analysis/lichess.js`**: Integration module querying Lichess Cloud evaluations database.
* **`src/shared/chess/analysis/math.js`**: Standard mathematical math helpers.
* **`src/shared/chess/analysis/moveClassification.js`**: Engine helper that labels moves (e.g. Brilliant, Best, Mistake, Blunder).
* **`src/shared/chess/analysis/winPercentage.js`**: Maps centipawn evaluations into win/loss percentage expectations.
* **`src/shared/chess/engine/bitboard/attacks.js`**: Look-up lists for board piece attacks.
* **`src/shared/chess/engine/bitboard/constants.js`**: Core index values for files, ranks, and squares.
* **`src/shared/chess/engine/bitboard/inBetween.js`**: Computes collision ray attack maps.
* **`src/shared/chess/engine/bitboard/magic.js`**: Magic bitboard calculator generating attacks for sliding pieces.
* **`src/shared/chess/engine/bitboard/moveGen.js`**: Move generator calculating pseudo-legal and legal chess moves.
* **`src/shared/chess/engine/bitboard/position.js`**: Maintains raw board structures, FEN parsing, and validation flags.
* **`src/shared/chess/engine/bitboard/utils.js`**: Bitwise utility tools containing popcounts and bitboard manipulation functions.
* **`src/shared/chess/engine/index.js`**: Root export module for the custom bitboard chess engine.
* **`src/shared/chess/engine/notation.js`**: Converts moves between bitboard indexes and standard algebraic notations.
* **`src/shared/chess/engine/pgn.js`**: Parsers and generators formatting chess games into PGN standard.
* **`src/shared/chess/openings/openings.js`**: Static database listing moves and names for chess openings.
* **`src/shared/chess/stockfish/helpers/parseResults.js`**: Regular expression parsers formatting raw Stockfish lines.
* **`src/shared/chess/stockfish/constants.js`**: Config settings mapping standard UCI commands.
* **`src/shared/chess/stockfish/shared.js`**: Shared helpers.
* **`src/shared/chess/stockfish/stockfish11.js`**: Config wrapper setting parameters for Stockfish 11.
* **`src/shared/chess/stockfish/stockfish16.js`**: Config wrapper setting parameters for Stockfish 16.
* **`src/shared/chess/stockfish/stockfish16_1.js`**: Config wrapper setting parameters for Stockfish 16.1.
* **`src/shared/chess/stockfish/stockfish17.js`**: Config wrapper setting parameters for Stockfish 17 (Lite).
* **`src/shared/chess/stockfish/uciEngine.js`**: Instantiates and communicates directly with Stockfish worker threads.
* **`src/shared/chess/stockfish/worker.js`**: Standardized web worker script hosting stockfish engine WASM.

### C. Frontend Features (`src/features/`)
* **`src/features/assets/useAssetManifest.js`**: Hook querying metadata lists for pieces and board themes.
* **`src/features/board/BoardContainer.jsx`**: Layout component wrapping the chessboard, clocks, and player statistics.
* **`src/features/game/GameModals.jsx`**: Presentation shell rendering settings, game over, and draw modals.
* **`src/features/game/MobileGameArea.jsx`**: Re-orders game HUDs and board items for mobile layout grids.
* **`src/features/game/useComputerMove.js`**: Custom hook listening for AI turns to trigger stockfish move calculations.
* **`src/features/game/useGameLifecycle.js`**: Manages start, reset, resign, and victory cycles.
* **`src/features/game/useMoveExecution.js`**: Triggers promotions validations, board move updates, and game evaluations.
* **`src/features/multiplayer/useMultiplayerController.js`**: Handshakes connection IDs and coordinates PeerJS multiplayer signals.
* **`src/features/navigation/ii.txt`**: Temporary directories checklist file.
* **`src/features/navigation/MobileNavigation.jsx`**: Bottom navigation buttons panel for mobile phone viewports.
* **`src/features/review/analysisHandoff.js`**: Converts game history to PGN and redirects state variables to the Analysis screen.
* **`src/features/review/useReviewController.js`**: Keeps track of review position indexes.
* **`src/features/settings/storage.js`**: Core helper setting local storage config values.
* **`src/features/settings/useUiSettings.js`**: Synchronizes settings arrays to and from browser memory stores.

### D. Global State Hooks (`src/hooks/`)
* **`src/hooks/useAnalysisBackend.js`**: Queries lichess cloud databases.
* **`src/hooks/useChessTimer.js`**: Manages precise countdown intervals for player clocks.
* **`src/hooks/useCustomAnalysisEngine.js`**: Configuration driver for user-selected engine worker targets.
* **`src/hooks/useDragAndDrop.js`**: Handles click and release events to move board pieces.
* **`src/hooks/useEngine.js`**: Handles Stockfish integrations.
* **`src/hooks/useGameEngine.js`**: Bridge hook connecting React components to the chess engine state.
* **`src/hooks/useP2PGame.js`**: Coordinates moves, clocks, and chat states across remote peer peers.
* **`src/hooks/usePawnPromotion.js`**: Controls show/hide triggers for pawn promotion moves.
* **`src/hooks/useReviewMode.js`**: Provides step navigation controls (next, prev, start, end) for game history.
* **`src/hooks/useStockfish.js`**: Orchestrates inline evaluations and best-move calculations.

### E. App Constants Presets (`src/constants/`)
* **`src/constants/boardThemes.js`**: Presets file detailing HSL board colors, background layers, and textures.
* **`src/constants/theme.js`**: Theme configuration.
* **`src/constants/uiPresets.js`**: Preset combinations linking specific board textures, themes, and styles.

### F. Reusable UI Components (`src/components/`)
* **`src/components/start/ActionButtons.jsx`**: Main menu action buttons.
* **`src/components/start/difficulty.js`**: Settings profiles mapping difficulty metrics (depth, hash size).
* **`src/components/start/StartPanelSections.jsx`**: Config sections rendering matchmaking lobbies and difficulty settings.
* **`src/components/start/styleHelpers.js`**: Utility style helpers for the start panel.
* **`src/components/ChessBoardView.jsx`**: Custom board renderer that draws squares and integrates the custom promotion dial.
* **`src/components/DrawOfferModal.jsx`**: Modal dialog for confirming draw requests.
* **`src/components/ErrorBoundary.jsx`**: React Error Boundary catcher that displays error details.
* **`src/components/EvaluationBar.css`**: Stylesheet for the evaluation bar component.
* **`src/components/EvaluationBar.jsx`**: Vertical progress bar representing the balance of the board.
* **`src/components/GameOverModal.jsx`**: Modal dialog detailing game outcome (mate, draw, resign).
* **`src/components/GamePanel.jsx`**: HUD side panel logging moves and history lists.
* **`src/components/GameSettingsModal.jsx`**: Dialog window adjusting time controls and delay presets.
* **`src/components/MobileStartGamePanel.jsx`**: Grid menu loading match controls on mobile screens.
* **`src/components/ModeSelectScreen.jsx`**: Start screen overlay displaying the game options menu.
* **`src/components/MultiplayerLobbyScreen.jsx`**: Network room interface linking match invitations.
* **`src/components/PawnPromotionUI.jsx`**: Semicircular radial glassmorphic promotion selector.
* **`src/components/PlayerCard.jsx`**: Header cards containing clock counters and material balance metrics.
* **`src/components/ReviewModeControls.jsx`**: Nav buttons allowing users to review matches move-by-move.
* **`src/components/RightPanel.jsx`**: Dashboard displaying evaluation details, line evaluations, and game graphs.
* **`src/components/SettingsModal.jsx`**: Core menu adjusting piece assets, sounds, and textures.
* **`src/components/Sidebar.jsx`**: Vertical sidebar menu.

---

## 3. The Analysis Application Sub-Directory (`src/analysis/`)

* **`src/analysis/review/analysisState.js`**: Jotai atom declarations for review metrics.
* **`src/analysis/screens/AnalysisScreen.jsx`**: Wrapper screen component mounting the Analysis App.

### A. NextJS Compatibility Layout Shims (`src/analysis/chessapp/shims/`)
* **`src/analysis/chessapp/shims/fontLocal.js`**: Fonts resolver.
* **`src/analysis/chessapp/shims/head.jsx`**: Shim replacing `<Head>` meta insertions.
* **`src/analysis/chessapp/shims/image.jsx`**: Shim replacing NextJS `<Image>` assets elements.
* **`src/analysis/chessapp/shims/link.jsx`**: Shim replacing NextJS `<Link>` navigation paths.
* **`src/analysis/chessapp/shims/router.js`**: Shim replacing NextJS page router hook `useRouter()`.
* **`src/analysis/chessapp/shims/sentry.js`**: Diagnostics logging shims.
* **`src/analysis/chessapp/shims/sentryReact.js`**: React-specific diagnostics logging shims.

### B. Core Types & Constants (`src/analysis/chessapp/`)
* **`src/analysis/chessapp/constants.js`**: HSL color schemes.
* **`src/analysis/chessapp/types/chessCom.js`**: Types maps for Chess.com game objects.
* **`src/analysis/chessapp/types/engine.js`**: Types maps for Stockfish configurations.
* **`src/analysis/chessapp/types/enums.js`**: Core enumerations (Color, MoveClassification, GameMode).
* **`src/analysis/chessapp/types/eval.js`**: Types maps for evaluation outputs.
* **`src/analysis/chessapp/types/game.js`**: Types maps for chess game profiles.
* **`src/analysis/chessapp/types/lichess.js`**: Types maps for Lichess API responses.

### C. Client Libraries & State Controllers (`src/analysis/chessapp/lib/` & `hooks/`)
* **`src/analysis/chessapp/lib/chessCom.js`**: Queries Chess.com API endpoints.
* **`src/analysis/chessapp/lib/firebase.js`**: Firebase configuration.
* **`src/analysis/chessapp/lib/helpers.js`**: Misc utility formatting helpers.
* **`src/analysis/chessapp/lib/publicPath.js`**: Prepends static public pathing prefixes.
* **`src/analysis/chessapp/lib/sentry.js`**: Sentry configuration.
* **`src/analysis/chessapp/lib/sounds.js`**: Audio utility wrapping sound file paths.
* **`src/analysis/chessapp/hooks/useChessActions.js`**: Coordinates chess moves and history index shifts.
* **`src/analysis/chessapp/hooks/useEngine.js`**: Instantiates local engine worker profiles.
* **`src/analysis/chessapp/hooks/useGameDatabase.js`**: Handles IndexedDB calls to store game reviews.

### D. Interactive UI Components (`src/analysis/chessapp/components/`)
* **`src/analysis/chessapp/components/board/capturedPieces.jsx`**: Captured pieces icons indicator.
* **`src/analysis/chessapp/components/board/evaluationBar.jsx`**: Vertical centipawn progress indicator.
* **`src/analysis/chessapp/components/board/index.jsx`**: Chessboard component mapping `react-chessboard` triggers.
* **`src/analysis/chessapp/components/board/playerHeader.jsx`**: Cards rendering player usernames.
* **`src/analysis/chessapp/components/board/squareRenderer.jsx`**: Custom renderer displaying square highlights.
* **`src/analysis/chessapp/components/board/states.js`**: State atoms (e.g., pieceSetAtom, boardHueAtom).

### E. App Layout and Shims Entry (`src/analysis/chessapp/pages/`)
* **`src/analysis/chessapp/pages/index.jsx`**: High-level page component routing sub-panels.

### F. Page Sections Logic (`src/analysis/chessapp/sections/`)
* **`src/analysis/chessapp/sections/layout/index.jsx`**: Base layout styling shell.
* **`src/analysis/chessapp/sections/engineSettings/arrowOptions.jsx`**: Select config items for arrows.
* **`src/analysis/chessapp/sections/engineSettings/engineSettingsButton.jsx`**: Settings button.
* **`src/analysis/chessapp/sections/engineSettings/engineSettingsDialog.jsx`**: Dialog window adjusting engine parameters.

#### Section: Load Game Overlays (`src/analysis/chessapp/sections/loadGame/`)
* **`src/analysis/chessapp/sections/loadGame/chessComInput.jsx`**: Input interface querying Chess.com profile games.
* **`src/analysis/chessapp/sections/loadGame/gamePgnInput.jsx`**: Text area input accepting copy-pasted PGN strings.
* **`src/analysis/chessapp/sections/loadGame/lichessInput.jsx`**: Input interface querying Lichess profile games.
* **`src/analysis/chessapp/sections/loadGame/loadGameButton.jsx`**: Button displaying the loader dialog.
* **`src/analysis/chessapp/sections/loadGame/loadGameDialog.jsx`**: Tabbed dialog layout container.
* **`src/analysis/chessapp/sections/loadGame/gameItem/dateChip.jsx`**: Chip element displaying game dates.
* **`src/analysis/chessapp/sections/loadGame/gameItem/gameResultChip.jsx`**: Chip element displaying game result.
* **`src/analysis/chessapp/sections/loadGame/gameItem/index.jsx`**: ListItem displaying matched games details.
* **`src/analysis/chessapp/sections/loadGame/gameItem/movesNbChip.jsx`**: Chip displaying total number of moves.
* **`src/analysis/chessapp/sections/loadGame/gameItem/timeControlChip.jsx`**: Chip displaying game time control.

#### Section: Play versus AI Layout (`src/analysis/chessapp/sections/play/`)
* **`src/analysis/chessapp/sections/play/board.jsx`**: Chessboard layout wrapper.
* **`src/analysis/chessapp/sections/play/gameInProgress.jsx`**: Game HUD.
* **`src/analysis/chessapp/sections/play/gameRecap.jsx`**: Post-match stats overlay.
* **`src/analysis/chessapp/sections/play/states.js`**: Local state atoms.
* **`src/analysis/chessapp/sections/play/undoMoveButton.jsx`**: Button allowing players to undo turns.
* **`src/analysis/chessapp/sections/play/gameSettings/gameSettingsButton.jsx`**: Config button.
* **`src/analysis/chessapp/sections/play/gameSettings/gameSettingsDialog.jsx`**: Dialog window selecting difficulty.

#### Section: Game Engine Analysis Panel (`src/analysis/chessapp/sections/analysis/`)
* **`src/analysis/chessapp/sections/analysis/states.js`**: State atoms (e.g., gameAtom, boardAtom).
* **`src/analysis/chessapp/sections/analysis/board/index.jsx`**: Bitboard analysis board binding `ChessBoardView.jsx`.

##### Sub-Section: Panel headers (`src/analysis/chessapp/sections/analysis/panelHeader/`)
* **`src/analysis/chessapp/sections/analysis/panelHeader/analyzeButton.jsx`**: Button enabling engine evaluation calculation.
* **`src/analysis/chessapp/sections/analysis/panelHeader/gamePanel.jsx`**: HUD displaying active match information.
* **`src/analysis/chessapp/sections/analysis/panelHeader/index.jsx`**: Main header layout container.
* **`src/analysis/chessapp/sections/analysis/panelHeader/loadGame.jsx`**: Button trigger displaying load game inputs.

##### Sub-Section: Panel toolbars (`src/analysis/chessapp/sections/analysis/panelToolbar/`)
* **`src/analysis/chessapp/sections/analysis/panelToolbar/flipBoardButton.jsx`**: Button that rotates the board.
* **`src/analysis/chessapp/sections/analysis/panelToolbar/goToLastPositionButton.jsx`**: Button that jumps to the final move.
* **`src/analysis/chessapp/sections/analysis/panelToolbar/index.jsx`**: Panel toolbar container.
* **`src/analysis/chessapp/sections/analysis/panelToolbar/nextMoveButton.jsx`**: Button that increments the move index.
* **`src/analysis/chessapp/sections/analysis/panelToolbar/saveButton.jsx`**: Button that saves analysis records to IndexedDB.

##### Sub-Section: Panel bodies (`src/analysis/chessapp/sections/analysis/panelBody/`)
* **`src/analysis/chessapp/sections/analysis/panelBody/classificationTab/index.jsx`**: Tab controller layout.
* **`src/analysis/chessapp/sections/analysis/panelBody/classificationTab/movesClassificationsRecap/index.jsx`**: Classification stats.
* **`src/analysis/chessapp/sections/analysis/panelBody/classificationTab/movesClassificationsRecap/classificationRow.jsx`**: Grid row displaying classification metrics (e.g. Blunders).
* **`src/analysis/chessapp/sections/analysis/panelBody/classificationTab/movesPanel/index.jsx`**: Moves list.
* **`src/analysis/chessapp/sections/analysis/panelBody/classificationTab/movesPanel/moveItem.jsx`**: Line items displaying classification indicators.
* **`src/analysis/chessapp/sections/analysis/panelBody/classificationTab/movesPanel/movesLine.jsx`**: Row showing move values.
* **`src/analysis/chessapp/sections/analysis/panelBody/graphTab/index.jsx`**: Line chart showing evaluation curves.
* **`src/analysis/chessapp/sections/analysis/panelBody/graphTab/dot.jsx`**: Dot rendering engine evaluations inside the graph.
* **`src/analysis/chessapp/sections/analysis/panelBody/graphTab/tooltip.jsx`**: Hover tooltip mapping move indexes to scores.
* **`src/analysis/chessapp/sections/analysis/panelBody/graphTab/types.js`**: Type configurations.
* **`src/analysis/chessapp/sections/analysis/panelBody/analysisTab/index.jsx`**: Tab showing current move evaluations.
* **`src/analysis/chessapp/sections/analysis/panelBody/analysisTab/moveInfo.jsx`**: Move classification and PGN tags.
* **`src/analysis/chessapp/sections/analysis/panelBody/analysisTab/opening.jsx`**: Display panel showing active opening lines names.
* **`src/analysis/chessapp/sections/analysis/panelBody/analysisTab/playersMetric.jsx`**: Computes win percentage and Elo.
* **`src/analysis/chessapp/sections/analysis/panelBody/analysisTab/engineLines/index.jsx`**: Lists calculated PV lines.
* **`src/analysis/chessapp/sections/analysis/panelBody/analysisTab/engineLines/lineEvaluation.jsx`**: Renders PV lines moves lists.
