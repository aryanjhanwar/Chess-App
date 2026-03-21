import {
  REVIEW_CTRL_BG,
  REVIEW_CTRL_BG_HOVER,
  REVIEW_CTRL_BG_DISABLED,
  createHoverBackgroundHandlers,
  getReviewNavButtonStyle
} from './start/styleHelpers';

export default function ReviewModeControls({ 
  reviewIndex, 
  reviewHistoryLength, 
  isPlaying,
  canGoBack,
  canGoForward,
  onPrevious, 
  onNext, 
  onGoToStart,
  onGoToEnd,
  onTogglePlay,
  onExit 
}) {
  // Fix #29: use values from useReviewMode hook if provided, else compute locally
  const canBack = canGoBack !== undefined ? canGoBack : reviewIndex > 0;
  const canFwd = canGoForward !== undefined ? canGoForward : reviewIndex < reviewHistoryLength - 1;

  const navButtons = [
    {
      key: 'start',
      title: 'Go to start',
      icon: '⏮',
      enabled: canBack,
      onClick: onGoToStart
    },
    {
      key: 'previous',
      title: 'Previous move',
      icon: '◀',
      enabled: canBack,
      onClick: onPrevious
    },
    {
      key: 'playPause',
      title: isPlaying ? 'Pause' : 'Auto-play',
      icon: isPlaying ? '⏸' : '▶',
      enabled: canFwd || isPlaying,
      onClick: onTogglePlay
    },
    {
      key: 'next',
      title: 'Next move',
      icon: '▶',
      enabled: canFwd,
      onClick: onNext
    },
    {
      key: 'end',
      title: 'Go to end',
      icon: '⏭',
      enabled: canFwd,
      onClick: onGoToEnd
    }
  ];

  return (
    <div className="mt-3 space-y-3">
      {/* Review Mode Info Banner */}
      <div 
        className="rounded-lg p-3 border"
        style={{
          background: 'rgba(0, 150, 200, 0.2)',
          borderColor: 'rgba(0, 150, 200, 0.4)'
        }}
      >
        <p className="text-white text-sm font-semibold mb-1">📖 Review Mode</p>
        <p className="text-white text-xs opacity-80">
          Move {reviewIndex} of {reviewHistoryLength - 1}
        </p>
      </div>

      {/* Navigation Controls - 5 Buttons */}
      <div className="flex gap-2 items-center justify-center">
        {navButtons.map((button) => (
          <button
            key={button.key}
            onClick={button.onClick}
            disabled={!button.enabled}
            className="flex items-center justify-center rounded-lg font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed text-white shadow-lg"
            style={getReviewNavButtonStyle(button.enabled)}
            {...createHoverBackgroundHandlers(REVIEW_CTRL_BG, REVIEW_CTRL_BG_HOVER, button.enabled)}
            title={button.title}
          >
            {button.icon}
          </button>
        ))}
      </div>

      {/* Exit Review Button */}
      <button
        onClick={onExit}
        className="w-full rounded-lg px-4 py-2.5 font-semibold transition-all text-white shadow-lg"
        style={{
          background: REVIEW_CTRL_BG_DISABLED
        }}
        {...createHoverBackgroundHandlers(REVIEW_CTRL_BG_DISABLED, 'rgba(100, 100, 100, 0.7)')}
      >
        Exit Review
      </button>
    </div>
  );
}
