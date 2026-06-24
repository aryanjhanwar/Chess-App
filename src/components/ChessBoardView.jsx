import { useEffect, useMemo, memo, useRef, useState } from 'react';
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

/**
 * Convert algebraic notation (e.g. 'e2') to a visual row/col grid coordinate.
 * Row 0 = top (rank 8), col 0 = left (file a).
 * @param {string} square - Two-character algebraic square (e.g. 'e2').
 * @returns {{ row: number, col: number }}
 */
function algebraicToGrid(square) {
  if (!square || square.length < 2) return null;
  const col = square.charCodeAt(0) - 97;
  const row = 8 - parseInt(square[1], 10);
  return { row, col };
}

/**
 * Render SVG best-move arrows overlaid on the board.
 * Each arrow is an object: { from: string, to: string, color: string }
 * where `from`/`to` are algebraic squares (e.g. 'e2', 'e4').
 */
function ArrowLayer({ arrows, boardSize, isFlipped }) {
  if (!arrows || arrows.length === 0) return null;

  const sqSize = boardSize / 8;
  const r = sqSize * 0.12; // arrowhead half-width

  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 25,
      }}
      viewBox={`0 0 ${boardSize} ${boardSize}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {arrows.map((arrow, i) => (
          <marker
            key={`marker-${i}`}
            id={`arrowhead-${i}`}
            markerWidth="4"
            markerHeight="4"
            refX="2"
            refY="2"
            orient="auto"
          >
            <polygon
              points="0 0, 4 2, 0 4"
              fill={arrow.color || 'rgba(0,150,255,0.75)'}
            />
          </marker>
        ))}
      </defs>
      {arrows.map((arrow, i) => {
        const fromGrid = algebraicToGrid(arrow.from);
        const toGrid   = algebraicToGrid(arrow.to);
        if (!fromGrid || !toGrid) return null;

        // Flip coordinates if board is flipped (Black on bottom)
        const fromRow = isFlipped ? 7 - fromGrid.row : fromGrid.row;
        const fromCol = isFlipped ? 7 - fromGrid.col : fromGrid.col;
        const toRow   = isFlipped ? 7 - toGrid.row   : toGrid.row;
        const toCol   = isFlipped ? 7 - toGrid.col   : toGrid.col;

        const x1 = fromCol * sqSize + sqSize * 0.5;
        const y1 = fromRow * sqSize + sqSize * 0.5;
        const x2 = toCol   * sqSize + sqSize * 0.5;
        const y2 = toRow   * sqSize + sqSize * 0.5;

        // Shorten line so it doesn't overlap the arrowhead
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const x2s = x2 - (dx / len) * sqSize * 0.32;
        const y2s = y2 - (dy / len) * sqSize * 0.32;

        return (
          <line
            key={`arrow-${i}`}
            x1={x1}
            y1={y1}
            x2={x2s}
            y2={y2s}
            stroke={arrow.color || 'rgba(0,150,255,0.75)'}
            strokeWidth={r * 1.7}
            strokeLinecap="round"
            markerEnd={`url(#arrowhead-${i})`}
            opacity="0.82"
          />
        );
      })}
    </svg>
  );
}


function usePieceMap(board) {
  const piecesRef = useRef(new Map());
  const prevBoardRef = useRef(null);
  
  const currentBoard = board;
  
  if (prevBoardRef.current !== currentBoard) {
     const oldBoard = prevBoardRef.current;
     if (!oldBoard) {
       currentBoard.forEach((row, r) => row.forEach((p, c) => {
         if (p) {
           const id = `${p}-${Math.random()}`;
           piecesRef.current.set(id, { id, type: p, row: r, col: c });
         }
       }));
     } else {
       const oldPieces = [];
       const newPieces = [];
       
       for (let r=0; r<8; r++) {
         for (let c=0; c<8; c++) {
           const oldP = oldBoard[r][c];
           const newP = currentBoard[r][c];
           if (oldP !== newP) {
             if (oldP) oldPieces.push({ type: oldP, row: r, col: c });
             if (newP) newPieces.push({ type: newP, row: r, col: c });
           }
         }
       }
       
       if (oldPieces.length > 4 || (oldPieces.length === 0 && newPieces.length > 0)) {
         piecesRef.current.clear();
         currentBoard.forEach((row, r) => row.forEach((p, c) => {
           if (p) {
             const id = `${p}-${Math.random()}`;
             piecesRef.current.set(id, { id, type: p, row: r, col: c });
           }
         }));
       } else {
         const matchedNewIndices = new Set();
         const movedPieces = [];
         
         oldPieces.forEach(oldP => {
           const matchIdx = newPieces.findIndex((newP, i) => !matchedNewIndices.has(i) && newP.type === oldP.type);
           if (matchIdx !== -1) {
             matchedNewIndices.add(matchIdx);
             movedPieces.push({ old: oldP, new: newPieces[matchIdx] });
           } else {
             movedPieces.push({ old: oldP, new: null });
           }
         });
         
         newPieces.forEach((newP, i) => {
           if (!matchedNewIndices.has(i)) {
             movedPieces.push({ old: null, new: newP });
           }
         });
         
         movedPieces.forEach(({ old: oldP, new: newP }) => {
           if (oldP && newP) {
             let foundId = null;
             for (const [id, p] of piecesRef.current.entries()) {
               if (p.row === oldP.row && p.col === oldP.col && p.type === oldP.type) {
                 foundId = id; break;
               }
             }
             if (foundId) {
               const p = piecesRef.current.get(foundId);
               p.row = newP.row;
               p.col = newP.col;
               p.type = newP.type;
             }
           } else if (oldP && !newP) {
             let foundId = null;
             for (const [id, p] of piecesRef.current.entries()) {
               if (p.row === oldP.row && p.col === oldP.col && p.type === oldP.type) {
                 foundId = id; break;
               }
             }
             if (foundId) piecesRef.current.delete(foundId);
           } else if (!oldP && newP) {
             const id = `${newP.type}-${Math.random()}`;
             piecesRef.current.set(id, { id, type: newP.type, row: newP.row, col: newP.col });
           }
         });
       }
     }
     prevBoardRef.current = currentBoard;
  }
  
  return Array.from(piecesRef.current.values());
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
      {showAnalysisMoveIcon && isLastMoveTo && moveClassification && (
        <img
          src={toPublicPath(`icons/${moveClassification}.png`)}
          alt="move-classification"
          className="absolute -top-1 -right-1 w-5 h-5 sm:w-[1.375rem] sm:h-[1.375rem] pointer-events-none z-[11] drop-shadow-md"
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
  /**
   * Analysis arrow overlays.
   * Array of { from: string, to: string, color?: string }
   * where from/to are algebraic squares (e.g. 'e2', 'e4').
   */
  arrows = [],
  /**
   * Whether the board is flipped (Black playing from bottom).
   * Required for correct arrow coordinate mapping.
   */
  isFlipped = false,
  /**
   * Optional CSS filter to apply to the whole board wrapper
   * (e.g. 'hue-rotate(45deg)' for analysis board theming).
   */
  boardStyle = {},
}) {
  const boardRef2 = useRef(null);
  const [boardPixelSize, setBoardPixelSize] = useState(400);

  // Fast Scrubbing Auto-Detect
  const lastBoardUpdateRef = useRef(Date.now());
  const isScrubbingRef = useRef(false);
  const scrubTimeoutRef = useRef(null);

  const now = Date.now();
  if (now - lastBoardUpdateRef.current < 180) {
    isScrubbingRef.current = true;
  }
  lastBoardUpdateRef.current = now;

  useEffect(() => {
    if (isScrubbingRef.current) {
      if (scrubTimeoutRef.current) clearTimeout(scrubTimeoutRef.current);
      scrubTimeoutRef.current = setTimeout(() => {
        isScrubbingRef.current = false;
      }, 200);
    }
  });

  const activePieceAnimation = pieceAnimation && !isScrubbingRef.current;

  const mappedPieces = usePieceMap(board);
  useEffect(() => {
    if (!boardRef2.current) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) {
        setBoardPixelSize(entry.contentRect.width);
      }
    });
    ro.observe(boardRef2.current);
    return () => ro.disconnect();
  }, []);

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
    <div className="flex flex-col relative w-full flex-1" style={boardStyle}>
      <div 
        ref={(el) => { boardRef.current = el; boardRef2.current = el; }}
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
                pieceAnimation={activePieceAnimation}
                compactMode={compactMode}
                activePieceImages={activePieceImages}
                onSquareClick={onSquareClick}
                onMouseDown={enableDrag ? handleMouseDown : NOOP}
                onMouseUp={enableDrag ? handleMouseUp : NOOP}
              />
            );
          })
        )}

        {/* PIECES LAYER */}
        {mappedPieces.map((p) => {
          const isBeingDragged = dragState.isDragging && dragState.fromRow === p.row && dragState.fromCol === p.col;
          const isSelected = selectedSquare?.row === p.row && selectedSquare?.col === p.col;
          return (
            <div
              key={p.id}
              className="absolute w-[12.5%] h-[12.5%] z-10 pointer-events-none flex items-center justify-center"
              style={{
                transform: `translate(${p.col * 100}%, ${p.row * 100}%)`,
                transition: activePieceAnimation && !isBeingDragged ? 'transform 0.16s ease-out' : 'none'
              }}
            >
               <img
                  src={activePieceImages[p.type] || defaultPieceImages[p.type]} 
                  alt=""
                  className={`w-[85%] h-[85%] object-contain select-none ${isBeingDragged ? 'opacity-30' : ''} ${isSelected && !isBeingDragged ? 'scale-110' : ''}`}
                  draggable="false"
                  style={{
                    transition: activePieceAnimation ? 'opacity 0.12s ease-out, transform 0.16s ease-out' : 'none'
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
            </div>
          );
        })}

        {/* SVG Arrow overlay for analysis best-move indicators */}
        <ArrowLayer arrows={arrows} boardSize={boardPixelSize} isFlipped={isFlipped} />
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
            alt=""
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
