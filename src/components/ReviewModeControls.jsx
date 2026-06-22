import { Icon } from '@iconify/react';

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
  onExit,
  onGameAnalysis,
}) {
  // Fix #29: use values from useReviewMode hook if provided, else compute locally
  const canBack = canGoBack !== undefined ? canGoBack : reviewIndex > 0;
  const canFwd = canGoForward !== undefined ? canGoForward : reviewIndex < reviewHistoryLength - 1;

  const navButtons = [
    {
      key: 'start',
      title: 'Go to start',
      icon: 'ri:skip-back-line',
      enabled: canBack,
      onClick: onGoToStart
    },
    {
      key: 'previous',
      title: 'Previous move',
      icon: 'ri:arrow-left-s-line',
      enabled: canBack,
      onClick: onPrevious
    },
    {
      key: 'playPause',
      title: isPlaying ? 'Pause' : 'Auto-play',
      icon: isPlaying ? 'ri:pause-line' : 'ri:play-fill',
      enabled: canFwd || isPlaying,
      onClick: onTogglePlay
    },
    {
      key: 'next',
      title: 'Next move',
      icon: 'ri:arrow-right-s-line',
      enabled: canFwd,
      onClick: onNext
    },
    {
      key: 'end',
      title: 'Go to end',
      icon: 'ri:skip-forward-line',
      enabled: canFwd,
      onClick: onGoToEnd
    }
  ];

  const toolbarButtonStyle = {
    padding: '0.4rem 0.55rem',
    color: '#ecfeff',
    borderRadius: '0.55rem',
    border: '1px solid transparent',
    transition: 'all 120ms ease',
    background: 'transparent'
  };

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

      <button
        onClick={onGameAnalysis}
        className="w-full rounded-lg px-4 py-2.5 font-semibold transition-all text-white shadow-lg"
        style={{
          background: 'rgba(34, 211, 238, 0.25)',
          border: '1px solid rgba(34, 211, 238, 0.55)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(34, 211, 238, 0.35)';
          e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.95)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(34, 211, 238, 0.25)';
          e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.55)';
        }}
      >
        Game Analysis
      </button>

      {/* Navigation Controls - 5 Buttons */}
      <div className="flex gap-2 items-center justify-center">
        {navButtons.map((button) => (
          <button
            key={button.key}
            onClick={button.onClick}
            disabled={!button.enabled}
            className="flex items-center justify-center font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed text-white shadow-lg"
            style={{
              ...toolbarButtonStyle,
              background: button.enabled ? 'rgba(8, 47, 73, 0.72)' : 'rgba(100, 100, 100, 0.5)'
            }}
            onMouseEnter={(e) => {
              if (!button.enabled) return;
              e.currentTarget.style.background = 'rgba(34, 211, 238, 0.18)';
              e.currentTarget.style.color = '#a5f3fc';
            }}
            onMouseLeave={(e) => {
              if (!button.enabled) return;
              e.currentTarget.style.background = 'rgba(8, 47, 73, 0.72)';
              e.currentTarget.style.color = '#ecfeff';
            }}
            title={button.title}
          >
            <Icon icon={button.icon} height={22} />
          </button>
        ))}
      </div>

      {/* Exit Review Button */}
      <button
        onClick={onExit}
        className="w-full rounded-lg px-4 py-2.5 font-semibold transition-all text-white shadow-lg"
        style={{
          background: 'rgba(100, 100, 100, 0.5)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(100, 100, 100, 0.7)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(100, 100, 100, 0.5)';
        }}
      >
        Exit Review
      </button>
    </div>
  );
}
