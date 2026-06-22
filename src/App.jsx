import { useState, useEffect, useRef, useMemo } from 'react'
import { generatePGN, getPGNResult, formatPGNTimeControl } from './engine/pgn.js'
import { useChessTimer } from './hooks/useChessTimer'
import { useGameEngine, isPromotionTag, getPromotionPieceType, uciToV2Move } from './hooks/useGameEngine'
import { usePawnPromotion } from './hooks/usePawnPromotion'
import { useReviewMode } from './hooks/useReviewMode'
import { playMoveSound, playCaptureSound, playCheckSound, playCastleSound, playGameStartSound, playGameEndSound, playPromotionSound, setSoundPreferences } from './utils/sounds'
import Sidebar from './components/Sidebar'
import RightPanel from './components/RightPanel'
import GamePanel from './components/GamePanel'
import MobileStartGamePanel from './components/MobileStartGamePanel'
import PawnPromotionUI from './components/PawnPromotionUI'
import GameOverModal from './components/GameOverModal'
import DrawOfferModal from './components/DrawOfferModal'
import { BACKGROUND_PRESETS, DEFAULT_UI_SETTINGS, BOARD_THEME_MAP, BOARD_TEXTURE_MAP, BOARD_IMAGE_MAP } from './constants/boardThemes'
import { DEFAULT_BOARD_SURFACE_OPTIONS, THEME_PRESET_MAP } from './constants/uiPresets.js'
import SettingsModal from './components/SettingsModal'
import GameSettingsModal from './components/GameSettingsModal'
import ModeSelectScreen from './components/ModeSelectScreen'
import MultiplayerLobbyScreen from './components/MultiplayerLobbyScreen'
import { initBitboardEngine } from './engine/index.js'
import { useStockfish } from './hooks/useStockfish'
import { useP2PGame } from './hooks/useP2PGame'
import BoardContainer from './features/board/BoardContainer';
import MobileNavigation from './features/navigation/MobileNavigation';
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
import { toAssetPath } from './utils/assetPath.js'

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


const THEME_SCOPE_KEYS = new Set([
  'boardTheme',
  'boardSurface',
  'boardTexture',
  'useCustomBoardColors',
  'customLightSquare',
  'customDarkSquare',
  'pieceStyle',
  'backgroundStyle',
  'customBackgroundColor',
]);

function sanitizeUiSettings(input) {
  const merged = { ...DEFAULT_UI_SETTINGS, ...(input || {}) };
  const legacyPieceMap = {
    neo: 'staunty',
    classic: 'tatiana',
    alpha: 'alpha',
    minimal: 'pixel',
  };
  const mappedPieceStyle = legacyPieceMap[merged.pieceStyle] || merged.pieceStyle;
  return {
    ...merged,
    pieceStyle: mappedPieceStyle,
    appThemePreset: merged.appThemePreset || 'custom',
    boardTexture: merged.boardTexture || 'none',
    boardSurface: merged.boardSurface || 'none',
    useCustomBoardColors: Boolean(merged.useCustomBoardColors),
    volume: Math.max(0, Math.min(1, Number(merged.volume ?? DEFAULT_UI_SETTINGS.volume))),
  };
}

function readStoredJson(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function App() {
  const ANALYSIS_HANDOFF_KEY = 'chessapp_analysis_handoff_v1';
  // Initialize bitboard engine on mount
  useEffect(() => {
    initBitboardEngine();
  }, []);

  // ══════════════════════════════════════════════════════════════════
  // ENGINE STATE (persistent Position as source of truth)
  // ══════════════════════════════════════════════════════════════════
  const {
    displayPieces,       // board[8][8] derived from Position
    legalMovesMap,       // Map<fromSquare, v2Move[]>
    fen,                 // FEN string
    checkInfo,           // { inCheck, kingSquare }
    gameStatus,          // 'playing' | 'checkmate' | 'stalemate'
    sideToMove,          // 'w' | 'b'
    moveHistory,         // notation string array
    capturedPieces,      // { w: [...], b: [...] }
    lastMoveInfo,        // { from, to, piece, wasCapture, isCastling, ... } | null
    executeMove: engineExecuteMove,
    resetGame: engineResetGame,
    getReviewSnapshots,
  } = useGameEngine();

  // Aliases for compatibility with the rest of the component
  const board = displayPieces;
  const currentTurn = sideToMove;
  const kingInCheckPos = checkInfo.kingSquare;
  const lastMove = lastMoveInfo;

  // ══════════════════════════════════════════════════════════════════
  // UI STATE (manual game endings, selection, timers, etc.)
  // ══════════════════════════════════════════════════════════════════
  const [manualGameEnd, setManualGameEnd] = useState(null); // 'resigned' | 'draw' | 'timeout'
  const gameState = manualGameEnd || gameStatus;

  // Square selection
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);

  const clearSelection = () => {
    setSelectedSquare(null);
    setValidMoves([]);
  };

  // Pawn promotion
  const {
    showPromotionUI,
    promotionSquare,
    pendingPromotionMoves,
    initiatePromotion,
    completePromotion,
    cancelPromotion
  } = usePawnPromotion();

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

  // Timers & UI
  const [whiteTime, setWhiteTime] = useState(600000);
  const [blackTime, setBlackTime] = useState(600000);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [selectedTimeControl, setSelectedTimeControl] = useState({
    base: 600, increment: 0, label: '10 min', category: 'rapid', icon: '🕐'
  });
  const [gameStarted, setGameStarted] = useState(false);
  const [showGameOverUI, setShowGameOverUI] = useState(false);
  const [currentPGN, setCurrentPGN] = useState('');
  const [showDrawOffer, setShowDrawOffer] = useState(false);
  const [incomingDrawOfferSide, setIncomingDrawOfferSide] = useState(null);
  const [multiplayerNotice, setMultiplayerNotice] = useState('');
  const [isBoardFlipped, setIsBoardFlipped] = useState(false);
  const [showAppSettings, setShowAppSettings] = useState(false);
  const [showGameSettings, setShowGameSettings] = useState(false);
  const [playerNames, setPlayerNames] = useState({ white: 'White', black: 'Black' });
  const [entryMode, setEntryMode] = useState(null); // null | 'local' | 'multiplayer'
  const [isMultiplayerGame, setIsMultiplayerGame] = useState(false);
  const [multiplayerSide, setMultiplayerSide] = useState('w');
  const [isMultiplayerStarted, setIsMultiplayerStarted] = useState(false);
  const remoteApplyingMoveRef = useRef(false);

  // Game mode & computer opponent
  const [gameMode, setGameMode] = useState('human');
  const [playerColor, setPlayerColor] = useState('white');
  const [computerDifficulty, setComputerDifficulty] = useState(5);
  const [engineProfile] = useState(() => {
    const stored = readStoredJson(STORAGE_KEYS.ENGINE_PROFILE, DEFAULT_ENGINE_PROFILE);
    const isKnown = ENGINE_PROFILES.some((profile) => profile.id === stored);
    return isKnown ? stored : DEFAULT_ENGINE_PROFILE;
  });
  const [liveEvalConfig] = useState(() => {
    const stored = readStoredJson(STORAGE_KEYS.LIVE_EVAL, DEFAULT_LIVE_EVAL_SETTINGS);
    return clampLiveEvalSettings(stored);
  });
  const [analysisConfig] = useState(() => {
    const stored = readStoredJson(STORAGE_KEYS.ANALYSIS, DEFAULT_ANALYSIS_SETTINGS);
    return clampAnalysisSettings(stored);
  });
  const [uiSettings, setUiSettings] = useState(() => {
    const stored = readStoredJson(STORAGE_KEYS.UI_SETTINGS, DEFAULT_UI_SETTINGS);
    return sanitizeUiSettings(stored);
  });
  const [assetManifest, setAssetManifest] = useState({
    boards: [],
    pieceSets: [],
    pieceFilesBySet: {},
  });

  useEffect(() => {
    let cancelled = false;
    fetch(`${toAssetPath('asset-manifest.json')}?ts=${Date.now()}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data || cancelled) return;
        setAssetManifest({
          boards: Array.isArray(data.boards) ? data.boards : [],
          pieceSets: Array.isArray(data.pieceSets) ? data.pieceSets : [],
          pieceFilesBySet: data.pieceFilesBySet && typeof data.pieceFilesBySet === 'object' ? data.pieceFilesBySet : {},
        });
      })
      .catch(() => {
        if (cancelled) return;
        setAssetManifest({ boards: [], pieceSets: [], pieceFilesBySet: {} });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dynamicBoardImageMap = useMemo(() => {
    if (!assetManifest.boards.length) return BOARD_IMAGE_MAP;
    const fromManifest = { none: null };
    for (const board of assetManifest.boards) {
      if (!board?.id || !board?.path) continue;
      fromManifest[board.id] = toAssetPath(board.path);
    }
    return fromManifest;
  }, [assetManifest.boards]);

  const boardSurfaceOptions = useMemo(() => {
    if (!assetManifest.boards.length) return DEFAULT_BOARD_SURFACE_OPTIONS;
    return [
      { id: 'none', label: 'Plain Board', image: null },
      ...assetManifest.boards.map((board) => ({
        id: board.id,
        label: board.label || board.id,
        image: toAssetPath(board.path),
      })),
    ];
  }, [assetManifest.boards]);

  const pieceSetOptions = useMemo(() => {
    return assetManifest.pieceSets;
  }, [assetManifest.pieceSets]);

  const boardThemeColors = useMemo(() => {
    const preset = BOARD_THEME_MAP[uiSettings.boardTheme] || BOARD_THEME_MAP['classic-blue'];
    const useCustomColors = uiSettings.useCustomBoardColors;
    return {
      ...preset,
      light: useCustomColors ? (uiSettings.customLightSquare || preset.light) : preset.light,
      dark: useCustomColors ? (uiSettings.customDarkSquare || preset.dark) : preset.dark,
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
    return buildPieceImages(activePieceSet, assetManifest.pieceFilesBySet?.[activePieceSet] || null);
  }, [activePieceSet, assetManifest.pieceFilesBySet]);

  const appBackgroundStyle = useMemo(() => {
    if (uiSettings.backgroundStyle === 'bg-custom-solid') {
      return {
        background: uiSettings.customBackgroundColor || '#17212c',
      };
    }
    return BACKGROUND_PRESETS[uiSettings.backgroundStyle]?.style || BACKGROUND_PRESETS['bg-classic'].style;
  }, [uiSettings.backgroundStyle, uiSettings.customBackgroundColor]);

  const isComputerTurn = (turn = currentTurn) => {
    if (gameMode !== 'computer') return false;
    return (
      (playerColor === 'white' && turn === 'b') ||
      (playerColor === 'black' && turn === 'w')
    );
  };

  // Review mode display state (overrides engine state during review)
  const [reviewDisplayState, setReviewDisplayState] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState('idle');
  const [, setAnalysisResults] = useState([]);
  const [, setAnalyzedCount] = useState(0);
  const [, setWhiteAccuracy] = useState(null);
  const [, setBlackAccuracy] = useState(null);
  const analysisRunIdRef = useRef(0);
  const analysisCacheRef = useRef(new Map());
  const liveEvalRequestKeyRef = useRef('');
  const [boardViewKey, setBoardViewKey] = useState(0);
  const [highlightResign, setHighlightResign] = useState(false);
  const resignHighlightTimeoutRef = useRef(null);

  // Initialize Stockfish
  const stockfish = useStockfish({ engineProfile });
  const p2p = useP2PGame();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEYS.ENGINE_PROFILE, JSON.stringify(engineProfile));
  }, [engineProfile]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEYS.LIVE_EVAL, JSON.stringify(liveEvalConfig));
  }, [liveEvalConfig]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEYS.ANALYSIS, JSON.stringify(analysisConfig));
  }, [analysisConfig]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEYS.UI_SETTINGS, JSON.stringify(uiSettings));
  }, [uiSettings]);

  useEffect(() => {
    setSoundPreferences({
      enabled: uiSettings.soundEffects,
      moveEnabled: uiSettings.moveSound,
      captureEnabled: uiSettings.captureSound,
      checkEnabled: uiSettings.checkSound,
      volume: uiSettings.volume,
    });
  }, [uiSettings.soundEffects, uiSettings.moveSound, uiSettings.captureSound, uiSettings.checkSound, uiSettings.volume]);

  // Wire timer hook
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

  // Stockfish evaluation
  const evalValue = stockfish.evaluation?.type === 'cp' ? stockfish.evaluation.value : null;
  const mateValue = stockfish.evaluation?.type === 'mate' ? stockfish.evaluation.value : null;

  // Keep Stockfish skill level synchronized with selected difficulty.
  useEffect(() => {
    if (!stockfish.isEngineReady) return;
    const settings = getDifficultySettings(computerDifficulty);
    stockfish.setSkillLevel(settings.skill);
  }, [computerDifficulty, stockfish.isEngineReady, stockfish]);

  // Evaluate position after every move (FEN from engine, zero conversions)
  useEffect(() => {
    if (!stockfish.isEngineReady || !gameStarted) return;
    if (isReviewMode || analysisStatus === 'running') return;

    const requestKey = `${fen}|${liveEvalConfig.depth}|${liveEvalConfig.moveTime}`;
    if (liveEvalRequestKeyRef.current === requestKey) return;

    liveEvalRequestKeyRef.current = requestKey;
    stockfish.evaluatePosition(fen, liveEvalConfig.depth, liveEvalConfig.moveTime);
  }, [
    fen,
    stockfish.isEngineReady,
    gameStarted,
    isReviewMode,
    analysisStatus,
    liveEvalConfig.depth,
    liveEvalConfig.moveTime,
    stockfish,
  ]);

  useEffect(() => {
    if (!gameStarted) {
      liveEvalRequestKeyRef.current = '';
    }
  }, [gameStarted]);

  // Prevent engine noise during non-play interactive states.
  useEffect(() => {
    if (!stockfish.isEngineReady) return;
    if (!gameStarted || gameState !== 'playing' || isReviewMode || showPromotionUI) {
      stockfish.stopAnalysis();
    }
  }, [
    stockfish.isEngineReady,
    gameStarted,
    gameState,
    isReviewMode,
    showPromotionUI,
    stockfish,
  ]);

  // ══════════════════════════════════════════════════════════════════
  // REVIEW MODE — auto-play sync
  // ══════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (isReviewMode && isPlaying) {
      const currentState = getCurrentReviewState();
      if (currentState) {
        setReviewDisplayState(currentState);

        if (currentState.lastMoveInfo) {
          const lm = currentState.lastMoveInfo;
          if (lm.isCastling) playCastleSound();
          else if (lm.wasCapture) playCaptureSound();
          else playMoveSound();
          if (currentState.inCheck) setTimeout(() => playCheckSound(), 100);
        }
      }
    }
  }, [reviewIndex, isReviewMode, isPlaying, getCurrentReviewState]);

  // ══════════════════════════════════════════════════════════════════
  // EFFECTIVE DISPLAY VALUES (engine vs review mode)
  // ══════════════════════════════════════════════════════════════════
  const activeBoard = (isReviewMode && reviewDisplayState) ? reviewDisplayState.displayPieces : board;
  const activeKingInCheckPos = (isReviewMode && reviewDisplayState) ? reviewDisplayState.kingInCheckPos : kingInCheckPos;
  const activeLastMove = (isReviewMode && reviewDisplayState) ? reviewDisplayState.lastMoveInfo : lastMove;
  const activeCapturedPieces = (isReviewMode && reviewDisplayState) ? reviewDisplayState.capturedPieces : capturedPieces;
  const activeMoveHistory = (isReviewMode && reviewDisplayState) ? (reviewDisplayState.moveHistory || moveHistory) : moveHistory;

  const uiState = useMemo(() => {
    if (!entryMode) return UI_STATES.MODE_SELECT;
    if (entryMode === 'multiplayer') return UI_STATES.MULTIPLAYER_LOBBY;
    if (showGameOverUI && gameState !== 'playing') return UI_STATES.GAME_OVER;
    if (isReviewMode) return UI_STATES.REVIEW;
    return UI_STATES.LOCAL_GAME;
  }, [entryMode, showGameOverUI, gameState, isReviewMode]);

  const uiCapabilities = useMemo(() => {
    const base = UI_STATE_CAPABILITIES[uiState] || UI_STATE_CAPABILITIES[UI_STATES.MODE_SELECT];
    const isLiveLocalGame =
      uiState === UI_STATES.LOCAL_GAME && gameStarted && gameState === 'playing';

    return {
      canMovePieces: base.canMovePieces && isLiveLocalGame && !showPromotionUI,
      canUseInGameActions: base.canUseInGameActions && isLiveLocalGame,
      canStartGame: base.canStartGame && !gameStarted,
      canOpenMultiplayer: base.canOpenMultiplayer && !gameStarted,
    };
  }, [uiState, gameStarted, gameState, showPromotionUI]);

  // ══════════════════════════════════════════════════════════════════
  // CLICK HANDLING
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
      // ── SELECT A PIECE ────────────────────────────────────────────
      if (legalMovesMap.has(squareIndex)) {
        const moves = legalMovesMap.get(squareIndex);
        setSelectedSquare({ row: rowIndex, col: colIndex, sq: squareIndex });
        // De-duplicate target squares (promotions create 4 moves to same square)
        const seen = new Set();
        const displayMoves = [];
        for (const m of moves) {
          const key = m.to;
          if (!seen.has(key)) {
            seen.add(key);
            displayMoves.push({ row: m.to >> 3, col: m.to & 7 });
          }
        }
        setValidMoves(displayMoves);
      }
    } else {
      const fromSq = selectedSquare.sq;

      // Deselect if clicking same square
      if (fromSq === squareIndex) {
        clearSelection();
        return;
      }

      // ── CHECK IF MOVE IS VALID ────────────────────────────────────
      const fromMoves = legalMovesMap.get(fromSq) || [];
      const matchingMoves = fromMoves.filter(m => m.to === squareIndex);

      if (matchingMoves.length > 0) {
        // Check for promotion (multiple moves with same from/to)
        const promoMoves = matchingMoves.filter(m => isPromotionTag(m.tag));
        if (promoMoves.length > 0) {
          const pawnColor = promoMoves[0].piece <= 5 ? 'w' : 'b';
          initiatePromotion(promoMoves, rowIndex, colIndex, pawnColor);
          clearSelection();
          return;
        }

        // Execute single matching move
        performMove(matchingMoves[0]);
      } else if (legalMovesMap.has(squareIndex)) {
        // Select a different piece
        clearSelection();
        const moves = legalMovesMap.get(squareIndex);
        setSelectedSquare({ row: rowIndex, col: colIndex, sq: squareIndex });
        const seen = new Set();
        const displayMoves = [];
        for (const m of moves) {
          const key = m.to;
          if (!seen.has(key)) {
            seen.add(key);
            displayMoves.push({ row: m.to >> 3, col: m.to & 7 });
          }
        }
        setValidMoves(displayMoves);
      } else {
        clearSelection();
      }
    }
  };

  // ══════════════════════════════════════════════════════════════════
  // MOVE EXECUTION
  // ══════════════════════════════════════════════════════════════════

  const performMove = (v2Move) => {
    // Execute on engine's persistent Position (notation auto-generated from bitboard)
    const result = engineExecuteMove(v2Move);

    if (isMultiplayerGame && p2p.isConnected && !remoteApplyingMoveRef.current) {
      p2p.sendMessage({ type: 'move', move: v2Move });
    }

    // Apply time increment
    applyTimeIncrement();

    // Clear UI selection
    clearSelection();

    // Play appropriate sound
    if (result.gameStatus !== 'playing') {
      const isCheckmate = result.gameStatus === 'checkmate';
      playGameEndSound(isCheckmate);
      // sideToMove already flipped inside makeMove_v2;
      // after bumpRender, the useMemo for sideToMove updates.
      // But here we're still in the same synchronous handler, so
      // derive nextTurn directly:
      const nextTurn = currentTurn === 'w' ? 'b' : 'w';
      handleGameOver(result.gameStatus, nextTurn, [...moveHistory, result.notation]);
    } else if (result.inCheck) {
      playCheckSound();
    } else if (result.isCastling) {
      playCastleSound();
    } else if (result.wasCapture) {
      playCaptureSound();
    } else {
      playMoveSound();
    }
  };

  // Helper: Apply time increment after move
  const applyTimeIncrement = () => {
    if (selectedTimeControl.increment > 0) {
      if (currentTurn === 'w') {
        setWhiteTime(prev => prev + (selectedTimeControl.increment * 1000));
      } else {
        setBlackTime(prev => prev + (selectedTimeControl.increment * 1000));
      }
    }
  };

  // Helper: Handle game over scenario
  const handleGameOver = (endState, nextTurn, finalMoveHistory) => {
    setShowGameOverUI(true);
    setIsTimerActive(false);

    const pgnResult = getPGNResult(endState, nextTurn);
    const pgn = generatePGN({
      whitePlayer: playerNames.white || 'White',
      blackPlayer: playerNames.black || 'Black',
      result: pgnResult,
      moveHistory: finalMoveHistory,
      gameState: endState,
      timeControl: formatPGNTimeControl(selectedTimeControl.base, selectedTimeControl.increment),
    });
    setCurrentPGN(pgn);
    console.log('Game PGN:', pgn);
  };

  // ══════════════════════════════════════════════════════════════════
  // PAWN PROMOTION
  // ══════════════════════════════════════════════════════════════════

  const handlePromotion = (pieceType) => {
    if (!pendingPromotionMoves || pendingPromotionMoves.length === 0) return;

    playPromotionSound();

    // Find the v2 move matching the chosen piece type
    const chosen = pendingPromotionMoves.find(
      m => getPromotionPieceType(m.tag) === pieceType
    );
    if (!chosen) return;

    // Execute the promotion move
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

  const applyReviewState = (state) => {
    setReviewDisplayState(state);
    clearSelection();
  };

  const handleGameReview = () => {
    const snapshots = getReviewSnapshots();
    const lastIdx = snapshots.length - 1;
    enterReviewMode(snapshots[lastIdx], snapshots.slice(0, lastIdx));
    setReviewDisplayState(snapshots[lastIdx]);
    setAnalysisStatus('idle');
    setAnalyzedCount(0);
    setAnalysisResults([]);
    setWhiteAccuracy(null);
    setBlackAccuracy(null);
    setShowGameOverUI(false);
  };

  const handleReviewPrevious = () => {
    const result = goToPrevious();
    if (result) {
      applyReviewState(result.state);
      const lm = result.state.lastMoveInfo;
      if (lm) {
        if (lm.isCastling) playCastleSound();
        else if (lm.wasCapture) playCaptureSound();
        else playMoveSound();
        if (result.state.inCheck) setTimeout(() => playCheckSound(), 100);
      }
    }
  };

  const handleReviewNext = () => {
    const result = goToNext();
    if (result) {
      applyReviewState(result.state);
      const lm = result.state.lastMoveInfo;
      if (lm) {
        if (lm.isCastling) playCastleSound();
        else if (lm.wasCapture) playCaptureSound();
        else playMoveSound();
        if (result.state.inCheck) setTimeout(() => playCheckSound(), 100);
      }
    }
  };

  const handleReviewStart = () => {
    const result = goToStart();
    if (result) {
      applyReviewState(result.state);
      playMoveSound();
    }
  };

  const handleReviewEnd = () => {
    const result = goToEnd();
    if (result) {
      applyReviewState(result.state);
      playMoveSound();
      if (result.state.inCheck) setTimeout(() => playCheckSound(), 100);
    }
  };

  const handleReviewTogglePlay = () => {
    toggleAutoPlay();
  };

  const handleExitReview = () => {
    analysisRunIdRef.current += 1;
    setReviewDisplayState(null);
    exitReviewMode();
    setShowGameOverUI(true);
  };

  const handleOpenGameAnalysis = () => {
    const analysisTargetPly = isReviewMode
      ? Math.max(0, reviewIndex)
      : activeMoveHistory.length;

    const pgnToAnalyze = currentPGN && currentPGN.trim().length > 0
      ? currentPGN
      : generatePGN({
        whitePlayer: playerNames.white || 'White',
        blackPlayer: playerNames.black || 'Black',
        result: getPGNResult(gameState, currentTurn),
        moveHistory: moveHistory,
        gameState,
        timeControl: formatPGNTimeControl(selectedTimeControl.base, selectedTimeControl.increment),
      });

    try {
      window.localStorage.setItem(
        ANALYSIS_HANDOFF_KEY,
        JSON.stringify({
          pgn: pgnToAnalyze,
          orientation: isBoardFlipped ? 'black' : 'white',
          targetPly: analysisTargetPly,
          source: 'play-review',
          ts: Date.now(),
        })
      );
    } catch (error) {
      console.error('Failed to store analysis handoff payload:', error);
    }

    const baseUrl = import.meta.env.BASE_URL || '/';
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const analysisUrl = new URL('analysis', new URL(normalizedBase, window.location.href));
    window.location.assign(analysisUrl.toString());
  };

  // ══════════════════════════════════════════════════════════════════
  // COMPUTER MOVE (Stockfish)
  // ══════════════════════════════════════════════════════════════════

  const makeComputerMove = async () => {
    if (!stockfish.isEngineReady || gameMode !== 'computer' || !uiCapabilities.canMovePieces) return;

    if (!isComputerTurn()) return;

    try {
      const requestFen = fen;

      await stockfish.setPosition(requestFen);

      const settings = getDifficultySettings(computerDifficulty);
      let uciMove = await stockfish.getBestMove(settings.depth, settings.moveTime);

      if (!uciMove) {
        console.warn('No move from Stockfish, retrying once...');
        uciMove = await stockfish.getBestMove(settings.depth, settings.moveTime);
        if (!uciMove) {
          console.error('No move from Stockfish after retry');
          return;
        }
      }

      // Ignore stale responses if board moved while engine was searching.
      if (requestFen !== fen) {
        console.warn('Discarding stale Stockfish result due to position change');
        return;
      }

      console.log('Computer UCI move:', uciMove);

      // Convert UCI to v2 move via legalMovesMap lookup
      const v2Move = uciToV2Move(uciMove, legalMovesMap);
      if (!v2Move) {
        console.error('Could not match UCI move to legal move:', uciMove);
        return;
      }

      performMove(v2Move);

    } catch (error) {
      console.error('Error making computer move:', error);
    }
  };

  // Trigger computer move when it becomes computer's turn
  useEffect(() => {
    if (!uiCapabilities.canMovePieces) return;
    if (isComputerTurn()) {
      const timer = setTimeout(() => makeComputerMove(), 300);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTurn, gameMode, playerColor, uiCapabilities.canMovePieces]);

  // ══════════════════════════════════════════════════════════════════
  // GAME LIFECYCLE
  // ══════════════════════════════════════════════════════════════════

  const handleNewGame = () => {
    analysisRunIdRef.current += 1;
    liveEvalRequestKeyRef.current = '';
    engineResetGame();
    setManualGameEnd(null);
    setWhiteTime(selectedTimeControl.base * 1000);
    setBlackTime(selectedTimeControl.base * 1000);
    setIsTimerActive(false);
    setGameStarted(false);
    setShowGameOverUI(false);
    setShowDrawOffer(false);
    setIncomingDrawOfferSide(null);
    setCurrentPGN('');
    setReviewDisplayState(null);
    setAnalysisStatus('idle');
    setAnalysisResults([]);
    setAnalyzedCount(0);
    setWhiteAccuracy(null);
    setBlackAccuracy(null);
    analysisCacheRef.current.clear();
    exitReviewMode();
    clearSelection();
    if (stockfish.isEngineReady) stockfish.newGame();

    if (isMultiplayerGame && p2p.isConnected && !remoteApplyingMoveRef.current) {
      p2p.sendMessage({ type: 'new_game' });
    }
  };

  const handleStartConfiguredGame = () => {
    if (!uiCapabilities.canStartGame) return;

    setGameStarted(true);
    setIsTimerActive(true);
    playGameStartSound();

    if (gameMode === 'computer' && playerColor === 'black') {
      setTimeout(() => makeComputerMove(), 500);
    }
  };

  const handleRematch = () => {
    if (gameMode === 'computer') {
      const newColor = playerColor === 'white' ? 'black' : 'white';
      setPlayerColor(newColor);
      setIsBoardFlipped(newColor === 'black');
    }
    handleNewGame();
  };

  const handlePlayFriend = () => {
    if (!uiCapabilities.canOpenMultiplayer) return;

    setGameMode('human');
    setIsMultiplayerGame(false);
    setMultiplayerSide('w');
    setIsMultiplayerStarted(false);
    setMultiplayerNotice('');
    p2p.disconnect();
    setIsBoardFlipped(false);
    setEntryMode('multiplayer');
  };

  const handleSelectGameMode = ({ mode }) => {
    if (isMultiplayerGame && mode !== 'human') {
      console.log('Multiplayer game is active. Computer mode is disabled.');
      return;
    }
    setGameMode(mode);
    console.log(`Game mode changed to: ${mode}`);
  };

  const triggerResignHighlight = () => {
    setHighlightResign(true);
    if (resignHighlightTimeoutRef.current) {
      clearTimeout(resignHighlightTimeoutRef.current);
    }
    resignHighlightTimeoutRef.current = setTimeout(() => {
      setHighlightResign(false);
    }, 2200);
  };

  const handleNewGameRequest = () => {
    // Protect against accidental reset during an ongoing game.
    if (uiCapabilities.canUseInGameActions) {
      triggerResignHighlight();
      return;
    }
    handleNewGame();
  };

  const handlePlaySelectFromNav = (mode) => {
    const isActiveGame = uiCapabilities.canUseInGameActions;
    if (isActiveGame) {
      triggerResignHighlight();
      return;
    }

    handleSelectGameMode({ mode });
    setShowGameOverUI(false);
    setShowDrawOffer(false);
    clearSelection();
    setGameStarted(false);
    setHighlightResign(false);
  };

  const handleRefreshBoardView = () => {
    // Force board UI remount without changing game state or position.
    clearSelection();
    setBoardViewKey(prev => prev + 1);
  };

  useEffect(() => {
    return () => {
      if (resignHighlightTimeoutRef.current) {
        clearTimeout(resignHighlightTimeoutRef.current);
      }
    };
  }, []);

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


  const handleUiSettingsChange = (partial, options = {}) => {
    const fromThemePreset = options.fromThemePreset === true;
    setUiSettings((prev) => {
      const next = sanitizeUiSettings({ ...prev, ...partial });
      if (!fromThemePreset) {
        const touchesThemeScope = Object.keys(partial || {}).some((key) => THEME_SCOPE_KEYS.has(key));
        if (touchesThemeScope) {
          next.appThemePreset = 'custom';
        }
      }
      return next;
    });
  };

  const handleApplyThemePreset = (presetId) => {
    const preset = THEME_PRESET_MAP[presetId];
    if (!preset) return;
    handleUiSettingsChange({
      appThemePreset: presetId,
      ...preset,
    }, { fromThemePreset: true });
  };

  const handleResetVisualSettings = () => {
    handleApplyThemePreset('classic');
    setUiSettings((prev) => sanitizeUiSettings({
      ...prev,
      appThemePreset: 'classic',
      ...THEME_PRESET_MAP.classic,
      customLightSquare: DEFAULT_UI_SETTINGS.customLightSquare,
      customDarkSquare: DEFAULT_UI_SETTINGS.customDarkSquare,
    }));
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

    if (isMultiplayerGame && p2p.isConnected && !remoteApplyingMoveRef.current) {
      p2p.sendMessage({ type: 'resign', by: multiplayerSide });
    }

    const winner = currentTurn === 'w' ? (playerNames.black || 'Black') : (playerNames.white || 'White');
    setManualGameEnd('resigned');
    setIsTimerActive(false);
    setShowGameOverUI(true);
    playGameEndSound();

    const pgnResult = currentTurn === 'w' ? '0-1' : '1-0';
    const pgn = generatePGN({
      whitePlayer: playerNames.white || 'White',
      blackPlayer: playerNames.black || 'Black',
      result: pgnResult,
      moveHistory: moveHistory,
      gameState: 'resigned',
      timeControl: formatPGNTimeControl(selectedTimeControl.base, selectedTimeControl.increment),
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

      p2p.sendMessage({ type: 'draw_offer', by: multiplayerSide });
      setMultiplayerNotice('Draw request sent. Waiting for opponent...');
      return;
    }

    setShowDrawOffer(true);
  };

  const handleAcceptDraw = () => {
    if (isMultiplayerGame && incomingDrawOfferSide) {
      p2p.sendMessage({ type: 'draw_response', accepted: true });
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
      moveHistory: moveHistory,
      gameState: 'draw',
      timeControl: formatPGNTimeControl(selectedTimeControl.base, selectedTimeControl.increment),
    });
    setCurrentPGN(pgn);
    console.log('Game PGN (Draw by agreement):', pgn);
  };

  const handleDeclineDraw = () => {
    if (isMultiplayerGame && incomingDrawOfferSide) {
      p2p.sendMessage({ type: 'draw_response', accepted: false });
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
      p2p.sendMessage({ type: 'name_update', side, value });
    }
  };

  const resetPlayerNames = () => {
    if (isMultiplayerGame) return;
    setPlayerNames({ white: 'White', black: 'Black' });
  };

  const startMultiplayerMatch = (side) => {
    setGameMode('human');
    setIsMultiplayerGame(true);
    setIsMultiplayerStarted(true);
    setMultiplayerSide(side);
    setIsBoardFlipped(side === 'b');
    setEntryMode('local');
    setMultiplayerNotice('Match started.');
    engineResetGame();
    setManualGameEnd(null);
    setShowGameOverUI(false);
    setShowDrawOffer(false);
    setIncomingDrawOfferSide(null);
    setGameStarted(true);
    setIsTimerActive(true);
    setWhiteTime(selectedTimeControl.base * 1000);
    setBlackTime(selectedTimeControl.base * 1000);
    playGameStartSound();
  };

  useEffect(() => {
    if (!isMultiplayerGame || !gameStarted) return;
    if (p2p.status === 'disconnected' || p2p.status === 'error') {
      setManualGameEnd('abandoned');
      setShowGameOverUI(true);
      setIsTimerActive(false);
      setMultiplayerNotice('Connection lost. Game abandoned.');
    }
  }, [p2p.status, isMultiplayerGame, gameStarted]);

  useEffect(() => {
    if (!p2p.lastMessage) return;

    const msg = p2p.lastMessage;

    if (msg.type === 'start_game' && entryMode === 'multiplayer' && p2p.role === 'guest') {
      const guestSide = msg.hostSide === 'b' ? 'w' : 'b';
      startMultiplayerMatch(guestSide);
    }

    if (msg.type === 'move' && msg.move && isMultiplayerGame) {
      remoteApplyingMoveRef.current = true;
      performMove(msg.move);
      remoteApplyingMoveRef.current = false;
    }

    if (msg.type === 'new_game' && isMultiplayerGame) {
      remoteApplyingMoveRef.current = true;
      handleNewGame();
      remoteApplyingMoveRef.current = false;
      setMultiplayerNotice('Opponent started a new game.');
    }

    if (msg.type === 'draw_offer' && isMultiplayerGame) {
      setIncomingDrawOfferSide(msg.by || null);
      setShowDrawOffer(true);
      setMultiplayerNotice('Opponent offered a draw.');
    }

    if (msg.type === 'draw_response' && isMultiplayerGame) {
      if (msg.accepted) {
        setShowDrawOffer(false);
        setIncomingDrawOfferSide(null);
        setManualGameEnd('draw');
        setShowGameOverUI(true);
        setIsTimerActive(false);
        playGameEndSound();
        setMultiplayerNotice('Draw accepted.');
      } else {
        setMultiplayerNotice('Opponent declined draw request.');
      }
    }

    if (msg.type === 'resign' && isMultiplayerGame) {
      setManualGameEnd('resigned');
      setIsTimerActive(false);
      setShowGameOverUI(true);
      playGameEndSound();
      setMultiplayerNotice('Opponent resigned.');
    }

    if (msg.type === 'name_update' && msg.side && typeof msg.value === 'string') {
      setPlayerNames((prev) => ({ ...prev, [msg.side]: msg.value }));
    }

    p2p.clearLastMessage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p2p.lastMessage]);

  // ══════════════════════════════════════════════════════════════════
  // DISPLAY COMPUTATION
  // ══════════════════════════════════════════════════════════════════

  const formatTime = (timeInMs) => {
    const totalSeconds = Math.floor(timeInMs / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const milliseconds = Math.floor((timeInMs % 1000) / 10);
    if (totalSeconds < 10) {
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}   `;
  };

  const fileLabels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const rankLabels = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const effectiveBoardFlipped = uiSettings.orientation === 'auto'
    ? currentTurn === 'b'
    : isBoardFlipped;

  const displayBoard = effectiveBoardFlipped
    ? [...activeBoard].reverse().map(row => [...row].reverse())
    : activeBoard;
  const displayFileLabels = effectiveBoardFlipped ? [...fileLabels].reverse() : fileLabels;
  const displayRankLabels = effectiveBoardFlipped ? [...rankLabels].reverse() : rankLabels;

  const displaySelectedSquare = selectedSquare && effectiveBoardFlipped
    ? { row: 7 - selectedSquare.row, col: 7 - selectedSquare.col }
    : selectedSquare;

  const displayValidMoves = effectiveBoardFlipped
    ? validMoves.map(move => ({ row: 7 - move.row, col: 7 - move.col }))
    : validMoves;

  const displayKingInCheckPos = activeKingInCheckPos && effectiveBoardFlipped
    ? { row: 7 - activeKingInCheckPos.row, col: 7 - activeKingInCheckPos.col }
    : activeKingInCheckPos;

  const displayLastMove = activeLastMove && effectiveBoardFlipped
    ? {
      from: { row: 7 - activeLastMove.from.row, col: 7 - activeLastMove.from.col },
      to: { row: 7 - activeLastMove.to.row, col: 7 - activeLastMove.to.col },
      piece: activeLastMove.piece
    }
    : activeLastMove;

  const isGameOverUIState = uiState === UI_STATES.GAME_OVER;
  const showMobileStartPanel = uiState === UI_STATES.LOCAL_GAME && !gameStarted;
  const displayTurn = currentTurn;

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

  return (
    <div
      className={`h-screen w-screen flex flex-col lg:flex-row overflow-hidden bg-cover bg-center ${uiSettings.reduceMotion ? 'motion-reduce' : ''}`}
      style={appBackgroundStyle}
    >
      {/* Left Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar
          onSelectGameMode={handleSelectGameMode}
          onOpenSettings={() => setShowAppSettings(true)}
          onRefresh={handleRefreshBoardView}
          onPlaySelect={handlePlaySelectFromNav}
        />
      </div>

      {/* Center Area - Chess Board */}
      <div className="flex-1 flex flex-col items-center px-1 sm:px-4 lg:px-8 py-4 overflow-y-auto lg:justify-center pb-20 lg:pb-0">

        <BoardContainer
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
          displayTurn={displayTurn}
          boardViewKey={boardViewKey}
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
          activePieceImages={activePieceImages}
          boardThemeColors={boardThemeColors}
          uiSettings={uiSettings}
        />

        {showPromotionUI && (
          <PawnPromotionUI
            promotionSquare={promotionSquare}
            onPromotion={handlePromotion}
            onCancel={handleCancelPromotion}
          />
        )}

        {isGameOverUIState && (
          <GameOverModal
            gameState={gameState}
            currentTurn={currentTurn}
            onNewGame={handleNewGame}
            onRematch={handleRematch}
            onReview={handleGameReview}
            onClose={() => setShowGameOverUI(false)}
          />
        )}

        {showDrawOffer && (
          <DrawOfferModal
            currentTurn={currentTurn}
            offeringSide={incomingDrawOfferSide}
            onAccept={handleAcceptDraw}
            onDecline={handleDeclineDraw}
          />
        )}

        {showAppSettings && (
          <SettingsModal
            onClose={() => setShowAppSettings(false)}
            uiSettings={uiSettings}
            onUiSettingsChange={handleUiSettingsChange}
            onApplyThemePreset={handleApplyThemePreset}
            onResetVisualSettings={handleResetVisualSettings}
            boardSurfaceOptions={boardSurfaceOptions}
            pieceSetOptions={pieceSetOptions}
          />
        )}

        {showGameSettings && (
          <GameSettingsModal
            onClose={() => setShowGameSettings(false)}
            whiteName={playerNames.white}
            blackName={playerNames.black}
            onWhiteNameChange={(value) => updatePlayerName('white', value)}
            onBlackNameChange={(value) => updatePlayerName('black', value)}
            onResetNames={resetPlayerNames}
            canEditWhite={!isMultiplayerGame || multiplayerSide === 'w'}
            canEditBlack={!isMultiplayerGame || multiplayerSide === 'b'}
            showReset={!isMultiplayerGame}
            uiSettings={uiSettings}
            onUiSettingsChange={handleUiSettingsChange}
            onFlipBoard={() => setIsBoardFlipped((prev) => !prev)}
            onResign={handleResign}
            onOfferDraw={handleOfferDraw}
            canUseInGameActions={uiCapabilities.canUseInGameActions}
          />
        )}

        {/* Mobile Start Game Panel */}
        {showMobileStartPanel && (
          <MobileStartGamePanel
            selectedTimeControl={selectedTimeControl}
            onSelectTimeControl={handleSelectTimeControl}
            gameMode={gameMode}
            onSelectGameMode={handleSelectGameMode}
            computerDifficulty={computerDifficulty}
            onComputerDifficultyChange={handleComputerDifficultyChange}
            onStartGame={handleStartConfiguredGame}
            canStartGame={uiCapabilities.canStartGame}
          />
        )}

        {/* Mobile Game Panel */}
        {gameStarted && (
          <div className="lg:hidden w-full max-w-[min(560px,100vw)] mt-4">
            <GamePanel
              moveHistory={activeMoveHistory}
              currentTurn={currentTurn}
              onResign={handleResign}
              onOfferDraw={handleOfferDraw}
              gameState={gameState}
              mobileLayout={true}
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
          </div>
        )}

        {/* Mobile Bottom Navigation */}
        <MobileNavigation
          handlePlaySelectFromNav={handlePlaySelectFromNav}
          gameMode={gameMode}
          handleRefreshBoardView={handleRefreshBoardView}
          setShowAppSettings={setShowAppSettings}
          setIsBoardFlipped={setIsBoardFlipped}
          effectiveBoardFlipped={effectiveBoardFlipped}
        />
      </div>

      {/* Right Panel - Hidden on mobile */}
      <div className="hidden lg:block">
        <RightPanel
          selectedTimeControl={selectedTimeControl}
          onSelectTimeControl={handleSelectTimeControl}
          gameStarted={gameStarted}
          onStartGame={handleStartConfiguredGame}
          moveHistory={activeMoveHistory}
          currentTurn={currentTurn}
          onNewGame={handleNewGameRequest}
          onResign={handleResign}
          onOfferDraw={handleOfferDraw}
          gameState={gameState}
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
          isMultiplayerGame={isMultiplayerGame}
          canUseInGameActions={uiCapabilities.canUseInGameActions}
          canStartGame={uiCapabilities.canStartGame}
          canPlayFriend={uiCapabilities.canOpenMultiplayer}
          onSelectGameMode={handleSelectGameMode}
          gameMode={gameMode}
          computerDifficulty={computerDifficulty}
          onComputerDifficultyChange={handleComputerDifficultyChange}
          playerColor={playerColor}
          onPlayerColorChange={handlePlayerColorChange}
          highlightResign={highlightResign}
          onPlayFriend={handlePlayFriend}
        />
      </div>

      {/* Empty Right Space - Hidden on mobile */}
      <div className="hidden lg:block w-30" style={{ background: 'rgba(8, 16, 26, 0.18)' }}></div>
    </div>
  );
}

export default App;
