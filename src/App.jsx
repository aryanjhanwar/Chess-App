import { useState, useEffect, useRef, useMemo } from 'react'
import { generatePGN, getPGNResult, formatPGNTimeControl } from '@/shared/chess/engine/pgn.js'
import { useChessTimer } from './hooks/useChessTimer'
import { useGameEngine, isPromotionTag, getPromotionPieceType } from './hooks/useGameEngine'
import { usePawnPromotion } from './hooks/usePawnPromotion'
import { useReviewMode } from './hooks/useReviewMode'
import { playMoveSound, playCaptureSound, playCheckSound, playCastleSound, playGameStartSound, playGameEndSound, playPromotionSound, setSoundPreferences } from './utils/sounds'
import Sidebar from './components/Sidebar'
import RightPanel from './components/RightPanel'
import GamePanel from './components/GamePanel'
import PawnPromotionUI from './components/PawnPromotionUI'
import GameOverModal from './components/GameOverModal'
import DrawOfferModal from './components/DrawOfferModal'
import { BACKGROUND_PRESETS, DEFAULT_UI_SETTINGS, BOARD_THEME_MAP, BOARD_TEXTURE_MAP } from './constants/boardThemes'
import { THEME_PRESET_MAP } from './constants/uiPresets.js'
import SettingsModal from './components/SettingsModal'
import GameSettingsModal from './components/GameSettingsModal'
import ModeSelectScreen from './components/ModeSelectScreen'
import MultiplayerLobbyScreen from './components/MultiplayerLobbyScreen'
import { initBitboardEngine } from '@/shared/chess/engine/index.js'
import { useStockfish } from './hooks/useStockfish'
import { useP2PGame } from './hooks/useP2PGame'
import BoardContainer from './features/board/BoardContainer';
import MobileNavigation from './features/navigation/MobileNavigation';
import MobileGameArea from './features/game/MobileGameArea';
import GameModals from './features/game/GameModals';
import { useAssetManifest } from './features/assets/useAssetManifest';
import { useAtomValue } from 'jotai';
import { uiSettingsAtom } from './state/themeState';
import { sanitizeUiSettings, readStoredJson } from './features/settings/storage';
import { useReviewController } from './features/review/useReviewController';
import { useMultiplayerController } from './features/multiplayer/useMultiplayerController';
import { useGameLifecycle } from './features/game/useGameLifecycle';
import { useMoveExecution } from './features/game/useMoveExecution';
import { useComputerMove } from './features/game/useComputerMove';
import { openGameAnalysis } from './features/review/analysisHandoff';
import {
  getDifficultySettings,
  ENGINE_PROFILES,
  DEFAULT_ENGINE_PROFILE,
  DEFAULT_LIVE_EVAL_SETTINGS,
  DEFAULT_ANALYSIS_SETTINGS,
  clampLiveEvalSettings,
  clampAnalysisSettings,
} from './utils/stockfishUtils'
import { buildPieceImages } from './constants/theme'

const UI_STATES = {
  MODE_SELECT: 'mode_select',
  MULTIPLAYER_LOBBY: 'multiplayer_lobby',
  LOCAL_GAME: 'local_game',
  GAME_OVER: 'game_over',
  REVIEW: 'review'
};

const UI_STATE_CAPABILITIES = {
  [UI_STATES.MODE_SELECT]: {
    canMovePieces: false,
    canUseInGameActions: false,
    canStartGame: false,
    canOpenMultiplayer: false,
  },
  [UI_STATES.MULTIPLAYER_LOBBY]: {
    canMovePieces: false,
    canUseInGameActions: false,
    canStartGame: false,
    canOpenMultiplayer: false,
  },
  [UI_STATES.LOCAL_GAME]: {
    canMovePieces: true,
    canUseInGameActions: true,
    canStartGame: true,
    canOpenMultiplayer: true,
  },
  [UI_STATES.GAME_OVER]: {
    canMovePieces: false,
    canUseInGameActions: false,
    canStartGame: false,
    canOpenMultiplayer: false,
  },
  [UI_STATES.REVIEW]: {
    canMovePieces: false,
    canUseInGameActions: false,
    canStartGame: false,
    canOpenMultiplayer: false,
  },
};

const STORAGE_KEYS = {
  ENGINE_PROFILE: 'stockfish_engine_profile_v1',
  LIVE_EVAL: 'stockfish_live_eval_settings_v1',
  ANALYSIS: 'stockfish_analysis_settings_v1',
  UI_SETTINGS: 'chess_ui_settings_v1',
};

function App() {
  const ANALYSIS_HANDOFF_KEY = 'chessapp_analysis_handoff_v1';

  // ── Engine init ──────────────────────────────────────────────────
  useEffect(() => {
    initBitboardEngine();
  }, []);

  // ── Game Engine ──────────────────────────────────────────────────
  const {
    displayPieces,
    legalMovesMap,
    fen,
    checkInfo,
    gameStatus,
    sideToMove,
    moveHistory,
    capturedPieces,
    lastMoveInfo,
    executeMove: engineExecuteMove,
    resetGame: engineResetGame,
    getReviewSnapshots,
  } = useGameEngine();

  const board = displayPieces;
  const currentTurn = sideToMove;
  const kingInCheckPos = checkInfo.kingSquare;
  const lastMove = lastMoveInfo;

  // ── Manual game end (resignation, draw, timeout) ────────────────
  const [manualGameEnd, setManualGameEnd] = useState(null);
  const gameState = manualGameEnd || gameStatus;

  // ── Square selection ─────────────────────────────────────────────
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);

  const clearSelection = () => {
    setSelectedSquare(null);
    setValidMoves([]);
  };

  // ── Pawn promotion ───────────────────────────────────────────────
  const {
    showPromotionUI,
    promotionSquare,
    pendingPromotionMoves,
    initiatePromotion,
    completePromotion,
    cancelPromotion
  } = usePawnPromotion();

  // ── Review mode ──────────────────────────────────────────────────
  const {
    isReviewMode,
    reviewIndex,
    reviewHistoryLength,
    isPlaying,
    enterReviewMode,
    exitReviewMode,
    goToPrevious,
    goToNext,
    goToStart,
    goToEnd,
    toggleAutoPlay,
    getCurrentReviewState,
  } = useReviewMode();

  // ── Timer state ──────────────────────────────────────────────────
  const [whiteTime, setWhiteTime] = useState(600000);
  const [blackTime, setBlackTime] = useState(600000);
  const [isTimerActive, setIsTimerActive] = useState(false);

  const [selectedTimeControl, setSelectedTimeControl] = useState({
    base: 600,
    increment: 0,
    label: '10 min',
    category: 'rapid',
    icon: '🕐'
  });

  // ── Game flow state ──────────────────────────────────────────────
  const [gameStarted, setGameStarted] = useState(false);
  const [showGameOverUI, setShowGameOverUI] = useState(false);
  const [currentPGN, setCurrentPGN] = useState('');
  const [showDrawOffer, setShowDrawOffer] = useState(false);
  const [incomingDrawOfferSide, setIncomingDrawOfferSide] = useState(null);
  const [multiplayerNotice, setMultiplayerNotice] = useState('');
  const [isBoardFlipped, setIsBoardFlipped] = useState(false);
  const [showAppSettings, setShowAppSettings] = useState(false);
  const [showGameSettings, setShowGameSettings] = useState(false);

  const [playerNames, setPlayerNames] = useState({
    white: 'White',
    black: 'Black'
  });

  // ── Mode / multiplayer state ─────────────────────────────────────
  const [entryMode, setEntryMode] = useState(null);
  const [isMultiplayerGame, setIsMultiplayerGame] = useState(false);
  const [multiplayerSide, setMultiplayerSide] = useState('w');
  const [isMultiplayerStarted, setIsMultiplayerStarted] = useState(false);

  const remoteApplyingMoveRef = useRef(false);

  // ── Computer / game mode state ───────────────────────────────────
  const [gameMode, setGameMode] = useState('human');
  const [playerColor, setPlayerColor] = useState('white');
  const [computerDifficulty, setComputerDifficulty] = useState(5);

  // ── Engine / Stockfish config (read-only, loaded once) ───────────
  const [engineProfile] = useState(() => {
    const stored = readStoredJson(
      STORAGE_KEYS.ENGINE_PROFILE,
      DEFAULT_ENGINE_PROFILE
    );
    return ENGINE_PROFILES.some(p => p.id === stored)
      ? stored
      : DEFAULT_ENGINE_PROFILE;
  });

  const [liveEvalConfig] = useState(() => {
    const stored = readStoredJson(
      STORAGE_KEYS.LIVE_EVAL,
      DEFAULT_LIVE_EVAL_SETTINGS
    );
    return clampLiveEvalSettings(stored);
  });

  const [analysisConfig] = useState(() => {
    const stored = readStoredJson(
      STORAGE_KEYS.ANALYSIS,
      DEFAULT_ANALYSIS_SETTINGS
    );
    return clampAnalysisSettings(stored);
  });

  // ── UI settings (via Jotai) ──────────────────────────────────────
  const uiSettings = useAtomValue(uiSettingsAtom);

  // ── Asset manifest ───────────────────────────────────────────────
  const {
    assetManifest,
    dynamicBoardImageMap,
    boardSurfaceOptions,
    pieceSetOptions
  } = useAssetManifest();

  // ── Board theme colors ────────────────────────────────────────────
  const boardThemeColors = useMemo(() => {
    const preset =
      BOARD_THEME_MAP[uiSettings.boardTheme] ||
      BOARD_THEME_MAP['classic-blue'];

    return {
      ...preset,
      light: uiSettings.useCustomBoardColors
        ? (uiSettings.customLightSquare || preset.light)
        : preset.light,
      dark: uiSettings.useCustomBoardColors
        ? (uiSettings.customDarkSquare || preset.dark)
        : preset.dark,
      textureImage: BOARD_TEXTURE_MAP[uiSettings.boardTexture] || null,
      boardImage: dynamicBoardImageMap[uiSettings.boardSurface] || null,
    };
  }, [
    uiSettings.boardTheme,
    uiSettings.boardSurface,
    uiSettings.customLightSquare,
    uiSettings.customDarkSquare,
    uiSettings.useCustomBoardColors,
    uiSettings.boardTexture,
    dynamicBoardImageMap,
  ]);

  const activePieceSet = uiSettings.pieceStyle || 'staunty';

  const activePieceImages = useMemo(() => {
    return buildPieceImages(
      activePieceSet,
      assetManifest.pieceFilesBySet?.[activePieceSet] || null
    );
  }, [activePieceSet, assetManifest.pieceFilesBySet]);

  const appBackgroundStyle = useMemo(() => {
    if (uiSettings.backgroundStyle === 'bg-custom-solid') {
      return {
        background:
          uiSettings.customBackgroundColor || '#17212c',
      };
    }
    return (
      BACKGROUND_PRESETS[uiSettings.backgroundStyle]?.style ||
      BACKGROUND_PRESETS['bg-classic'].style
    );
  }, [
    uiSettings.backgroundStyle,
    uiSettings.customBackgroundColor
  ]);

  // ── Analysis state ───────────────────────────────────────────────
  const [reviewDisplayState, setReviewDisplayState] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState('idle');
  const [, setAnalysisResults] = useState([]);
  const [, setAnalyzedCount] = useState(0);
  const [, setWhiteAccuracy] = useState(null);
  const [, setBlackAccuracy] = useState(null);

  const analysisRunIdRef = useRef(0);
  const analysisCacheRef = useRef(new Map());
  const liveEvalRequestKeyRef = useRef('');

  // ── Board view state ─────────────────────────────────────────────
  const [boardViewKey, setBoardViewKey] = useState(0);
  const [highlightResign, setHighlightResign] = useState(false);

  const resignHighlightTimeoutRef = useRef(null);

  // ── External hooks ────────────────────────────────────────────────
  const stockfish = useStockfish({ engineProfile });
  const p2p = useP2PGame();

  // ── Persist UI settings & sync volume ────────────────────────────
  // Note: atomWithStorage handles localStorage persistence automatically.
  // This effect only bridges the volume setting to the HTML Audio player.
  useEffect(() => {
    setSoundPreferences({ volume: uiSettings.volume ?? 0.75 });
  }, [uiSettings.volume]);


  // ── Chess timer ───────────────────────────────────────────────────
  useChessTimer({
    isTimerActive,
    gameState,
    currentTurn,
    whiteTime,
    blackTime,
    setWhiteTime,
    setBlackTime,
    setGameState: setManualGameEnd,
    setIsTimerActive,
    setShowGameOverUI
  });

  // ── Stockfish evaluation values ───────────────────────────────────
  const evalValue =
    stockfish.evaluation?.type === 'cp'
      ? stockfish.evaluation.value
      : null;

  const mateValue =
    stockfish.evaluation?.type === 'mate'
      ? stockfish.evaluation.value
      : null;

  // ── Active board state (live or review) ───────────────────────────
  const activeBoard =
    isReviewMode && reviewDisplayState
      ? reviewDisplayState.displayPieces
      : board;

  const activeKingInCheckPos =
    isReviewMode && reviewDisplayState
      ? reviewDisplayState.kingInCheckPos
      : kingInCheckPos;

  const activeLastMove =
    isReviewMode && reviewDisplayState
      ? reviewDisplayState.lastMoveInfo
      : lastMove;

  const activeCapturedPieces =
    isReviewMode && reviewDisplayState
      ? reviewDisplayState.capturedPieces
      : capturedPieces;

  const activeMoveHistory =
    isReviewMode && reviewDisplayState
      ? (reviewDisplayState.moveHistory || moveHistory)
      : moveHistory;

  // BUG-15 FIX: Check isReviewMode BEFORE showGameOverUI so that the review
  // screen is never covered by the game-over overlay.
  const uiState = useMemo(() => {
    if (!entryMode) return UI_STATES.MODE_SELECT;
    if (entryMode === 'multiplayer')
      return UI_STATES.MULTIPLAYER_LOBBY;
    if (isReviewMode) return UI_STATES.REVIEW;
    if (showGameOverUI && gameState !== 'playing')
      return UI_STATES.GAME_OVER;
    return UI_STATES.LOCAL_GAME;
  }, [
    entryMode,
    showGameOverUI,
    gameState,
    isReviewMode
  ]);

  const uiCapabilities = useMemo(() => {
    const base =
      UI_STATE_CAPABILITIES[uiState] ||
      UI_STATE_CAPABILITIES[UI_STATES.MODE_SELECT];

    const isLiveLocalGame =
      uiState === UI_STATES.LOCAL_GAME &&
      gameStarted &&
      gameState === 'playing';

    return {
      canMovePieces:
        base.canMovePieces &&
        isLiveLocalGame &&
        !showPromotionUI,

      canUseInGameActions:
        base.canUseInGameActions &&
        isLiveLocalGame,

      canStartGame:
        base.canStartGame &&
        !gameStarted,

      canOpenMultiplayer:
        base.canOpenMultiplayer &&
        !gameStarted,
    };
  }, [
    uiState,
    gameStarted,
    gameState,
    showPromotionUI
  ]);

  // ══════════════════════════════════════════════════════════════════
  // MOVE EXECUTION
  // Declared before handleSquareClick so performMove is available.
  // ══════════════════════════════════════════════════════════════════

  const { performMove } = useMoveExecution({
    engineExecuteMove,
    isMultiplayerGame,
    p2p,
    remoteApplyingMoveRef,
    currentTurn,
    moveHistory,
    playerNames,
    selectedTimeControl,
    setWhiteTime,
    setBlackTime,
    setShowGameOverUI,
    setIsTimerActive,
    setCurrentPGN,
    setManualGameEnd,
    clearSelection,
  });

  // ══════════════════════════════════════════════════════════════════
  // COMPUTER MOVE CONTROLLER
  // Declared before handleSquareClick (needs isComputerTurn) and
  // before useGameLifecycle (needs makeComputerMove).
  // BUG-01/12 FIX: Real makeComputerMove is created here and passed
  // to useGameLifecycle below — never use a stub.
  // ══════════════════════════════════════════════════════════════════

  const { makeComputerMove, isComputerTurn } = useComputerMove({
    stockfish,
    gameMode,
    uiCapabilities,
    fen,
    legalMovesMap,
    currentTurn,
    playerColor,
    computerDifficulty,
    performMove,
  });

  // ══════════════════════════════════════════════════════════════════
  // CLICK HANDLING
  // Both performMove and isComputerTurn are now defined above.
  // ══════════════════════════════════════════════════════════════════

  const handleSquareClick = (displayRow, displayCol) => {
    if (!uiCapabilities.canMovePieces) return;

    // Block human input when it's the computer's turn
    if (isComputerTurn()) return;

    // In multiplayer, each player can move only their own side.
    if (isMultiplayerGame && currentTurn !== multiplayerSide) return;

    const rowIndex = isBoardFlipped ? 7 - displayRow : displayRow;
    const colIndex = isBoardFlipped ? 7 - displayCol : displayCol;
    const squareIndex = rowIndex * 8 + colIndex;

    if (!selectedSquare) {
      if (legalMovesMap.has(squareIndex)) {
        const moves = legalMovesMap.get(squareIndex);
        setSelectedSquare({ row: rowIndex, col: colIndex, sq: squareIndex });

        const seen = new Set();
        const displayMoves = [];

        for (const m of moves) {
          const key = m.to;
          if (!seen.has(key)) {
            seen.add(key);
            displayMoves.push({
              row: m.to >> 3,
              col: m.to & 7
            });
          }
        }

        setValidMoves(displayMoves);
      }
    } else {
      const fromSq = selectedSquare.sq;

      if (fromSq === squareIndex) {
        clearSelection();
        return;
      }

      const fromMoves = legalMovesMap.get(fromSq) || [];
      const matchingMoves = fromMoves.filter(
        m => m.to === squareIndex
      );

      if (matchingMoves.length > 0) {
        const promoMoves = matchingMoves.filter(
          m => isPromotionTag(m.tag)
        );

        if (promoMoves.length > 0) {
          const pawnColor =
            promoMoves[0].piece <= 5 ? 'w' : 'b';

          initiatePromotion(
            promoMoves,
            displayRow,
            displayCol,
            pawnColor
          );

          clearSelection();
          return;
        }

        performMove(matchingMoves[0]);
      } else if (legalMovesMap.has(squareIndex)) {
        clearSelection();

        const moves = legalMovesMap.get(squareIndex);

        setSelectedSquare({
          row: rowIndex,
          col: colIndex,
          sq: squareIndex,
        });

        const seen = new Set();
        const displayMoves = [];

        for (const m of moves) {
          const key = m.to;

          if (!seen.has(key)) {
            seen.add(key);

            displayMoves.push({
              row: m.to >> 3,
              col: m.to & 7,
            });
          }
        }

        setValidMoves(displayMoves);
      } else {
        clearSelection();
      }
    }
  };

  // ══════════════════════════════════════════════════════════════════
  // PAWN PROMOTION
  // ══════════════════════════════════════════════════════════════════

  const handlePromotion = (pieceType) => {
    if (
      !pendingPromotionMoves ||
      pendingPromotionMoves.length === 0
    ) return;

    playPromotionSound();

    const chosen = pendingPromotionMoves.find(
      m => getPromotionPieceType(m.tag) === pieceType
    );

    if (!chosen) return;

    performMove(chosen);
    completePromotion();
  };

  const handleCancelPromotion = () => {
    cancelPromotion();
    clearSelection();
  };

  // ══════════════════════════════════════════════════════════════════
  // REVIEW MODE
  // ══════════════════════════════════════════════════════════════════

  const {
    handleGameReview,
    handleReviewPrevious,
    handleReviewNext,
    handleReviewStart,
    handleReviewEnd,
    handleReviewTogglePlay,
    handleExitReview,
  } = useReviewController({
    getReviewSnapshots,
    enterReviewMode,
    exitReviewMode,
    goToPrevious,
    goToNext,
    goToStart,
    goToEnd,
    toggleAutoPlay,
    setReviewDisplayState,
    setAnalysisStatus,
    setAnalyzedCount,
    setAnalysisResults,
    setWhiteAccuracy,
    setBlackAccuracy,
    setShowGameOverUI,
    analysisRunIdRef,
  });

  const handleOpenGameAnalysis = () => {
    const analysisTargetPly = isReviewMode
      ? Math.max(0, reviewIndex)
      : activeMoveHistory.length;

    const pgnToAnalyze =
      currentPGN && currentPGN.trim().length > 0
        ? currentPGN
        : generatePGN({
            whitePlayer:
              playerNames.white || 'White',
            blackPlayer:
              playerNames.black || 'Black',
            result: getPGNResult(
              gameState,
              currentTurn
            ),
            moveHistory,
            gameState,
            timeControl:
              formatPGNTimeControl(
                selectedTimeControl.base,
                selectedTimeControl.increment
              ),
          });

    try {
      window.localStorage.setItem(
        ANALYSIS_HANDOFF_KEY,
        JSON.stringify({
          pgn: pgnToAnalyze,
          orientation: isBoardFlipped
            ? 'black'
            : 'white',
          targetPly: analysisTargetPly,
          source: 'play-review',
          ts: Date.now(),
        })
      );
    } catch (error) {
      console.error(
        'Failed to store analysis handoff payload:',
        error
      );
    }

    const baseUrl =
      import.meta.env.BASE_URL || '/';

    const normalizedBase =
      baseUrl.endsWith('/')
        ? baseUrl
        : `${baseUrl}/`;

    const analysisUrl = new URL(
      'analysis',
      new URL(
        normalizedBase,
        window.location.href
      )
    );

    window.location.assign(
      analysisUrl.toString()
    );
  };

  // ══════════════════════════════════════════════════════════════════
  // GAME LIFECYCLE
  // ══════════════════════════════════════════════════════════════════

  const triggerResignHighlight = () => {
    setHighlightResign(true);

    if (resignHighlightTimeoutRef.current) {
      clearTimeout(resignHighlightTimeoutRef.current);
    }

    resignHighlightTimeoutRef.current = setTimeout(() => {
      setHighlightResign(false);
    }, 2200);
  };

  const {
    handleNewGame,
    handleStartConfiguredGame,
    handleRematch,
    handlePlayFriend,
    handleSelectGameMode,
    handleNewGameRequest,
    handlePlaySelectFromNav,
    handleRefreshBoardView,
  } = useGameLifecycle({
    analysisRunIdRef,
    liveEvalRequestKeyRef,
    engineResetGame,
    stockfish,
    p2p,
    isMultiplayerGame,
    remoteApplyingMoveRef,
    selectedTimeControl,
    setManualGameEnd,
    setWhiteTime,
    setBlackTime,
    setIsTimerActive,
    setGameStarted,
    setShowGameOverUI,
    setShowDrawOffer,
    setIncomingDrawOfferSide,
    setCurrentPGN,
    setReviewDisplayState,
    setAnalysisStatus,
    setAnalysisResults,
    setAnalyzedCount,
    setWhiteAccuracy,
    setBlackAccuracy,
    analysisCacheRef,
    exitReviewMode,
    clearSelection,
    setGameMode,
    setIsMultiplayerGame,
    setMultiplayerSide,
    setIsMultiplayerStarted,
    setMultiplayerNotice,
    setIsBoardFlipped,
    setEntryMode,
    p2pDisconnect: p2p.disconnect,
    playerColor,
    setPlayerColor,
    setBoardViewKey,
    setHighlightResign,
    uiCapabilities,
    triggerResignHighlight,
    playGameStartSound,
    // BUG-01/12 FIX: Pass the real makeComputerMove, not a stub.
    // This ensures handleStartConfiguredGame correctly triggers the engine
    // when gameMode === 'computer' and playerColor === 'black'.
    makeComputerMove,
    gameMode,
  });

  useEffect(() => {
    return () => {
      if (resignHighlightTimeoutRef.current) {
        clearTimeout(resignHighlightTimeoutRef.current);
      }
    };
  }, []);

  // ══════════════════════════════════════════════════════════════════
  // IN-GAME ACTION HANDLERS
  // ══════════════════════════════════════════════════════════════════

  const handleComputerDifficultyChange = (level) => {
    setComputerDifficulty(level);

    if (stockfish.isEngineReady) {
      const settings = getDifficultySettings(level);
      stockfish.setSkillLevel(settings.skill);

      console.log(`Difficulty set to level ${level}`);
    }
  };

  const handlePlayerColorChange = (color) => {
    setPlayerColor(color);
    setIsBoardFlipped(color === 'black');

    console.log(`Player color: ${color}`);
  };

  useEffect(() => {
    if (uiSettings.orientation === 'white') {
      setIsBoardFlipped(false);
    } else if (uiSettings.orientation === 'black') {
      setIsBoardFlipped(true);
    }
  }, [uiSettings.orientation]);

  const handleResign = () => {
    if (!uiCapabilities.canUseInGameActions) return;

    setHighlightResign(false);

    if (
      isMultiplayerGame &&
      p2p.isConnected &&
      !remoteApplyingMoveRef.current
    ) {
      p2p.sendMessage({
        type: 'resign',
        by: multiplayerSide,
      });
    }

    const winner =
      currentTurn === 'w'
        ? (playerNames.black || 'Black')
        : (playerNames.white || 'White');

    setManualGameEnd('resigned');
    setIsTimerActive(false);
    setShowGameOverUI(true);

    playGameEndSound();

    const pgnResult = currentTurn === 'w' ? '0-1' : '1-0';

    const pgn = generatePGN({
      whitePlayer: playerNames.white || 'White',
      blackPlayer: playerNames.black || 'Black',
      result: pgnResult,
      moveHistory,
      gameState: 'resigned',
      timeControl: formatPGNTimeControl(
        selectedTimeControl.base,
        selectedTimeControl.increment
      ),
    });

    setCurrentPGN(pgn);

    console.log('Game PGN (Resignation):', pgn);
    console.log(`${winner} wins by resignation!`);
  };

  const handleOfferDraw = () => {
    if (!uiCapabilities.canUseInGameActions) return;

    if (isMultiplayerGame) {
      if (!p2p.isConnected) {
        setMultiplayerNotice('Not connected to opponent.');
        return;
      }

      p2p.sendMessage({
        type: 'draw_offer',
        by: multiplayerSide,
      });

      setMultiplayerNotice(
        'Draw request sent. Waiting for opponent...'
      );

      return;
    }

    setShowDrawOffer(true);
  };

  const handleAcceptDraw = () => {
    if (isMultiplayerGame && incomingDrawOfferSide) {
      p2p.sendMessage({
        type: 'draw_response',
        accepted: true,
      });

      setIncomingDrawOfferSide(null);
    }

    setShowDrawOffer(false);
    setManualGameEnd('draw');
    setIsTimerActive(false);
    setShowGameOverUI(true);

    playGameEndSound();

    const pgn = generatePGN({
      whitePlayer: playerNames.white || 'White',
      blackPlayer: playerNames.black || 'Black',
      result: '1/2-1/2',
      moveHistory,
      gameState: 'draw',
      timeControl: formatPGNTimeControl(
        selectedTimeControl.base,
        selectedTimeControl.increment
      ),
    });

    setCurrentPGN(pgn);

    console.log('Game PGN (Draw by agreement):', pgn);
  };

  const handleDeclineDraw = () => {
    if (isMultiplayerGame && incomingDrawOfferSide) {
      p2p.sendMessage({
        type: 'draw_response',
        accepted: false,
      });

      setIncomingDrawOfferSide(null);
      setMultiplayerNotice('Draw request declined.');
    }

    setShowDrawOffer(false);

    console.log('Draw offer declined. Game continues.');
  };

  const handleSelectTimeControl = (control) => {
    setSelectedTimeControl(control);
    setWhiteTime(control.base * 1000);
    setBlackTime(control.base * 1000);
  };

  const updatePlayerName = (side, value) => {
    if (isMultiplayerGame) {
      if (multiplayerSide === 'w' && side !== 'white') return;
      if (multiplayerSide === 'b' && side !== 'black') return;
    }

    setPlayerNames((prev) => ({
      ...prev,
      [side]: value,
    }));

    if (isMultiplayerGame && p2p.isConnected) {
      p2p.sendMessage({
        type: 'name_update',
        side,
        value,
      });
    }
  };

  const resetPlayerNames = () => {
    if (isMultiplayerGame) return;

    setPlayerNames({
      white: 'White',
      black: 'Black',
    });
  };

  // ══════════════════════════════════════════════════════════════════
  // MULTIPLAYER CONTROLLER
  // ══════════════════════════════════════════════════════════════════

  const { startMultiplayerMatch } = useMultiplayerController({
    p2p,
    entryMode,
    isMultiplayerGame,
    gameStarted,
    selectedTimeControl,
    engineResetGame,
    setGameMode,
    setIsMultiplayerGame,
    setIsMultiplayerStarted,
    setMultiplayerSide,
    setIsBoardFlipped,
    setEntryMode,
    setMultiplayerNotice,
    setManualGameEnd,
    setShowGameOverUI,
    setShowDrawOffer,
    setIncomingDrawOfferSide,
    setGameStarted,
    setIsTimerActive,
    setWhiteTime,
    setBlackTime,
    playGameStartSound,
    remoteApplyingMoveRef,
    performMove,
    handleNewGame,
    setPlayerNames,
  });

  // ══════════════════════════════════════════════════════════════════
  // DISPLAY COMPUTATION
  // ══════════════════════════════════════════════════════════════════

  const formatTime = (timeInMs) => {
    const totalSeconds = Math.floor(timeInMs / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const milliseconds = Math.floor((timeInMs % 1000) / 10);

    if (totalSeconds < 10) {
      return `${mins.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}:${milliseconds
        .toString()
        .padStart(2, '0')}`;
    }

    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}   `;
  };

  const fileLabels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const rankLabels = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const effectiveBoardFlipped =
    uiSettings.orientation === 'auto'
      ? currentTurn === 'b'
      : isBoardFlipped;

  const displayBoard = effectiveBoardFlipped
    ? [...activeBoard].reverse().map((row) => [...row].reverse())
    : activeBoard;

  const displayFileLabels = effectiveBoardFlipped
    ? [...fileLabels].reverse()
    : fileLabels;

  const displayRankLabels = effectiveBoardFlipped
    ? [...rankLabels].reverse()
    : rankLabels;

  const displaySelectedSquare =
    selectedSquare && effectiveBoardFlipped
      ? {
          row: 7 - selectedSquare.row,
          col: 7 - selectedSquare.col,
        }
      : selectedSquare;

  const displayValidMoves = effectiveBoardFlipped
    ? validMoves.map((move) => ({
        row: 7 - move.row,
        col: 7 - move.col,
      }))
    : validMoves;

  const displayKingInCheckPos =
    activeKingInCheckPos && effectiveBoardFlipped
      ? {
          row: 7 - activeKingInCheckPos.row,
          col: 7 - activeKingInCheckPos.col,
        }
      : activeKingInCheckPos;

  const displayLastMove =
    activeLastMove && effectiveBoardFlipped
      ? {
          from: {
            row: 7 - activeLastMove.from.row,
            col: 7 - activeLastMove.from.col,
          },
          to: {
            row: 7 - activeLastMove.to.row,
            col: 7 - activeLastMove.to.col,
          },
          piece: activeLastMove.piece,
        }
      : activeLastMove;

  // Derived screen-level booleans
  const isGameOverUIState = uiState === UI_STATES.GAME_OVER;
  // BUG-03 FIX: showMobileStartPanel is computed here and passed as a
  // boolean to MobileGameArea (which expects the boolean, not uiState + gameStarted).
  const showMobileStartPanel =
    uiState === UI_STATES.LOCAL_GAME && !gameStarted;
  const displayTurn = currentTurn;

  // ══════════════════════════════════════════════════════════════════
  // SCREEN ROUTING
  // ══════════════════════════════════════════════════════════════════

  // ModeSelectScreen
  if (uiState === UI_STATES.MODE_SELECT) {
    return (
      <ModeSelectScreen
        onSelectLocal={() => {
          setIsMultiplayerGame(false);
          setMultiplayerSide('w');
          setIsMultiplayerStarted(false);
          setMultiplayerNotice('');
          p2p.disconnect();
          setEntryMode('local');
        }}
        onSelectMultiplayer={() => {
          setEntryMode('multiplayer');
          setGameMode('human');
          setIsMultiplayerStarted(false);
          setMultiplayerNotice('');
        }}
      />
    );
  }

  // Multiplayer Lobby
  if (uiState === UI_STATES.MULTIPLAYER_LOBBY) {
    return (
      <MultiplayerLobbyScreen
        onBack={() => setEntryMode(null)}
        onContinueLocal={() => setEntryMode('local')}
        p2p={p2p}
        onStartMultiplayer={startMultiplayerMatch}
      />
    );
  }

  // Main Layout (LOCAL_GAME, GAME_OVER, REVIEW)
  return (
    <div
      className={`h-screen w-screen flex flex-col lg:flex-row overflow-hidden bg-cover bg-center ${
        uiSettings.reduceMotion ? 'motion-reduce' : ''
      }`}
      style={appBackgroundStyle}
    >
      <Sidebar
        onSelectGameMode={handleSelectGameMode}
        onOpenSettings={() => setShowAppSettings(true)}
        onRefresh={handleRefreshBoardView}
        onPlaySelect={handlePlaySelectFromNav}
      />

      {/* Center column: board + player cards + timers */}
      <div className="flex-1 flex flex-col items-center justify-center overflow-hidden px-2 lg:px-0">
        <BoardContainer
          key={boardViewKey}
          boardViewKey={boardViewKey}
          effectiveBoardFlipped={effectiveBoardFlipped}
          playerNames={playerNames}
          activeCapturedPieces={activeCapturedPieces}
          whiteTime={whiteTime}
          blackTime={blackTime}
          formatTime={formatTime}
          isMultiplayerGame={isMultiplayerGame}
          isMultiplayerStarted={isMultiplayerStarted}
          multiplayerNotice={multiplayerNotice}
          multiplayerSide={multiplayerSide}
          evalValue={evalValue}
          mateValue={mateValue}
          stockfish={stockfish}
          displayTurn={currentTurn}
          displayBoard={displayBoard}
          displaySelectedSquare={displaySelectedSquare}
          displayValidMoves={displayValidMoves}
          displayKingInCheckPos={displayKingInCheckPos}
          displayLastMove={displayLastMove}
          handleSquareClick={handleSquareClick}
          displayRankLabels={displayRankLabels}
          displayFileLabels={displayFileLabels}
          gameState={gameState}
          isReviewMode={isReviewMode}
          activePieceImages={activePieceImages || {}}
          boardThemeColors={boardThemeColors}
          uiSettings={uiSettings}
          showPromotionUI={showPromotionUI}
          promotionSquare={promotionSquare}
          onPromotion={handlePromotion}
          onCancel={handleCancelPromotion}
        />
      </div>

      {/*
        BUG-02/04/11/18 FIX:
        GameModals owns ALL modal rendering — promotion UI, game-over modal,
        draw offer, settings modal, and game settings modal.
        Props are now correctly named to match what GameModals.jsx expects.
        The duplicate {showAppSettings && <SettingsModal>} and
        {showGameSettings && <GameSettingsModal>} blocks have been removed
        from App's JSX — they are rendered inside GameModals instead.
      */}
      <GameModals
        isGameOverUIState={isGameOverUIState}
        gameState={gameState}
        currentTurn={currentTurn}
        handleNewGame={handleNewGame}
        handleRematch={handleRematch}
        handleGameReview={handleOpenGameAnalysis}
        setShowGameOverUI={setShowGameOverUI}

        showDrawOffer={showDrawOffer}
        incomingDrawOfferSide={incomingDrawOfferSide}
        handleAcceptDraw={handleAcceptDraw}
        handleDeclineDraw={handleDeclineDraw}

        showAppSettings={showAppSettings}
        setShowAppSettings={setShowAppSettings}
        boardSurfaceOptions={boardSurfaceOptions}
        pieceSetOptions={pieceSetOptions}

        showGameSettings={showGameSettings}
        setShowGameSettings={setShowGameSettings}
        playerNames={playerNames}
        updatePlayerName={updatePlayerName}
        resetPlayerNames={resetPlayerNames}

        isMultiplayerGame={isMultiplayerGame}
        multiplayerSide={multiplayerSide}
        setIsBoardFlipped={setIsBoardFlipped}
        handleResign={handleResign}
        handleOfferDraw={handleOfferDraw}
        uiCapabilities={uiCapabilities}
      />

      {/*
        BUG-03/17 FIX:
        MobileGameArea now receives correct prop names:
        - showMobileStartPanel (boolean, not uiState + gameStarted)
        - onResign, onOfferDraw, onSelectTimeControl, onStartGame,
          onSelectGameMode, onComputerDifficultyChange (not handle* variants)
        - All missing review and game panel props are now passed.
      */}
      <MobileGameArea
        showMobileStartPanel={showMobileStartPanel}
        selectedTimeControl={selectedTimeControl}
        onSelectTimeControl={handleSelectTimeControl}
        gameMode={gameMode}
        onSelectGameMode={handleSelectGameMode}
        computerDifficulty={computerDifficulty}
        onComputerDifficultyChange={handleComputerDifficultyChange}
        onStartGame={handleStartConfiguredGame}
        canStartGame={uiCapabilities.canStartGame}
        gameStarted={gameStarted}
        moveHistory={activeMoveHistory}
        currentTurn={currentTurn}
        onResign={handleResign}
        onOfferDraw={handleOfferDraw}
        gameState={gameState}
        highlightResign={highlightResign}
        isReviewMode={isReviewMode}
        reviewIndex={reviewIndex}
        reviewHistoryLength={reviewHistoryLength}
        isPlaying={isPlaying}
        onReviewPrevious={handleReviewPrevious}
        onReviewNext={handleReviewNext}
        onReviewStart={handleReviewStart}
        onReviewEnd={handleReviewEnd}
        onReviewTogglePlay={handleReviewTogglePlay}
        onExitReview={handleExitReview}
        onGameAnalysis={handleOpenGameAnalysis}
        canUseInGameActions={uiCapabilities.canUseInGameActions}
      />

      <MobileNavigation
        handlePlaySelectFromNav={handlePlaySelectFromNav}
        gameMode={gameMode}
        handleRefreshBoardView={handleRefreshBoardView}
        setShowAppSettings={setShowAppSettings}
        setIsBoardFlipped={setIsBoardFlipped}
        effectiveBoardFlipped={effectiveBoardFlipped}
      />

      <RightPanel
        selectedTimeControl={selectedTimeControl}
        gameStarted={gameStarted}
        moveHistory={activeMoveHistory}
        currentTurn={currentTurn}
        gameState={gameState}
        isMultiplayerGame={isMultiplayerGame}
        gameMode={gameMode}
        computerDifficulty={computerDifficulty}
        playerColor={playerColor}
        highlightResign={highlightResign}
        isEngineReady={stockfish?.isEngineReady ?? true}
        canUseInGameActions={uiCapabilities.canUseInGameActions}
        canStartGame={uiCapabilities.canStartGame}
        canPlayFriend={uiCapabilities.canOpenMultiplayer}
        isReviewMode={isReviewMode}
        reviewIndex={reviewIndex}
        reviewHistoryLength={activeMoveHistory.length}
        isPlaying={isPlaying}
        onSelectTimeControl={handleSelectTimeControl}
        onStartGame={handleStartConfiguredGame}
        onNewGame={handleNewGameRequest}
        onResign={handleResign}
        onOfferDraw={handleOfferDraw}
        onPlayFriend={handlePlayFriend}
        onSelectGameMode={handleSelectGameMode}
        onComputerDifficultyChange={handleComputerDifficultyChange}
        onPlayerColorChange={handlePlayerColorChange}
        onReviewPrevious={handleReviewPrevious}
        onReviewNext={handleReviewNext}
        onReviewStart={handleReviewStart}
        onReviewEnd={handleReviewEnd}
        onReviewTogglePlay={handleReviewTogglePlay}
        onExitReview={handleExitReview}
        onGameAnalysis={handleOpenGameAnalysis}
      />
    </div>
  );
}

export default App;