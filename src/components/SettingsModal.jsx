import { theme } from '../constants/theme';

export default function SettingsModal({
  onClose,
  whiteName,
  blackName,
  onWhiteNameChange,
  onBlackNameChange,
  onResetNames,
  canEditWhite = true,
  canEditBlack = true,
  showReset = true
}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9998] pointer-events-none px-4">
      <div 
        className="absolute inset-0 bg-black/50 pointer-events-auto"
        onClick={onClose}
      ></div>
      
      <div className={`${theme.sidebarCard} rounded-2xl p-6 sm:p-8 shadow-2xl w-full max-w-sm sm:max-w-96 pointer-events-auto relative z-10`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 ${theme.textSecondary} hover:text-gray-300 transition-colors`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="text-5xl mb-3">⚙️</div>
          <h2 className={`text-3xl font-bold ${theme.textPrimary}`}>
            Settings
          </h2>
        </div>

        {/* Settings Content */}
        <div className="flex flex-col gap-4">
          <div className="space-y-3">
            <div>
              <label className={`${theme.textSecondary} text-xs block mb-1`}>White Player Name</label>
              <input
                type="text"
                value={whiteName}
                onChange={(e) => onWhiteNameChange(e.target.value)}
                disabled={!canEditWhite}
                className="w-full rounded-lg px-3 py-2 bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="White"
                maxLength={24}
              />
              {!canEditWhite && <p className="text-[11px] text-white/60 mt-1">Locked: controlled by White player</p>}
            </div>
            <div>
              <label className={`${theme.textSecondary} text-xs block mb-1`}>Black Player Name</label>
              <input
                type="text"
                value={blackName}
                onChange={(e) => onBlackNameChange(e.target.value)}
                disabled={!canEditBlack}
                className="w-full rounded-lg px-3 py-2 bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Black"
                maxLength={24}
              />
              {!canEditBlack && <p className="text-[11px] text-white/60 mt-1">Locked: controlled by Black player</p>}
            </div>

            {showReset && (
              <button
                onClick={onResetNames}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-all"
              >
                Reset Names
              </button>
            )}
          </div>
        </div>

        {/* Close Button */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className={`w-full ${theme.primaryButton} text-white px-6 py-3 rounded-lg font-semibold transition-all`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
