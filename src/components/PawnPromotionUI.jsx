import { pieceImages as defaultPieceImages } from '../constants/theme';

export default function PawnPromotionUI({ 
  promotionSquare, 
  onPromotion, 
  onCancel,
  activePieceImages = {}
}) {
  if (!promotionSquare) return null;

  const { row, col, color } = promotionSquare;

  // Horizontal offset to keep the radial menu within the board boundaries for edge columns
  let leftOffset = 0; // percentage shift
  if (col === 0) leftOffset = 4; // Shift right
  if (col === 7) leftOffset = -4; // Shift left

  // Angles for the semicircle options (curving downwards for row 0, upwards for row 7)
  const pieces = [
    { type: 'Q', angle: row === 0 ? 25 : -25 },
    { type: 'R', angle: row === 0 ? 68 : -68 },
    { type: 'B', angle: row === 0 ? 112 : -112 },
    { type: 'N', angle: row === 0 ? 155 : -155 },
  ];

  return (
    <>
      {/* Invisible overlay catches clicks outside the menu to cancel promotion */}
      <div 
        className="absolute inset-0 bg-transparent z-40" 
        onClick={onCancel} 
      />
      
      {/* Circular radial menu centered on the promotion square */}
      <div 
        className="absolute z-50 flex items-center justify-center rounded-full shadow-2xl transition-all duration-300"
        style={{
          left: `calc(${(col + 0.5) * 12.5}% + ${leftOffset}%)`,
          top: `${(row + 0.5) * 12.5}%`,
          transform: 'translate(-50%, -50%)',
          width: '140px',
          height: '140px',
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(8px)',
          border: '2px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Cancel button in the center (red cross) */}
        <button
          onClick={onCancel}
          className="absolute z-50 w-10 h-10 rounded-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}
          title="Cancel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 4 promotion piece options placed radially */}
        {pieces.map(({ type, angle }) => {
          const rad = (angle * Math.PI) / 180;
          const radius = 48; // radial distance in px
          const x = Math.round(radius * Math.cos(rad));
          const y = Math.round(radius * Math.sin(rad));
          const pieceCode = color + type;

          return (
            <button
              key={type}
              onClick={() => onPromotion(type)}
              className="absolute w-11 h-11 rounded-full bg-slate-800 hover:bg-amber-500 active:bg-amber-600 border border-slate-700 hover:border-amber-400 text-white flex items-center justify-center shadow-md transition-all duration-200 hover:scale-115 active:scale-90 cursor-pointer"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: 'translate(-50%, -50%)',
              }}
              title={`Promote to ${type === 'Q' ? 'Queen' : type === 'R' ? 'Rook' : type === 'B' ? 'Bishop' : 'Knight'}`}
            >
              <img 
                src={activePieceImages[pieceCode] || defaultPieceImages[pieceCode]}
                alt={type}
                className="w-[80%] h-[80%] object-contain pointer-events-none filter drop-shadow"
                draggable="false"
              />
            </button>
          );
        })}
      </div>
    </>
  );
}
