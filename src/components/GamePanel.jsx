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
  showReviewControls = true,
  mobileLayout = false,
  highlightResign = false
}) {
  // Group moves into pairs (white move, black move)
  const movePairs = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    movePairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: moveHistory[i],
      black: moveHistory[i + 1] || ''
    });
  }

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
        </div>
      )}
    </div>
  );

  const gameControlsSection = gameState === 'playing' ? (
    <div className={mobileLayout ? 'flex gap-2 mb-3' : 'flex gap-2 mt-3'}>
      <button
        onClick={onResign}
        className={`flex-1 backdrop-blur-sm rounded-lg px-4 py-2.5 font-semibold transition-all flex items-center justify-center gap-2 text-white ${highlightResign ? 'ring-2 ring-yellow-300 animate-pulse shadow-lg shadow-yellow-300/35' : ''}`}
        style={{background: highlightResign ? 'rgba(220,38,38,0.78)' : 'rgba(220,38,38,0.5)'}}
        onMouseEnter={(e) => {
          if (!highlightResign) e.currentTarget.style.background = 'rgba(220,38,38,0.7)';
        }}
        onMouseLeave={(e) => {
          if (!highlightResign) e.currentTarget.style.background = 'rgba(220,38,38,0.5)';
        }}
      >
        <span>🏳️</span>
        Resign
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
    />
  ) : null;

  return (
    <div className="h-full flex flex-col">
      {mobileLayout ? (
        <>
          {reviewControlsSection}
          {gameControlsSection}
          {gameInfoSection}
          {moveHistorySection}
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
