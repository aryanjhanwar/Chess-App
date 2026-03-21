import { useState, useEffect, useRef } from 'react'
import { generatePGN, getPGNResult, formatPGNTimeControl } from './engine/pgn.js'
import { useChessTimer } from './hooks/useChessTimer'
import { useGameEngine, isPromotionTag, getPromotionPieceType, uciToV2Move } from './hooks/useGameEngine'
import { usePawnPromotion } from './hooks/usePawnPromotion'
import { useReviewMode } from './hooks/useReviewMode'
import { playMoveSound, playCaptureSound, playCheckSound, playCastleSound, playGameStartSound, playGameEndSound, playPromotionSound } from './utils/sounds'
import Sidebar from './components/Sidebar'
import RightPanel from './components/RightPanel'
import GamePanel from './components/GamePanel'
import MobileStartGamePanel from './components/MobileStartGamePanel'
import ChessBoardView from './components/ChessBoardView'
import PawnPromotionUI from './components/PawnPromotionUI'
import GameOverModal from './components/GameOverModal'
import DrawOfferModal from './components/DrawOfferModal'
import SettingsModal from './components/SettingsModal'
import PlayerCard from './components/PlayerCard'
import EvaluationBar from './components/EvaluationBar'
import { initBitboardEngine } from './engine/index.js'
import { useStockfish } from './hooks/useStockfish'
import { getDifficultySettings } from './utils/stockfishUtils'

function App() {
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
    renderTick,
    executeMove: engineExecuteMove,
    resetGame: engineResetGame,
    getReviewSnapshots,
    positionRef,
    historyRef,
  } = useGameEngine();

  // Aliases for compatibility with the rest of the component
  const board = displayPieces;
  const currentTurn = sideToMove;
  const inCheck = checkInfo.inCheck;
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

  // Review mode
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
    canGoBack,
    canGoForward,
    getCurrentReviewState,
    getFinalReviewState
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
  const [isBoardFlipped, setIsBoardFlipped] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playerNames, setPlayerNames] = useState({ white: 'White', black: 'Black' });

  // Game mode & computer opponent
  const [gameMode, setGameMode] = useState('human');
  const [playerColor, setPlayerColor] = useState('white');
  const [computerDifficulty, setComputerDifficulty] = useState(5);

  const isComputerTurn = (turn = currentTurn) => {
    if (gameMode !== 'computer') return false;
    return (
      (playerColor === 'white' && turn === 'b') ||
      (playerColor === 'black' && turn === 'w')
    );
  };

  // Review mode display state (overrides engine state during review)
  const [reviewDisplayState, setReviewDisplayState] = useState(null);
  const [boardViewKey, setBoardViewKey] = useState(0);
  const [highlightResign, setHighlightResign] = useState(false);
  const resignHighlightTimeoutRef = useRef(null);

  // Initialize Stockfish
  const stockfish = useStockfish();

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
  }, [computerDifficulty, stockfish.isEngineReady]);

  // Evaluate position after every move (FEN from engine, zero conversions)
  useEffect(() => {
    if (!stockfish.isEngineReady || !gameStarted || stockfish.isThinking) return;
    stockfish.evaluatePosition(fen, 12, 500);
  }, [fen, stockfish.isEngineReady, gameStarted, stockfish.isThinking]);

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
  const activeBoard          = (isReviewMode && reviewDisplayState) ? reviewDisplayState.displayPieces : board;
  const activeInCheck        = (isReviewMode && reviewDisplayState) ? reviewDisplayState.inCheck : inCheck;
  const activeKingInCheckPos = (isReviewMode && reviewDisplayState) ? reviewDisplayState.kingInCheckPos : kingInCheckPos;
  const activeLastMove       = (isReviewMode && reviewDisplayState) ? reviewDisplayState.lastMoveInfo : lastMove;
  const activeCapturedPieces = (isReviewMode && reviewDisplayState) ? reviewDisplayState.capturedPieces : capturedPieces;
  const activeMoveHistory    = (isReviewMode && reviewDisplayState) ? (reviewDisplayState.moveHistory || moveHistory) : moveHistory;

  // ══════════════════════════════════════════════════════════════════
  // CLICK HANDLING
  // ══════════════════════════════════════════════════════════════════

  const handleSquareClick = (displayRow, displayCol) => {
    if (!gameStarted || gameState !== 'playing' || isReviewMode) return;

    // Block human input when it's the computer's turn
    if (isComputerTurn()) return;

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
    // Build review snapshots from engine history
    const snapshots = getReviewSnapshots();
    const lastIdx = snapshots.length - 1;
    // enterReviewMode(currentState, gameHistory)
    enterReviewMode(snapshots[lastIdx], snapshots.slice(0, lastIdx));
    setReviewDisplayState(snapshots[lastIdx]);
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
    setReviewDisplayState(null);
    exitReviewMode();
  };

  // ══════════════════════════════════════════════════════════════════
  // COMPUTER MOVE (Stockfish)
  // ══════════════════════════════════════════════════════════════════

  const makeComputerMove = async () => {
    if (!stockfish.isEngineReady || gameMode !== 'computer' || gameState !== 'playing') return;

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
    if (!gameStarted || gameState !== 'playing' || isReviewMode || showPromotionUI) return;
    if (isComputerTurn()) {
      const timer = setTimeout(() => makeComputerMove(), 300);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTurn, gameStarted, gameState, gameMode, playerColor, isReviewMode, showPromotionUI]);

  // ══════════════════════════════════════════════════════════════════
  // GAME LIFECYCLE
  // ══════════════════════════════════════════════════════════════════

  const handleNewGame = () => {
    engineResetGame();
    setManualGameEnd(null);
    setWhiteTime(selectedTimeControl.base * 1000);
    setBlackTime(selectedTimeControl.base * 1000);
    setIsTimerActive(true);
    setGameStarted(true);
    setShowGameOverUI(false);
    setCurrentPGN('');
    setReviewDisplayState(null);
    exitReviewMode();
    clearSelection();
    playGameStartSound();
    if (stockfish.isEngineReady) stockfish.newGame();
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
    setGameMode('human');
    setIsBoardFlipped(false);
    handleNewGame();
  };

  const handleSelectGameMode = ({ mode }) => {
    setGameMode(mode);
    console.log(`Game mode changed to: ${mode}`);
  };

  const handlePlaySelectFromNav = (mode) => {
    const isActiveGame = gameStarted && gameState === 'playing' && !isReviewMode;
    if (isActiveGame) {
      setHighlightResign(true);
      if (resignHighlightTimeoutRef.current) {
        clearTimeout(resignHighlightTimeoutRef.current);
      }
      resignHighlightTimeoutRef.current = setTimeout(() => {
        setHighlightResign(false);
      }, 2200);
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

  const handleResign = () => {
    setHighlightResign(false);
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
    setShowDrawOffer(true);
  };

  const handleAcceptDraw = () => {
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
    setShowDrawOffer(false);
    console.log('Draw offer declined. Game continues.');
  };

  const handleSelectTimeControl = (control) => {
    setSelectedTimeControl(control);
    setWhiteTime(control.base * 1000);
    setBlackTime(control.base * 1000);
  };

  const updatePlayerName = (side, value) => {
    setPlayerNames((prev) => ({
      ...prev,
      [side]: value,
    }));
  };

  const resetPlayerNames = () => {
    setPlayerNames({ white: 'White', black: 'Black' });
  };

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

  const displayBoard = isBoardFlipped
    ? [...activeBoard].reverse().map(row => [...row].reverse())
    : activeBoard;
  const displayFileLabels = isBoardFlipped ? [...fileLabels].reverse() : fileLabels;
  const displayRankLabels = isBoardFlipped ? [...rankLabels].reverse() : rankLabels;

  const displaySelectedSquare = selectedSquare && isBoardFlipped
    ? { row: 7 - selectedSquare.row, col: 7 - selectedSquare.col }
    : selectedSquare;

  const displayValidMoves = isBoardFlipped
    ? validMoves.map(move => ({ row: 7 - move.row, col: 7 - move.col }))
    : validMoves;

  const displayKingInCheckPos = activeKingInCheckPos && isBoardFlipped
    ? { row: 7 - activeKingInCheckPos.row, col: 7 - activeKingInCheckPos.col }
    : activeKingInCheckPos;

  const displayLastMove = activeLastMove && isBoardFlipped
    ? {
      from: { row: 7 - activeLastMove.from.row, col: 7 - activeLastMove.from.col },
      to: { row: 7 - activeLastMove.to.row, col: 7 - activeLastMove.to.col },
      piece: activeLastMove.piece
    }
    : activeLastMove;

  return (
    <div className="h-screen w-screen flex flex-col lg:flex-row bg-linear-to-br from-[#0bb0e5] via-[#0483ad] to-[#0bb0e5] overflow-hidden">
      {/* Left Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar
          onSelectGameMode={handleSelectGameMode}
          onOpenSettings={() => setShowSettings(true)}
          onRefresh={handleRefreshBoardView}
          onPlaySelect={handlePlaySelectFromNav}
        />
      </div>

      {/* Center Area - Chess Board */}
      <div className="flex-1 flex flex-col items-center px-1 sm:px-4 lg:px-8 py-4 overflow-y-auto lg:justify-center pb-20 lg:pb-0">

        {/* Top Bar - Player */}
        <div className="w-full max-w-[min(560px,100vw)] flex items-center justify-between mb-2">
          <div className="flex items-center gap-3 flex-1">
            <PlayerCard
              color={isBoardFlipped ? 'w' : 'b'}
              playerName={isBoardFlipped ? (playerNames.white || 'White') : (playerNames.black || 'Black')}
              capturedPieces={isBoardFlipped ? activeCapturedPieces.b : activeCapturedPieces.w}
              opponentCapturedPieces={isBoardFlipped ? activeCapturedPieces.w : activeCapturedPieces.b}
            />
          </div>
          <div
            className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg font-bold text-lg sm:text-xl transition-all font-mono min-w-[100px] sm:min-w-[120px] text-center ${
              (isBoardFlipped ? whiteTime : blackTime) < 10000
                ? 'bg-red-600 text-white shadow-lg shadow-red-500/50'
                : 'bg-gray-700 text-gray-100'
            }`}
          >
            {formatTime(isBoardFlipped ? whiteTime : blackTime)}
          </div>
        </div>

        {/* Chess Board + Evaluation Bar */}
        <div className="relative flex flex-row items-center">
          <EvaluationBar
            evaluation={evalValue}
            mate={mateValue}
            depth={stockfish.depth}
            isThinking={stockfish.isThinking}
            isBoardFlipped={isBoardFlipped}
            currentTurn={currentTurn}
          />
          <ChessBoardView
            key={boardViewKey}
            board={displayBoard}
            selectedSquare={displaySelectedSquare}
            validMoves={displayValidMoves}
            kingInCheckPos={displayKingInCheckPos}
            lastMove={displayLastMove}
            onSquareClick={handleSquareClick}
            rankLabels={displayRankLabels}
            fileLabels={displayFileLabels}
            gameState={gameState}
            isReviewMode={isReviewMode}
          />

          {/* Settings Button - Desktop only */}
          <button
            onClick={() => setShowSettings(true)}
            className="hidden sm:block absolute sm:top-0 sm:-right-14 backdrop-blur-sm rounded-lg px-3 py-3 font-semibold transition-all text-white shadow-lg"
            style={{ background: 'rgba(255,255,255,0.15)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            title="Settings"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Flip Board Button - Desktop only */}
          <button
            onClick={() => setIsBoardFlipped(!isBoardFlipped)}
            className="hidden sm:block absolute sm:top-1/2 sm:-right-14 sm:-translate-y-1/2 backdrop-blur-sm rounded-lg px-3 py-3 font-semibold transition-all text-white shadow-lg"
            style={{ background: 'rgba(255,255,255,0.15)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            title="Flip board"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>

          {/* Pawn Promotion UI */}
          {showPromotionUI && (
            <PawnPromotionUI
              promotionSquare={promotionSquare}
              onPromotion={handlePromotion}
              onCancel={handleCancelPromotion}
            />
          )}

          {/* Game Over Modal */}
          {gameState !== 'playing' && showGameOverUI && (
            <GameOverModal
              gameState={gameState}
              currentTurn={currentTurn}
              onNewGame={handleNewGame}
              onRematch={handleRematch}
              onGameReview={handleGameReview}
              onClose={() => setShowGameOverUI(false)}
            />
          )}

          {/* Draw Offer Modal */}
          {showDrawOffer && (
            <DrawOfferModal
              currentTurn={currentTurn}
              onAccept={handleAcceptDraw}
              onDecline={handleDeclineDraw}
            />
          )}
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <SettingsModal
            onClose={() => setShowSettings(false)}
            whiteName={playerNames.white}
            blackName={playerNames.black}
            onWhiteNameChange={(value) => updatePlayerName('white', value)}
            onBlackNameChange={(value) => updatePlayerName('black', value)}
            onResetNames={resetPlayerNames}
          />
        )}

        {/* Bottom Bar - Player */}
        <div className="w-full max-w-[min(560px,100vw)] flex items-center justify-between mt-2">
          <div className="flex items-center gap-3 flex-1">
            <PlayerCard
              color={isBoardFlipped ? 'b' : 'w'}
              playerName={isBoardFlipped ? (playerNames.black || 'Black') : (playerNames.white || 'White')}
              capturedPieces={isBoardFlipped ? activeCapturedPieces.w : activeCapturedPieces.b}
              opponentCapturedPieces={isBoardFlipped ? activeCapturedPieces.b : activeCapturedPieces.w}
            />
          </div>
          <div
            className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg font-bold text-lg sm:text-xl transition-all font-mono min-w-[100px] sm:min-w-[120px] text-center ${
              (isBoardFlipped ? blackTime : whiteTime) < 10000
                ? 'bg-red-600 text-white shadow-lg shadow-red-500/50'
                : 'bg-gray-700 text-gray-100'
            }`}
          >
            {formatTime(isBoardFlipped ? blackTime : whiteTime)}
          </div>
        </div>

        {/* Mobile Start Game Panel */}
        {!gameStarted && (
          <MobileStartGamePanel
            selectedTimeControl={selectedTimeControl}
            onSelectTimeControl={handleSelectTimeControl}
            gameMode={gameMode}
            onSelectGameMode={handleSelectGameMode}
            computerDifficulty={computerDifficulty}
            onComputerDifficultyChange={handleComputerDifficultyChange}
            onStartGame={handleNewGame}
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
            />
          </div>
        )}

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 backdrop-blur-md py-2.5 px-3 grid grid-cols-4 gap-1 items-center border-t border-white/20 z-50" style={{ background: 'rgba(0, 150, 200, 0.88)' }}>
          <button
            onClick={() => handlePlaySelectFromNav(gameMode)}
            className="flex flex-col items-center justify-center gap-1 text-white transition-all active:scale-95 rounded-lg py-1.5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-4.197-2.432A1 1 0 009 9.602v4.796a1 1 0 001.555.832l4.197-2.432a1 1 0 000-1.73z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-semibold">Play</span>
          </button>
            <button
              onClick={handleRefreshBoardView}
              className="flex flex-col items-center justify-center gap-1 text-white transition-all active:scale-95 rounded-lg py-1.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m14.836 2A8.001 8.001 0 005.582 9m0 0H9m11 11v-5h-.581m0 0A8.003 8.003 0 016.164 15m13.255 0H15" />
              </svg>
              <span className="text-xs font-medium">Refresh</span>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="flex flex-col items-center justify-center gap-1 text-white transition-all active:scale-95 rounded-lg py-1.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs font-medium">Settings</span>
            </button>
            <button
              onClick={() => setIsBoardFlipped(!isBoardFlipped)}
              className="flex flex-col items-center justify-center gap-1 text-white transition-all active:scale-95 rounded-lg py-1.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              <span className="text-xs font-medium">Flip</span>
            </button>
          </div>
      </div>

      {/* Right Panel - Hidden on mobile */}
      <div className="hidden lg:block">
        <RightPanel
          selectedTimeControl={selectedTimeControl}
          onSelectTimeControl={handleSelectTimeControl}
          gameStarted={gameStarted}
          onStartGame={() => {
            setGameStarted(true);
            setIsTimerActive(true);
            playGameStartSound();
            if (gameMode === 'computer' && playerColor === 'black') {
              setTimeout(() => makeComputerMove(), 500);
            }
          }}
          moveHistory={activeMoveHistory}
          currentTurn={currentTurn}
          onNewGame={handleNewGame}
          onResign={handleResign}
          onOfferDraw={handleOfferDraw}
          gameState={gameState}
          isReviewMode={isReviewMode}
          reviewIndex={reviewIndex}
          reviewHistoryLength={reviewHistoryLength}
          isPlaying={isPlaying}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          onReviewPrevious={handleReviewPrevious}
          onReviewNext={handleReviewNext}
          onReviewStart={handleReviewStart}
          onReviewEnd={handleReviewEnd}
          onReviewTogglePlay={handleReviewTogglePlay}
          onExitReview={handleExitReview}
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
      <div className="hidden lg:block w-30 bg-linear-to-b from-white/5 to-white/2"></div>
    </div>
  );
}

export default App;
