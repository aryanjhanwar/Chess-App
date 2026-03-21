import { theme } from '../constants/theme';

export default function DrawOfferModal({ currentTurn, onAccept, onDecline }) {
  const offeringPlayer = currentTurn === 'w' ? 'White' : 'Black';
  const respondingPlayer = currentTurn === 'w' ? 'Black' : 'White';

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50 px-4">
      <div className={`${theme.sidebarCard} rounded-2xl p-6 sm:p-8 shadow-2xl w-full max-w-sm sm:max-w-96 relative animate-fadeIn`}>
        {/* Icon and Title */}
        <div className="flex flex-col items-center mb-6">
          <div className="text-6xl mb-4">🤝</div>
          <h2 className={`text-3xl font-bold ${theme.textPrimary} mb-2 text-center`}>
            Draw Offer
          </h2>
          <p className={`${theme.textSecondary} text-center text-base`}>
            {offeringPlayer} offers a draw
          </p>
          <p className={`${theme.textSecondary} text-center text-sm mt-2 opacity-70`}>
            {respondingPlayer}, do you accept?
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onDecline}
            className="flex-1 backdrop-blur-sm rounded-lg px-6 py-4 font-bold transition-all text-white text-lg"
            style={{background: 'rgba(220,38,38,0.5)'}}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220,38,38,0.7)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(220,38,38,0.5)'}
          >
            ❌ Decline
          </button>
          <button
            onClick={onAccept}
            className="flex-1 backdrop-blur-sm rounded-lg px-6 py-4 font-bold transition-all text-white text-lg"
            style={{background: 'rgba(34,197,94,0.6)'}}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(34,197,94,0.8)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(34,197,94,0.6)'}
          >
            ✅ Accept
          </button>
        </div>
      </div>
    </div>
  );
}
