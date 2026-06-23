import MobileStartGamePanel from '../../components/MobileStartGamePanel';
import GamePanel from '../../components/GamePanel';

export default function MobileGameArea({
  showMobileStartPanel,

  selectedTimeControl,
  onSelectTimeControl,

  gameMode,
  onSelectGameMode,

  computerDifficulty,
  onComputerDifficultyChange,

  onStartGame,
  canStartGame,

  gameStarted,

  moveHistory,
  currentTurn,

  onResign,
  onOfferDraw,

  gameState,

  highlightResign,

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

  canUseInGameActions,
}) {
  return (
    <>
      {showMobileStartPanel && (
        <MobileStartGamePanel
          selectedTimeControl={selectedTimeControl}
          onSelectTimeControl={onSelectTimeControl}
          gameMode={gameMode}
          onSelectGameMode={onSelectGameMode}
          computerDifficulty={computerDifficulty}
          onComputerDifficultyChange={onComputerDifficultyChange}
          onStartGame={onStartGame}
          canStartGame={canStartGame}
        />
      )}

      {gameStarted && (
        <div className="lg:hidden w-full max-w-[min(560px,100vw)] mt-4">
          <GamePanel
            moveHistory={moveHistory}
            currentTurn={currentTurn}
            onResign={onResign}
            onOfferDraw={onOfferDraw}
            gameState={gameState}
            mobileLayout={true}
            highlightResign={highlightResign}
            isReviewMode={isReviewMode}
            reviewIndex={reviewIndex}
            reviewHistoryLength={reviewHistoryLength}
            isPlaying={isPlaying}
            onReviewPrevious={onReviewPrevious}
            onReviewNext={onReviewNext}
            onReviewStart={onReviewStart}
            onReviewEnd={onReviewEnd}
            onReviewTogglePlay={onReviewTogglePlay}
            onExitReview={onExitReview}
            onGameAnalysis={onGameAnalysis}
            canUseInGameActions={canUseInGameActions}
          />
        </div>
      )}
    </>
  );
}