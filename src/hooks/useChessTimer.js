import { useEffect, useRef } from 'react';
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
  
  useEffect(() => {
    if (!isTimerActive || gameState !== 'playing') return;
    
    // Use 100ms interval for smoother countdown when time is low
    const interval = setInterval(() => {
      if (currentTurn === 'w') {
        setWhiteTime(prev => {
          const newTime = prev - 100;
          
          // Play warning sound at 10 seconds
          if (newTime <= 10000 && prev > 10000 && !lowTimeWarningPlayed.current.w) {
            playTenSecondsSound();
            lowTimeWarningPlayed.current.w = true;
          }
          
          if (newTime <= 0) {
            playGameEndSound();
            setGameState('timeout');
            setIsTimerActive(false);
            setShowGameOverUI(true);
            return 0;
          }
          return newTime;
        });
      } else {
        setBlackTime(prev => {
          const newTime = prev - 100;
          
          // Play warning sound at 10 seconds
          if (newTime <= 10000 && prev > 10000 && !lowTimeWarningPlayed.current.b) {
            playTenSecondsSound();
            lowTimeWarningPlayed.current.b = true;
          }
          
          if (newTime <= 0) {
            playGameEndSound();
            setGameState('timeout');
            setIsTimerActive(false);
            setShowGameOverUI(true);
            return 0;
          }
          return newTime;
        });
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [isTimerActive, currentTurn, gameState, setWhiteTime, setBlackTime, setGameState, setIsTimerActive, setShowGameOverUI]);
}
