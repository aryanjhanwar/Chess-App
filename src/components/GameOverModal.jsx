import { theme } from '../constants/theme';

export default function GameOverModal({ 
  gameState, 
  currentTurn, 
  onNewGame, 
  onRematch,
  onReview,
  onClose 
}) {
  const getGameOverContent = () => {
    switch (gameState) {
      case 'checkmate':
        return {
          emoji: '🏆',
          title: currentTurn === 'w' ? 'You Lost!' : 'You Won!',
          subtitle: 'by checkmate'
        };
      case 'stalemate':
        return {
          emoji: '🤝',
          title: 'Draw!',
          subtitle: 'by stalemate'
        };
      case 'timeout':
        return {
          emoji: '⏰',
          title: currentTurn === 'w' ? 'Black Wins!' : 'White Wins!',
          subtitle: 'on time'
        };
      case 'resigned':
        return {
          emoji: '🏳️',
          title: currentTurn === 'w' ? 'Black Wins!' : 'White Wins!',
          subtitle: 'by resignation'
        };
      case 'draw':
        return {
          emoji: '🤝',
          title: 'Draw!',
          subtitle: 'by agreement'
        };
      case 'abandoned':
        return {
          emoji: '📡',
          title: 'Game Abandoned',
          subtitle: 'connection lost'
        };
      default:
        return null;
    }
  };

  const content = getGameOverContent();
  if (!content) return null;

  return (
    <div className="fixed lg:absolute inset-0 flex items-center justify-center pointer-events-none px-2 sm:px-4 z-50">
      <div className={`${theme.sidebarCard} rounded-2xl p-4 sm:p-8 shadow-2xl w-[min(92vw,360px)] sm:w-full sm:max-w-96 pointer-events-auto relative`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-2 right-2 sm:top-4 sm:right-4 ${theme.textSecondary} hover:text-gray-300 transition-colors`}
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="flex flex-col items-center">
          <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">{content.emoji}</div>
          <h2 className={`text-2xl sm:text-4xl font-bold ${theme.textPrimary} mb-2 text-center`}>
            {content.title}
          </h2>
          <p className={`${theme.textSecondary} text-sm sm:text-base mb-4 sm:mb-6`}>
            {content.subtitle}
          </p>

          {/* Buttons */}
          <div className="flex flex-col gap-3 w-full mt-2">
            <button
              onClick={onReview}
              className={`w-full ${theme.secondaryButton} text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all text-sm sm:text-base`}
            >
              Review
            </button>
            <div className="flex gap-3">
              <button
                onClick={onNewGame}
                className={`flex-1 ${theme.secondaryButton} text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all text-sm sm:text-base`}
              >
                New Game
              </button>
              <button
                onClick={onRematch || onNewGame}
                className={`flex-1 ${theme.secondaryButton} text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all text-sm sm:text-base`}
              >
                Rematch
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
