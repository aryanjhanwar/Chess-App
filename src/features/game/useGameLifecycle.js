import { useCallback } from 'react';

export function useGameLifecycle({
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
  p2pDisconnect,
  playerColor,
  setPlayerColor,
  setBoardViewKey,
  setHighlightResign,
  uiCapabilities,
  triggerResignHighlight,
  playGameStartSound,
  makeComputerMove,
  gameMode,
}) {
  const handleNewGame = useCallback(() => {
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
  }, [
    analysisCacheRef,
    analysisRunIdRef,
    clearSelection,
    engineResetGame,
    exitReviewMode,
    isMultiplayerGame,
    liveEvalRequestKeyRef,
    p2p.isConnected,
    p2p.sendMessage,
    remoteApplyingMoveRef,
    selectedTimeControl.base,
    setAnalysisResults,
    setAnalysisStatus,
    setAnalyzedCount,
    setBlackTime,
    setCurrentPGN,
    setGameStarted,
    setIncomingDrawOfferSide,
    setIsTimerActive,
    setManualGameEnd,
    setReviewDisplayState,
    setShowDrawOffer,
    setShowGameOverUI,
    setWhiteAccuracy,
    setWhiteTime,
    setBlackAccuracy,
    stockfish.isEngineReady,
    stockfish.newGame,
  ]);

  const handleStartConfiguredGame = useCallback(() => {
    if (!uiCapabilities.canStartGame) return;

    setGameStarted(true);
    setIsTimerActive(true);
    playGameStartSound();

    if (gameMode === 'computer' && playerColor === 'black') {
      setTimeout(() => makeComputerMove(), 500);
    }
  // BUG-08 FIX: makeComputerMove added to deps so the callback never
  // stales over an updated engine reference.
  }, [gameMode, makeComputerMove, playerColor, playGameStartSound, setGameStarted, setIsTimerActive, uiCapabilities.canStartGame]);

  const handleRematch = useCallback(() => {
    if (gameMode === 'computer') {
      const newColor = playerColor === 'white' ? 'black' : 'white';
      setPlayerColor(newColor);
      setIsBoardFlipped(newColor === 'black');
    }
    handleNewGame();
  }, [gameMode, handleNewGame, playerColor, setIsBoardFlipped, setPlayerColor]);

  const handlePlayFriend = useCallback(() => {
    if (!uiCapabilities.canOpenMultiplayer) return;

    setGameMode('human');
    setIsMultiplayerGame(false);
    setMultiplayerSide('w');
    setIsMultiplayerStarted(false);
    setMultiplayerNotice('');
    p2pDisconnect();
    setIsBoardFlipped(false);
    setEntryMode('multiplayer');
  }, [p2pDisconnect, setEntryMode, setGameMode, setIsBoardFlipped, setIsMultiplayerGame, setIsMultiplayerStarted, setMultiplayerNotice, setMultiplayerSide, uiCapabilities.canOpenMultiplayer]);

  const handleSelectGameMode = useCallback(({ mode }) => {
    if (isMultiplayerGame && mode !== 'human') {
      console.log('Multiplayer game is active. Computer mode is disabled.');
      return;
    }
    setGameMode(mode);
    console.log(`Game mode changed to: ${mode}`);
  }, [isMultiplayerGame, setGameMode]);

  const handleNewGameRequest = useCallback(() => {
    if (uiCapabilities.canUseInGameActions) {
      triggerResignHighlight();
      return;
    }
    handleNewGame();
  }, [handleNewGame, triggerResignHighlight, uiCapabilities.canUseInGameActions]);

  const handlePlaySelectFromNav = useCallback((mode) => {
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
  }, [clearSelection, handleSelectGameMode, setGameStarted, setHighlightResign, setShowDrawOffer, setShowGameOverUI, triggerResignHighlight, uiCapabilities.canUseInGameActions]);

  const handleRefreshBoardView = useCallback(() => {
    clearSelection();
    setBoardViewKey((prev) => prev + 1);
  }, [clearSelection, setBoardViewKey]);

  return {
    handleNewGame,
    handleStartConfiguredGame,
    handleRematch,
    handlePlayFriend,
    handleSelectGameMode,
    handleNewGameRequest,
    handlePlaySelectFromNav,
    handleRefreshBoardView,
  };
}
