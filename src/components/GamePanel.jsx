import { useRef, useEffect, useMemo, useState } from 'react';
import ReviewModeControls from './ReviewModeControls';

// Fix #13: accept review mode props so mobile gets review controls too
export default function GamePanel({
  moveHistory,
  currentTurn,
  onResign,
  onOfferDraw,
  gameState,
  isReviewMode,
  reviewIndex,
  reviewHistoryLength,
  isPlaying,
  onReviewPrevious,
  onReviewNext,
  onReviewStart,
  onReviewEnd,
  onReviewTogglePlay,
  onExitReview,
  onGameAnalysis,
  showReviewControls = true,
  mobileLayout = false,
  highlightResign = false
}) {
  const moveHistoryEndRef = useRef(null);
  const resignConfirmTimeoutRef = useRef(null);
  const [confirmResign, setConfirmResign] = useState(false);

  // Group moves into pairs (white move, black move) — memoized
  const movePairs = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < moveHistory.length; i += 2) {
      pairs.push({
        moveNumber: Math.floor(i / 2) + 1,
        white: moveHistory[i],
        black: moveHistory[i + 1] || ''
      });
    }
    return pairs;
  }, [moveHistory]);

  // Auto-scroll move history to the latest move
  useEffect(() => {
    if (moveHistoryEndRef.current) {
      const prefersReducedMotion = typeof window !== 'undefined'
        && typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      moveHistoryEndRef.current.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'nearest'
      });
    }
  }, [moveHistory.length]);

  useEffect(() => {
    return () => {
      if (resignConfirmTimeoutRef.current) {
        clearTimeout(resignConfirmTimeoutRef.current);
      }
    };
  }, []);

  const gameInfoSection = (
    <div className="backdrop-blur-sm rounded-xl p-3 mb-3" style={{background: 'rgba(255,255,255,0.12)'}}>
      <div className="flex justify-between text-sm">
        <span className="text-white opacity-80">Current Turn:</span>
        <span className="text-white font-semibold">{currentTurn === 'w' ? 'White' : 'Black'}</span>
      </div>
      <div className="flex justify-between text-sm mt-2">
        <span className="text-white opacity-80">Total Moves:</span>
        <span className="text-white font-semibold">{moveHistory.length}</span>
      </div>
    </div>
  );

  const moveHistorySection = (
    <div 
      className="backdrop-blur-sm rounded-xl p-3 overflow-y-auto transition-all" 
      style={{
        background: 'rgba(255,255,255,0.12)',
        maxHeight: isReviewMode ? '200px' : 'auto',
        flex: isReviewMode ? '0 0 200px' : '1'
      }}
    >
      {movePairs.length === 0 ? (
        <div className="text-center text-white opacity-60 py-8">
          No moves yet. Make your first move!
        </div>
      ) : (
        <div className={isReviewMode ? "space-y-0.5" : "space-y-1"}>
          {movePairs.map((pair) => (
            <div
              key={pair.moveNumber}
              className="flex items-center gap-2 rounded transition-all overflow-hidden"
            >
              <span className={`text-white opacity-60 font-semibold w-8 pl-2 ${isReviewMode ? 'text-xs' : ''}`}>
                {pair.moveNumber}.
              </span>
              <div 
                className={`flex-1 rounded transition-all ${isReviewMode ? 'p-1' : 'p-2'}`}
                style={{background: 'rgba(255,255,255,0.12)'}}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
              >
                <span className={`text-white font-mono ${isReviewMode ? 'text-xs' : ''}`}>
                  {pair.white}
                </span>
              </div>
              {pair.black && (
                <div 
                  className={`flex-1 rounded transition-all ${isReviewMode ? 'p-1' : 'p-2'}`}
                  style={{background: 'rgba(0,0,0,0.25)'}}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.35)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.25)'}
                >
                  <span className={`text-white font-mono ${isReviewMode ? 'text-xs' : ''}`}>
                    {pair.black}
                  </span>
                </div>
              )}
            </div>
          ))}
          <div ref={moveHistoryEndRef} />
        </div>
      )}
    </div>
  );

  const gameControlsSection = gameState === 'playing' ? (
    <div className={mobileLayout ? 'flex gap-2 mb-3' : 'flex gap-2 mt-3'}>
      <button
        onClick={() => {
          if (!confirmResign) {
            setConfirmResign(true);
            if (resignConfirmTimeoutRef.current) {
              clearTimeout(resignConfirmTimeoutRef.current);
            }
            resignConfirmTimeoutRef.current = setTimeout(() => {
              setConfirmResign(false);
              resignConfirmTimeoutRef.current = null;
            }, 3000); // Auto-reset after 3s
          } else {
            if (resignConfirmTimeoutRef.current) {
              clearTimeout(resignConfirmTimeoutRef.current);
              resignConfirmTimeoutRef.current = null;
            }
            setConfirmResign(false);
            onResign();
          }
        }}
        className={`flex-1 backdrop-blur-sm rounded-lg px-4 py-2.5 font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-white ${confirmResign ? 'bg-red-600/90 shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'bg-red-600/40 hover:bg-red-600/60'}`}
        onMouseLeave={() => {
          if (resignConfirmTimeoutRef.current) {
            clearTimeout(resignConfirmTimeoutRef.current);
            resignConfirmTimeoutRef.current = null;
          }
          setConfirmResign(false);
        }}
      >
        <span className="text-lg">{confirmResign ? '❓' : '🏳️'}</span>
        {confirmResign ? 'Are you sure?' : 'Resign'}
      </button>
      <button
        onClick={onOfferDraw}
        className="flex-1 backdrop-blur-sm rounded-lg px-4 py-2.5 font-semibold transition-all flex items-center justify-center gap-2 text-white"
        style={{background: 'rgba(255,255,255,0.12)'}}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
      >
        <span>🤝</span>
        Offer Draw
      </button>
    </div>
  ) : null;

  const reviewControlsSection = isReviewMode && showReviewControls ? (
    <ReviewModeControls
      reviewIndex={reviewIndex}
      reviewHistoryLength={reviewHistoryLength}
      isPlaying={isPlaying}
      onPrevious={onReviewPrevious}
      onNext={onReviewNext}
      onGoToStart={onReviewStart}
      onGoToEnd={onReviewEnd}
      onTogglePlay={onReviewTogglePlay}
      onExit={onExitReview}
      onGameAnalysis={onGameAnalysis}
    />
  ) : null;

  return (
    <div className="h-full flex flex-col">
      {mobileLayout ? (
        <>
          {gameControlsSection}
          {gameInfoSection}
          {moveHistorySection}
          {reviewControlsSection}
        </>
      ) : (
        <>
          {gameInfoSection}
          {moveHistorySection}
          {gameControlsSection}
        </>
      )}

      {/* Fix #13: Review Mode Controls — visible on mobile too */}
      {!mobileLayout && reviewControlsSection}
    </div>
  );
}
