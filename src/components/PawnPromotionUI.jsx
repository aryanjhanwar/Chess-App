import { pieceImages, theme } from '../constants/theme';

export default function PawnPromotionUI({ 
  promotionSquare, 
  onPromotion, 
  onCancel 
}) {
  if (!promotionSquare) return null;

  // Calculate square size (same as board squares)
  const squareSize = 'calc(min(70px, (100vw - 2rem) / 8))';
  
  // Position at the column of the promoted pawn
  const leftPosition = `calc(${promotionSquare.col} * ${squareSize})`;

  return (
    <>
      <div className="absolute inset-0 bg-black bg-opacity-30 z-40" onClick={onCancel} />
      <div 
        className="absolute z-50 flex flex-col bg-gray-200 rounded shadow-2xl overflow-hidden"
        style={{
          left: leftPosition,
          top: '0',
          height: '100%',
          width: squareSize
        }}
      >
        {['Q', 'N', 'R', 'B'].map(pieceType => (
          <button
            key={pieceType}
            onClick={() => onPromotion(pieceType)}
            className="bg-amber-100 hover:bg-yellow-300 active:bg-yellow-400 transition-all flex-1 flex items-center justify-center border-b-2 border-gray-400"
          >
            <img 
              src={pieceImages[promotionSquare.color + pieceType]}
              alt={pieceType}
              className="w-[85%] h-[85%] object-contain pointer-events-none"
              draggable="false"
            />
          </button>
        ))}
        <button
          onClick={onCancel}
          className="bg-gray-300 hover:bg-gray-400 active:bg-gray-500 transition-all flex-1 flex items-center justify-center"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </>
  );
}
