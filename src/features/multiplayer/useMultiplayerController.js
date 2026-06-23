import { useCallback, useEffect } from 'react';
import { playGameEndSound } from '../../utils/sounds';

export function useMultiplayerController({
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
}) {
  const startMultiplayerMatch = useCallback((side) => {
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
  }, [
    engineResetGame,
    playGameStartSound,
    selectedTimeControl.base,
    setBlackTime,
    setEntryMode,
    setGameMode,
    setGameStarted,
    setIncomingDrawOfferSide,
    setIsBoardFlipped,
    setIsMultiplayerGame,
    setIsMultiplayerStarted,
    setIsTimerActive,
    setManualGameEnd,
    setMultiplayerNotice,
    setMultiplayerSide,
    setShowDrawOffer,
    setShowGameOverUI,
    setWhiteTime,
  ]);

  useEffect(() => {
    if (!isMultiplayerGame || !gameStarted) return;
    if (p2p.status === 'disconnected' || p2p.status === 'error') {
      setManualGameEnd('abandoned');
      setShowGameOverUI(true);
      setIsTimerActive(false);
      setMultiplayerNotice('Connection lost. Game abandoned.');
    }
  }, [
    gameStarted,
    isMultiplayerGame,
    p2p.status,
    setIsTimerActive,
    setManualGameEnd,
    setMultiplayerNotice,
    setShowGameOverUI,
  ]);

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
  }, [
    entryMode,
    handleNewGame,
    isMultiplayerGame,
    p2p.clearLastMessage,
    p2p.lastMessage,
    p2p.role,
    performMove,
    // BUG-14 FIX: playGameStartSound removed — it is not used inside this
    // effect (only in startMultiplayerMatch), so it must not be a dep here.
    remoteApplyingMoveRef,
    setIncomingDrawOfferSide,
    setIsTimerActive,
    setManualGameEnd,
    setMultiplayerNotice,
    setPlayerNames,
    setShowDrawOffer,
    setShowGameOverUI,
    startMultiplayerMatch,
  ]);

  return {
    startMultiplayerMatch,
  };
}
