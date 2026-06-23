import { useEffect, useMemo, memo } from 'react';
import { pieceImages as defaultPieceImages } from '../constants/theme';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { toPublicPath } from '../utils/assetPath';
import PawnPromotionUI from './PawnPromotionUI';

function getPngFallbackFromSvg(path) {
  if (typeof path !== 'string') return '';
  const svgMatch = path.match(/\/(w|b)([KQRBNP])\.svg$/i);
  if (!svgMatch) return '';
  const color = svgMatch[1].toLowerCase();
  const piece = svgMatch[2].toLowerCase();
  return path.replace(/\/(w|b)([KQRBNP])\.svg$/i, `/${color}${piece}.png`);
}

function getNextPieceFallback(path, attempt) {
  if (typeof path !== 'string') return '';
  const match = path.match(/\/(w|b)([KQRBNPkpqrbn])\.(svg|png|webp|jpg|jpeg)$/i);
  if (!match) return '';
  const color = match[1].toLowerCase();
  const piece = String(match[2]).toUpperCase();
  const upperCode = `${color}${piece}`;
  const lowerCode = `${color}${piece.toLowerCase()}`;
  const candidates = [
    `${upperCode}.svg`, `${upperCode}.png`, `${upperCode}.webp`,
    `${lowerCode}.svg`, `${lowerCode}.png`, `${lowerCode}.webp`,
    `${upperCode}.jpg`, `${lowerCode}.jpg`, `${upperCode}.jpeg`, `${lowerCode}.jpeg`,
  ];
  const currentTry = Number.isFinite(attempt) ? attempt : 0;
  if (currentTry >= candidates.length - 1) return '';
  const nextFile = candidates[currentTry + 1];
  return path.replace(/\/(w|b)([KQRBNPkpqrbn])\.(svg|png|webp|jpg|jpeg)$/i, `/${nextFile}`);
}

function hexToRgba(hex, alpha) {
  if (!hex || typeof hex !== 'string') return `rgba(0, 0, 0, ${alpha})`;
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map((char) => char + char).join('')
    : clean;
  const parsed = Number.parseInt(full, 16);
  if (Number.isNaN(parsed)) return `rgba(0, 0, 0, ${alpha})`;
  const r = (parsed >> 16) & 255;
  const g = (parsed >> 8) & 255;
  const b = parsed & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const NOOP = () => {};

// Memoized Square component - only re-renders when its props change
const Square = memo(({ 
  rowIndex, 
  colIndex, 
  piece, 
  bgStyle,
  showCoordinates,
  rankLabel,
  fileLabel,
  isSelected,
  isValidMove,
  isLastMoveTo,
  moveClassification,
  showAnalysisMoveIcon,
  isBeingDragged,
  pieceAnimation,
  compactMode,
  activePieceImages,
  onSquareClick,
  onMouseDown,
  onMouseUp
}) => {
  return (
    <div
      data-row={rowIndex}
      data-col={colIndex}
      onClick={() => onSquareClick(rowIndex, colIndex)}
      onMouseDown={(e) => onMouseDown(e, rowIndex, colIndex, piece)}
      onMouseUp={(e) => onMouseUp(e, rowIndex, colIndex)}
      onTouchStart={(e) => onMouseDown(e, rowIndex, colIndex, piece)}
      onTouchEnd={(e) => onMouseUp(e, rowIndex, colIndex)}
      className={`w-full h-full flex items-center justify-center cursor-pointer relative`}
      style={{ ...bgStyle }}
    >
      {piece && (
        <img 
          src={activePieceImages[piece] || defaultPieceImages[piece]} 
          alt={piece}
          className={`absolute inset-[7.5%] w-[85%] h-[85%] z-10 object-contain select-none ${isBeingDragged ? 'opacity-30' : ''} ${isSelected && !isBeingDragged ? 'scale-110' : ''}`}
          draggable="false"
          style={{
            pointerEvents: 'none',
            transition: pieceAnimation
              ? 'opacity 0.12s ease-out, transform 0.16s ease-out'
              : 'none'
          }}
          onError={(event) => {
            const element = event.currentTarget;
            const currentTry = Number(element.dataset.fallbackTry || 0);
            const fallback = currentTry === 0
              ? getPngFallbackFromSvg(element.src) || getNextPieceFallback(element.src, currentTry)
              : getNextPieceFallback(element.src, currentTry);
            if (!fallback) return;
            element.dataset.fallbackTry = String(currentTry + 1);
            element.src = fallback;
          }}
        />
      )}
      {showAnalysisMoveIcon && isLastMoveTo && moveClassification && (
        <img
          src={toPublicPath(`icons/${moveClassification}.png`)}
          alt="move-classification"
          className="absolute top-0.5 right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 pointer-events-none z-10"
          draggable="false"
        />
      )}
      {isValidMove && !piece && (
        <div className="w-5 h-5 bg-green-600 rounded-full opacity-70 pointer-events-none z-20"></div>
      )}
      {isValidMove && piece && (
        <div className="absolute inset-0 rounded-full border-[6px] border-red-500 pointer-events-none opacity-80 z-20"></div>
      )}
      {showCoordinates && colIndex === 0 && (
        <span className="absolute left-1.5 top-1 text-[10px] font-semibold text-black/45 pointer-events-none z-20">
          {rankLabel}
        </span>
      )}
      {showCoordinates && rowIndex === 7 && (
        <span className="absolute right-1.5 bottom-1 text-[10px] font-semibold text-black/45 pointer-events-none uppercase z-20">
          {fileLabel}
        </span>
      )}
      {isSelected && (
        <div className="absolute inset-0 ring-4 ring-yellow-400 ring-inset pointer-events-none z-20"></div>
      )}
    </div>
  );
});

Square.displayName = 'Square';

export default function ChessBoardView({ 
  board, 
  selectedSquare, 
  validMoves, 
  kingInCheckPos,
  lastMove,
  moveClassification,
  onSquareClick,
  rankLabels,
  fileLabels,
  gameState,
  isReviewMode,
  enableDrag = true,
  activePieceImages = defaultPieceImages,
  boardTheme = {
    light: '#eaf2f6',
    dark: '#a8c1cf',
    lastMoveLight: '#bce4f0',
    lastMoveDark: '#7ba7bd',
  },
  showCoordinates = true,
  showLegalMoves = true,
  highlightLastMove = true,
  pieceAnimation = true,
  dragAnimation = true,
  compactMode = false,
  showAnalysisMoveIcon = true,
  showPromotionUI,
  promotionSquare,
  onPromotion,
  onCancel,
}) {
  const {
    dragState,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseUpGlobal,
    boardRef
  } = useDragAndDrop({
    onSquareClick,
    validMoves,
    gameState,
    isReviewMode
  });

  // Add global mouse and touch event listeners
  useEffect(() => {
    if (!enableDrag) return;

    const handleGlobalMouseMove = (e) => handleMouseMove(e);
    const handleGlobalMouseUp = (e) => handleMouseUpGlobal(e);
    const handleGlobalTouchMove = (e) => handleMouseMove(e);
    const handleGlobalTouchEnd = (e) => handleMouseUpGlobal(e);

    window.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
    window.addEventListener('mouseup', handleGlobalMouseUp, { passive: true });
    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    window.addEventListener('touchend', handleGlobalTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [enableDrag, handleMouseMove, handleMouseUpGlobal]);

  // Memoize valid moves Set for O(1) lookup
  const validMoveSet = useMemo(() => {
    const set = new Set();
    validMoves.forEach(move => set.add(`${move.row}-${move.col}`));
    return set;
  }, [validMoves]);

  // Memoize last move Set
  const lastMoveSet = useMemo(() => {
    const set = new Set();
    if (lastMove?.from) set.add(`${lastMove.from.row}-${lastMove.from.col}`);
    if (lastMove?.to) set.add(`${lastMove.to.row}-${lastMove.to.col}`);
    return set;
  }, [lastMove]);

  const isValidMoveSquare = (row, col) => validMoveSet.has(`${row}-${col}`);
  const isLastMoveSquare = (row, col) => lastMoveSet.has(`${row}-${col}`);

  return (
    <div className="flex flex-col relative w-full flex-1">
      <div 
        ref={boardRef}
        className="w-full aspect-square grid grid-cols-8 grid-rows-8 gap-0 shadow-2xl rounded-lg overflow-hidden relative"
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          willChange: 'contents',
          backgroundImage: boardTheme.boardImage ? `url('${boardTheme.boardImage}')` : 'none',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
        {board.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const isDark = (rowIndex + colIndex) % 2 === 1;
            const isSelected = selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex;
            const isValidMove = isValidMoveSquare(rowIndex, colIndex);
            const isKingInCheck = kingInCheckPos?.row === rowIndex && kingInCheckPos?.col === colIndex;
            const isLastMove = isLastMoveSquare(rowIndex, colIndex);
            const isLastMoveTo = lastMove?.to?.row === rowIndex && lastMove?.to?.col === colIndex;
            const isBeingDragged = dragState.isDragging && 
                                   dragState.fromRow === rowIndex && 
                                   dragState.fromCol === colIndex;
            
            // Determine background color
            let bgColor;
            if (isKingInCheck) {
              bgColor = '#ef4444';
            } else if (highlightLastMove && isLastMove) {
              bgColor = isDark ? boardTheme.lastMoveDark : boardTheme.lastMoveLight;
            } else {
              bgColor = isDark ? boardTheme.dark : boardTheme.light;
            }

            const bgStyle = {
              backgroundColor: boardTheme.boardImage ? hexToRgba(bgColor, 0.72) : bgColor,
              animation: isKingInCheck ? 'pulse 1.2s infinite' : 'none',
            };
            
            return (
              <Square
                key={`${rowIndex}-${colIndex}`}
                rowIndex={rowIndex}
                colIndex={colIndex}
                piece={piece}
                bgStyle={bgStyle}
                showCoordinates={showCoordinates}
                rankLabel={rankLabels?.[rowIndex]}
                fileLabel={fileLabels?.[colIndex]}
                isSelected={isSelected}
                isValidMove={showLegalMoves && isValidMove}
                isLastMoveTo={isLastMoveTo}
                moveClassification={moveClassification}
                showAnalysisMoveIcon={showAnalysisMoveIcon}
                isBeingDragged={isBeingDragged}
                pieceAnimation={pieceAnimation}
                compactMode={compactMode}
                activePieceImages={activePieceImages}
                onSquareClick={onSquareClick}
                onMouseDown={enableDrag ? handleMouseDown : NOOP}
                onMouseUp={enableDrag ? handleMouseUp : NOOP}
              />
            );
          })
        )}
      </div>

      {/* Floating drag piece layer */}
      {enableDrag && dragState.isDragging && dragState.piece && (
        <div
          className="fixed pointer-events-none z-9999"
          style={{
            left: dragState.currentX - 35,
            top: dragState.currentY - 35,
            width: '70px',
            height: '70px',
            transition: 'none',
            willChange: 'transform'
          }}
        >
          <img
            src={activePieceImages[dragState.piece] || defaultPieceImages[dragState.piece]}
            alt={dragState.piece}
            className="w-14 h-14 object-contain select-none"
            draggable="false"
            style={{ margin: '8px', pointerEvents: 'none', transition: dragAnimation ? 'transform 0.08s linear' : 'none' }}
            onError={(event) => {
              const element = event.currentTarget;
              const currentTry = Number(element.dataset.fallbackTry || 0);
              const fallback = currentTry === 0
                ? getPngFallbackFromSvg(element.src) || getNextPieceFallback(element.src, currentTry)
                : getNextPieceFallback(element.src, currentTry);
              if (!fallback) return;
              element.dataset.fallbackTry = String(currentTry + 1);
              element.src = fallback;
            }}
          />
        </div>
      )}

      {showPromotionUI && (
        <PawnPromotionUI
          promotionSquare={promotionSquare}
          onPromotion={onPromotion}
          onCancel={onCancel}
          activePieceImages={activePieceImages}
        />
      )}
    </div>
  );
}
