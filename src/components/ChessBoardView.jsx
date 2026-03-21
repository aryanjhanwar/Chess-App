import { useEffect, useMemo, memo } from 'react';
import { pieceImages, theme } from '../constants/theme';
import { useDragAndDrop } from '../hooks/useDragAndDrop';

// Memoized Square component - only re-renders when its props change
const Square = memo(({ 
  rowIndex, 
  colIndex, 
  piece, 
  bgColor,
  isSelected,
  isValidMove,
  isBeingDragged,
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
      className={`w-[calc(min(70px,(100vw-2rem)/8))] h-[calc(min(70px,(100vw-2rem)/8))] sm:w-[70px] sm:h-[70px] flex items-center justify-center cursor-pointer relative ${bgColor} ${isSelected ? 'ring-4 ring-yellow-400 ring-inset' : ''} hover:opacity-90`}
      style={{ transition: 'opacity 0.1s ease-out' }}
    >
      {piece && (
        <img 
          src={pieceImages[piece]} 
          alt={piece}
          className={`w-[85%] h-[85%] sm:w-14 sm:h-14 object-contain select-none ${isBeingDragged ? 'opacity-30' : ''} ${isSelected && !isBeingDragged ? 'scale-110' : ''}`}
          draggable="false"
          style={{ pointerEvents: 'none', transition: 'opacity 0.1s ease-out, transform 0.15s ease-out' }}
        />
      )}
      {isValidMove && !piece && (
        <div className="w-5 h-5 bg-green-600 rounded-full opacity-70 pointer-events-none"></div>
      )}
      {isValidMove && piece && (
        <div className="absolute inset-0 rounded-full border-[6px] border-red-500 pointer-events-none opacity-80"></div>
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
  onSquareClick,
  rankLabels,
  fileLabels,
  gameState,
  isReviewMode
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
  }, [handleMouseMove, handleMouseUpGlobal]);

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
    <div className="flex flex-col relative">
      <div 
        ref={boardRef}
        className="grid grid-cols-8 gap-0 shadow-2xl rounded-lg overflow-hidden relative"
        style={{ userSelect: 'none', WebkitUserSelect: 'none', willChange: 'contents' }}
      >
        {board.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const isDark = (rowIndex + colIndex) % 2 === 1;
            const isSelected = selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex;
            const isValidMove = isValidMoveSquare(rowIndex, colIndex);
            const isKingInCheck = kingInCheckPos?.row === rowIndex && kingInCheckPos?.col === colIndex;
            const isLastMove = isLastMoveSquare(rowIndex, colIndex);
            const isBeingDragged = dragState.isDragging && 
                                   dragState.fromRow === rowIndex && 
                                   dragState.fromCol === colIndex;
            
            // Determine background color
            let bgColor;
            if (isKingInCheck) {
              bgColor = 'bg-red-500 animate-pulse';
            } else if (isLastMove) {
              bgColor = isDark ? 'bg-[#7ba7bd]' : 'bg-[#bce4f0]';
            } else {
              bgColor = isDark ? 'bg-[#a8c1cf]' : 'bg-[#eaf2f6]';
            }
            
            return (
              <Square
                key={`${rowIndex}-${colIndex}`}
                rowIndex={rowIndex}
                colIndex={colIndex}
                piece={piece}
                bgColor={bgColor}
                isSelected={isSelected}
                isValidMove={isValidMove}
                isBeingDragged={isBeingDragged}
                onSquareClick={onSquareClick}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
              />
            );
          })
        )}
      </div>

      {/* Floating drag piece layer */}
      {dragState.isDragging && dragState.piece && (
        <div
          className="fixed pointer-events-none z-[9999]"
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
            src={pieceImages[dragState.piece]}
            alt={dragState.piece}
            className="w-14 h-14 object-contain select-none"
            draggable="false"
            style={{ margin: '8px', pointerEvents: 'none' }}
          />
        </div>
      )}
    </div>
  );
}
