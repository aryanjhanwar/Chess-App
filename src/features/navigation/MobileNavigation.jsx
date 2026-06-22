export default function MobileNavigation({
  handlePlaySelectFromNav,
  gameMode,
  handleRefreshBoardView,
  setShowAppSettings,
  setIsBoardFlipped,
  effectiveBoardFlipped,
}) {
  return (
    <div
      className="lg:hidden fixed bottom-0 left-0 right-0 backdrop-blur-md py-2.5 px-3 grid grid-cols-4 gap-1 items-center border-t border-white/20 z-50"
      style={{ background: 'rgba(8, 16, 26, 0.50)' }}
    >
      <button
        onClick={() => handlePlaySelectFromNav(gameMode)}
        className="flex flex-col items-center justify-center gap-1 text-white transition-all active:scale-95 rounded-lg py-1.5"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14.752 11.168l-4.197-2.432A1 1 0 009 9.602v4.796a1 1 0 001.555.832l4.197-2.432a1 1 0 000-1.73z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-xs font-semibold">Play</span>
      </button>

      <button
        onClick={handleRefreshBoardView}
        className="flex flex-col items-center justify-center gap-1 text-white transition-all active:scale-95 rounded-lg py-1.5"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m14.836 2A8.001 8.001 0 005.582 9m0 0H9m11 11v-5h-.581m0 0A8.003 8.003 0 016.164 15m13.255 0H15"
          />
        </svg>
        <span className="text-xs font-medium">Refresh</span>
      </button>

      <button
        onClick={() => setShowAppSettings(true)}
        className="flex flex-col items-center justify-center gap-1 text-white transition-all active:scale-95 rounded-lg py-1.5"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span className="text-xs font-medium">Settings</span>
      </button>

      <button
        onClick={() => setIsBoardFlipped(!effectiveBoardFlipped)}
        className="flex flex-col items-center justify-center gap-1 text-white transition-all active:scale-95 rounded-lg py-1.5"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
        <span className="text-xs font-medium">Flip</span>
      </button>
    </div>
  );
}