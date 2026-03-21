
import { pieceImages, theme } from '../constants/theme';
import { groupCapturedPieces, calculateMaterialAdvantage } from '../utils/helpers';

export default function PlayerCard({
  color, // 'w' or 'b'
  playerName,
  capturedPieces = [],
  opponentCapturedPieces = [],
}) {
  // Defensive: always pass arrays
  const playerArray = Array.isArray(capturedPieces) ? capturedPieces : [];
  const opponentArray = Array.isArray(opponentCapturedPieces) ? opponentCapturedPieces : [];
  const materialAdvantage = calculateMaterialAdvantage(playerArray, opponentArray);
  const groupedCaptured = groupCapturedPieces(playerArray);
  const groupedEntries = Object.entries(groupedCaptured);

  return (
    <>
      <div className={`${theme.playerCardBorder} px-2 py-1 rounded-xl flex items-center gap-2 bg-transparent`}>
        <div className={`w-8 h-8 ${color === 'w' ? 'bg-cyan-800' : 'bg-gray-700'} rounded flex items-center justify-center overflow-hidden`}>
          <img 
            src="https://www.chess.com/bundles/web/images/user-image.svg" 
            alt="avatar" 
            className="w-full h-full" 
          />
        </div>
        <div className={`${theme.textPrimary} font-semibold text-m flex items-center`}>{playerName}</div>
        <div className="flex items-center gap-1 h-5 overflow-visible">
          {groupedEntries.map(([type, count]) => (
            <div key={type} className="relative w-5 h-5">
              <img
                src={pieceImages[(color === 'w' ? 'b' : 'w') + type]}
                alt={type}
                className="w-5 h-5 object-contain opacity-80"
                draggable="false"
              />
              {count >= 2 && (
                <span
                  className="absolute -bottom-0.5 -right-0.5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center"
                  style={{ width: '0.7rem', height: '0.7rem', fontSize: '0.5rem', lineHeight: '0.7rem' }}
                >
                  {count}
                </span>
              )}
            </div>
          ))}
          {materialAdvantage > 0 && (
            <span className="text-gray-300 text-xs font-semibold ml-1">+{materialAdvantage}</span>
          )}
        </div>
      </div>
    </>
  );
}
