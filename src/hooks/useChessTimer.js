import { useEffect, useRef, useCallback } from 'react';
import { playTenSecondsSound, playGameEndSound } from '../utils/sounds';

export function useChessTimer({ 
  isTimerActive, 
  gameState, 
  currentTurn,
  whiteTime,
  blackTime,
  setWhiteTime,
  setBlackTime,
  setGameState,
  setIsTimerActive,
  setShowGameOverUI
}) {
  const lowTimeWarningPlayed = useRef({ w: false, b: false });

  // Handle timeout — triggered by effect, not inside a state updater
  const triggerTimeout = useCallback(() => {
    playGameEndSound();
    setGameState('timeout');
    setIsTimerActive(false);
    setShowGameOverUI(true);
  }, [setGameState, setIsTimerActive, setShowGameOverUI]);

  // Handle low-time warning — triggered by effect, not inside a state updater
  useEffect(() => {
    if (!isTimerActive || gameState !== 'playing') return;

    if (currentTurn === 'w' && whiteTime <= 10000 && whiteTime > 9900 && !lowTimeWarningPlayed.current.w) {
      playTenSecondsSound();
      lowTimeWarningPlayed.current.w = true;
    }
    if (currentTurn === 'b' && blackTime <= 10000 && blackTime > 9900 && !lowTimeWarningPlayed.current.b) {
      playTenSecondsSound();
      lowTimeWarningPlayed.current.b = true;
    }
  }, [isTimerActive, gameState, currentTurn, whiteTime, blackTime]);

  // Handle timeout detection via effect
  useEffect(() => {
    if (!isTimerActive || gameState !== 'playing') return;

    if (currentTurn === 'w' && whiteTime <= 0) {
      triggerTimeout();
    } else if (currentTurn === 'b' && blackTime <= 0) {
      triggerTimeout();
    }
  }, [isTimerActive, gameState, currentTurn, whiteTime, blackTime, triggerTimeout]);

  // Pure countdown — no side effects inside the updater
  useEffect(() => {
    if (!isTimerActive || gameState !== 'playing') return;
    
    const interval = setInterval(() => {
      if (currentTurn === 'w') {
        setWhiteTime(prev => Math.max(0, prev - 100));
      } else {
        setBlackTime(prev => Math.max(0, prev - 100));
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [isTimerActive, currentTurn, gameState, setWhiteTime, setBlackTime]);
}
