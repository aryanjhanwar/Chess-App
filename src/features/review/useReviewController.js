import { useCallback } from 'react';
import { playMoveSound, playCaptureSound, playCheckSound, playCastleSound } from '../../utils/sounds';

export function useReviewController({
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
  reviewIndex,
  isReviewMode,
  analysisRunIdRef,
}) {
  const applyReviewState = useCallback((state) => {
    setReviewDisplayState(state);
  }, [setReviewDisplayState]);

  const handleGameReview = useCallback(() => {
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
  }, [
    enterReviewMode,
    getReviewSnapshots,
    setAnalysisResults,
    setAnalysisStatus,
    setAnalyzedCount,
    setBlackAccuracy,
    setReviewDisplayState,
    setShowGameOverUI,
    setWhiteAccuracy,
  ]);

  const handleReviewPrevious = useCallback(() => {
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
  }, [applyReviewState, goToPrevious]);

  const handleReviewNext = useCallback(() => {
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
  }, [applyReviewState, goToNext]);

  const handleReviewStart = useCallback(() => {
    const result = goToStart();
    if (result) {
      applyReviewState(result.state);
      playMoveSound();
    }
  }, [applyReviewState, goToStart]);

  const handleReviewEnd = useCallback(() => {
    const result = goToEnd();
    if (result) {
      applyReviewState(result.state);
      playMoveSound();
      if (result.state.inCheck) setTimeout(() => playCheckSound(), 100);
    }
  }, [applyReviewState, goToEnd]);

  const handleReviewTogglePlay = useCallback(() => {
    toggleAutoPlay();
  }, [toggleAutoPlay]);

  const handleExitReview = useCallback(() => {
    analysisRunIdRef.current += 1;
    setReviewDisplayState(null);
    exitReviewMode();
    setShowGameOverUI(true);
  }, [analysisRunIdRef, exitReviewMode, setReviewDisplayState, setShowGameOverUI]);

  return {
    applyReviewState,
    handleGameReview,
    handleReviewPrevious,
    handleReviewNext,
    handleReviewStart,
    handleReviewEnd,
    handleReviewTogglePlay,
    handleExitReview,
  };
}
