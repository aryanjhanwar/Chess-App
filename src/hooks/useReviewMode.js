import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for managing review/analysis mode
 * Allows players to review game history after completion
 */
export const useReviewMode = () => {
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewHistory, setReviewHistory] = useState([]);
  const [reviewIndex, setReviewIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef(null);
  // Fix #20: use ref to always have up-to-date length in the interval callback
  const reviewHistoryLengthRef = useRef(0);

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && isReviewMode) {
      playIntervalRef.current = setInterval(() => {
        setReviewIndex((currentIndex) => {
          if (currentIndex >= reviewHistoryLengthRef.current - 1) {
            setIsPlaying(false);
            return currentIndex;
          }
          return currentIndex + 1;
        });
      }, 1500); // Auto-advance every 1.5 seconds
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, isReviewMode]);

  const enterReviewMode = (currentState, gameHistory) => {
    const fullHistory = [...gameHistory, currentState];
    reviewHistoryLengthRef.current = fullHistory.length;
    setIsReviewMode(true);
    setReviewHistory(fullHistory);
    setReviewIndex(gameHistory.length);
    setIsPlaying(false);
  };

  const exitReviewMode = () => {
    setIsReviewMode(false);
    setReviewHistory([]);
    setReviewIndex(-1);
    setIsPlaying(false);
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
  };

  const goToPrevious = () => {
    setIsPlaying(false); // Stop auto-play when manually navigating
    if (reviewIndex > 0) {
      const newIndex = reviewIndex - 1;
      setReviewIndex(newIndex);
      return { state: reviewHistory[newIndex], index: newIndex };
    }
    return null;
  };

  const goToNext = () => {
    setIsPlaying(false); // Stop auto-play when manually navigating
    if (reviewIndex < reviewHistory.length - 1) {
      const newIndex = reviewIndex + 1;
      setReviewIndex(newIndex);
      return { state: reviewHistory[newIndex], index: newIndex };
    }
    return null;
  };

  const goToStart = () => {
    setIsPlaying(false);
    setReviewIndex(0);
    return { state: reviewHistory[0], index: 0 };
  };

  const goToEnd = () => {
    setIsPlaying(false);
    const lastIndex = reviewHistory.length - 1;
    setReviewIndex(lastIndex);
    return { state: reviewHistory[lastIndex], index: lastIndex };
  };

  const toggleAutoPlay = () => {
    // If at the end, restart from current position
    if (reviewIndex >= reviewHistory.length - 1 && !isPlaying) {
      setReviewIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const canGoBack = reviewIndex > 0;
  const canGoForward = reviewIndex < reviewHistory.length - 1;

  return {
    isReviewMode,
    reviewIndex,
    reviewHistoryLength: reviewHistory.length,
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
    getCurrentReviewState: () => reviewHistory[reviewIndex],
    // Fix #8: expose final state (last entry) for handleExitReview
    getFinalReviewState: () => reviewHistory[reviewHistory.length - 1]
  };
};
