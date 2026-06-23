import { useCallback } from 'react';
import { generatePGN, getPGNResult, formatPGNTimeControl } from '@/shared/chess/engine/pgn.js';
import { playMoveSound, playCaptureSound, playCheckSound, playCastleSound, playGameEndSound } from '../../utils/sounds';

export function useMoveExecution({
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
}) {
  const applyTimeIncrement = useCallback(() => {
    if (selectedTimeControl.increment > 0) {
      if (currentTurn === 'w') {
        setWhiteTime((prev) => prev + (selectedTimeControl.increment * 1000));
      } else {
        setBlackTime((prev) => prev + (selectedTimeControl.increment * 1000));
      }
    }
  }, [currentTurn, selectedTimeControl.increment, setBlackTime, setWhiteTime]);

  const handleGameOver = useCallback((endState, nextTurn, finalMoveHistory) => {
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
  }, [playerNames.black, playerNames.white, selectedTimeControl.base, selectedTimeControl.increment, setCurrentPGN, setIsTimerActive, setShowGameOverUI]);

  const performMove = useCallback((v2Move) => {
    const result = engineExecuteMove(v2Move);

    if (isMultiplayerGame && p2p.isConnected && !remoteApplyingMoveRef.current) {
      p2p.sendMessage({ type: 'move', move: v2Move });
    }

    applyTimeIncrement();
    clearSelection();

    if (result.gameStatus !== 'playing') {
      const isCheckmate = result.gameStatus === 'checkmate';
      playGameEndSound(isCheckmate);
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
  }, [applyTimeIncrement, clearSelection, currentTurn, engineExecuteMove, handleGameOver, isMultiplayerGame, moveHistory, p2p.isConnected, p2p.sendMessage, remoteApplyingMoveRef]);

  return {
    performMove,
    applyTimeIncrement,
    handleGameOver,
  };
}
