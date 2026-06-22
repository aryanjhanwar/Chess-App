import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for managing review/analysis mode
 * Allows players to review game history after completion
 */
export const useReviewMode = () => {
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef(null);

  // Single source of truth stored in refs — eliminates stale closure bugs
  // in goToPrevious/goToNext/goToStart/goToEnd while keeping React state
  // in sync for re-renders.
  const reviewHistoryRef = useRef([]);
  const reviewIndexRef = useRef(-1);

  // Derived React state (triggers re-renders for display only)
  const [reviewIndex, setReviewIndex] = useState(-1);
  const [reviewHistoryLength, setReviewHistoryLength] = useState(0);

  // Sync ref → state (used internally everywhere, state used only for display)
  const commitIndex = useCallback((newIndex) => {
    reviewIndexRef.current = newIndex;
    setReviewIndex(newIndex);
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && isReviewMode) {
      playIntervalRef.current = setInterval(() => {
        const current = reviewIndexRef.current;
        const len = reviewHistoryRef.current.length;
        if (current >= len - 1) {
          setIsPlaying(false);
        } else {
          commitIndex(current + 1);
        }
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
  }, [isPlaying, isReviewMode, commitIndex]);

  const enterReviewMode = useCallback((currentState, gameHistory) => {
    const fullHistory = [...gameHistory, currentState];
    reviewHistoryRef.current = fullHistory;
    reviewIndexRef.current = gameHistory.length;
    setReviewHistoryLength(fullHistory.length);
    setIsReviewMode(true);
    setReviewIndex(gameHistory.length);
    setIsPlaying(false);
  }, []);

  const exitReviewMode = useCallback(() => {
    setIsReviewMode(false);
    reviewHistoryRef.current = [];
    reviewIndexRef.current = -1;
    setReviewHistoryLength(0);
    setReviewIndex(-1);
    setIsPlaying(false);
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
  }, []);

  // These now read from refs — no stale closure, always current value
  const goToPrevious = useCallback(() => {
    setIsPlaying(false);
    const current = reviewIndexRef.current;
    if (current > 0) {
      const newIndex = current - 1;
      commitIndex(newIndex);
      return { state: reviewHistoryRef.current[newIndex], index: newIndex };
    }
    return null;
  }, [commitIndex]);

  const goToNext = useCallback(() => {
    setIsPlaying(false);
    const current = reviewIndexRef.current;
    const len = reviewHistoryRef.current.length;
    if (current < len - 1) {
      const newIndex = current + 1;
      commitIndex(newIndex);
      return { state: reviewHistoryRef.current[newIndex], index: newIndex };
    }
    return null;
  }, [commitIndex]);

  const goToStart = useCallback(() => {
    setIsPlaying(false);
    commitIndex(0);
    return { state: reviewHistoryRef.current[0], index: 0 };
  }, [commitIndex]);

  const goToEnd = useCallback(() => {
    setIsPlaying(false);
    const lastIndex = reviewHistoryRef.current.length - 1;
    commitIndex(lastIndex);
    return { state: reviewHistoryRef.current[lastIndex], index: lastIndex };
  }, [commitIndex]);

  const toggleAutoPlay = useCallback(() => {
    if (reviewIndexRef.current >= reviewHistoryRef.current.length - 1 && !isPlaying) {
      commitIndex(0);
    }
    setIsPlaying(prev => !prev);
  }, [isPlaying, commitIndex]);

  const canGoBack = reviewIndex > 0;
  const canGoForward = reviewIndex < reviewHistoryLength - 1;

  return {
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
    // These read from refs — always current, safe to call at any time
    getCurrentReviewState: () => reviewHistoryRef.current[reviewIndexRef.current],
    getFinalReviewState: () => reviewHistoryRef.current[reviewHistoryRef.current.length - 1],
  };
};
