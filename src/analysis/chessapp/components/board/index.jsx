import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { atom, useAtomValue } from 'jotai';
import tinycolor from 'tinycolor2';
import ChessBoardView from '@/components/ChessBoardView';
import EvaluationBar from './evaluationBar';
import PlayerHeader from './playerHeader';
import { Color, MoveClassification } from '@analysis/types/enums';
import { pieceSetAtom } from './states';
import { useChessActions } from '@analysis/hooks/useChessActions';

import { buildPieceImages } from '@/constants/theme';
import { boardThemeAtom } from '@/state/themeState';
import { BOARD_THEME_MAP } from '@/constants/boardThemes';

function toDisplayCoords(row, col, isWhiteBottom) {
  if (isWhiteBottom) return { row, col };
  return { row: 7 - row, col: 7 - col };
}

function toEngineCoords(row, col, isWhiteBottom) {
  if (isWhiteBottom) return { row, col };
  return { row: 7 - row, col: 7 - col };
}

function coordsToAlgebraic(row, col) {
  const file = String.fromCharCode(97 + col);
  const rank = String(8 - row);
  return `${file}${rank}`;
}

function algebraicToCoords(square) {
  if (!square) return null;
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]);
  return { row: 8 - rank, col: file };
}

function toPieceCode(piece) {
  if (!piece) return null;
  const pieceType = piece.type === 'p' ? 'p' : piece.type.toUpperCase();
  return `${piece.color}${pieceType}`;
}

function flipBoard(board) {
  return board
    .slice()
    .reverse()
    .map((row) => row.slice().reverse());
}

export default function Board({
  id: boardId,
  canPlay,
  gameAtom,
  boardSize,
  whitePlayer,
  blackPlayer,
  boardOrientation = Color.White,
  currentPositionAtom,
  showBestMoveArrow = false,
  showPlayerMoveIconAtom,
  showEvaluationBar = false
}) {
  const game = useAtomValue(gameAtom);
  const currentPosition = useAtomValue(currentPositionAtom);
  const boardThemeKey = useAtomValue(boardThemeAtom);
  const pieceSet = useAtomValue(pieceSetAtom);
  const isWhiteBottom = boardOrientation === Color.White;
  const { playMove } = useChessActions(gameAtom);

  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [boardHeight, setBoardHeight] = useState(boardSize || 400);
  const [boardWidth, setBoardWidth] = useState(boardSize || 400);
  const [showPromotionUI, setShowPromotionUI] = useState(false);
  const [promotionSquare, setPromotionSquare] = useState(null);
  const [pendingPromotionMove, setPendingPromotionMove] = useState(null);
  const boardContainerRef = useRef(null);

  useEffect(() => {
    const node = boardContainerRef.current;
    if (!node) return;
    const updateSize = () => {
      if (node.offsetHeight > 0 && node.offsetWidth > 0) {
        setBoardHeight((prev) => Math.abs(prev - node.offsetHeight) > 10 ? node.offsetHeight : prev);
        setBoardWidth((prev) => Math.abs(prev - node.offsetWidth) > 10 ? node.offsetWidth : prev);
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, [boardSize]);

  const boardHistoryLength = game.history().length;

  useEffect(() => {
    setSelectedSquare(null);
    setValidMoves([]);
  }, [game, boardHistoryLength]);

  const engineBoard = useMemo(() => {
    const rawBoard = game.board();
    return rawBoard.map((row) => row.map((piece) => toPieceCode(piece)));
  }, [game, boardHistoryLength]);

  const boardForRender = useMemo(() => {
    return isWhiteBottom ? engineBoard : flipBoard(engineBoard);
  }, [engineBoard, isWhiteBottom]);

  const sideToMove = game.turn();
  const isGameOver = game.isGameOver();

  const isPiecePlayable = useCallback(
    ({ piece }) => {
      if (isGameOver || !canPlay) return false;
      if (canPlay === true || canPlay === piece[0]) return true;
      return false;
    },
    [canPlay, isGameOver]
  );

  const onSquareClick = useCallback(
    (displayRow, displayCol) => {
      if (isGameOver) return;

      const { row, col } = toEngineCoords(displayRow, displayCol, isWhiteBottom);
      const clickedSquare = coordsToAlgebraic(row, col);
      const piece = engineBoard[row]?.[col] || null;
      const isOwnPiece = !!piece && piece[0] === sideToMove && isPiecePlayable({ piece });

      if (selectedSquare) {
        const fromSquare = coordsToAlgebraic(selectedSquare.row, selectedSquare.col);
        const candidateMoves = game.moves({ square: fromSquare, verbose: true });
        const move = candidateMoves.find((m) => m.to === clickedSquare);

        if (move) {
          const isPromotion = move.flags.includes('p');
          if (isPromotion) {
            setPendingPromotionMove({ from: move.from, to: move.to });
            setPromotionSquare({
              row: displayRow,
              col: displayCol,
              color: sideToMove,
            });
            setShowPromotionUI(true);
            return;
          }

          playMove({
            from: move.from,
            to: move.to,
          });
          setSelectedSquare(null);
          setValidMoves([]);
          return;
        }
      }

      if (isOwnPiece) {
        setSelectedSquare({ row, col });
        const candidateMoves = game.moves({ square: clickedSquare, verbose: true });
        setValidMoves(
          candidateMoves.map((m) => {
            const sq = algebraicToCoords(m.to);
            const dispSq = toDisplayCoords(sq.row, sq.col, isWhiteBottom);
            return { to: dispSq };
          })
        );
      } else {
        setSelectedSquare(null);
        setValidMoves([]);
      }
    },
    [game, isGameOver, isWhiteBottom, engineBoard, sideToMove, selectedSquare, playMove, isPiecePlayable]
  );

  const selectedForRender = useMemo(() => {
    if (!selectedSquare) return null;
    return toDisplayCoords(selectedSquare.row, selectedSquare.col, isWhiteBottom);
  }, [selectedSquare, isWhiteBottom]);

  const lastMove = useMemo(() => {
    if (!currentPosition) return null;
    
    let moveObj = currentPosition.move;
    if (!moveObj && game.history().length > 0) {
      const h = game.history({ verbose: true });
      moveObj = h[h.length - 1];
    }
    if (!moveObj || !moveObj.from || !moveObj.to) return null;

    const fromSq = algebraicToCoords(moveObj.from);
    const toSq = algebraicToCoords(moveObj.to);
    return {
      from: toDisplayCoords(fromSq.row, fromSq.col, isWhiteBottom),
      to: toDisplayCoords(toSq.row, toSq.col, isWhiteBottom),
    };
  }, [currentPosition, game, isWhiteBottom]);

  const kingInCheckPos = useMemo(() => {
    if (!game.inCheck()) return null;
    let kPos = null;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = engineBoard[r][c];
        if (piece === `${sideToMove}K`) {
          kPos = { row: r, col: c };
          break;
        }
      }
    }
    if (!kPos) return null;
    return toDisplayCoords(kPos.row, kPos.col, isWhiteBottom);
  }, [game, engineBoard, sideToMove, isWhiteBottom]);

  const moveClassification = currentPosition?.eval?.moveClassification || null;

  const handlePromotion = useCallback(
    (promoType) => {
      if (!pendingPromotionMove) return;
      playMove({
        from: pendingPromotionMove.from,
        to: pendingPromotionMove.to,
        promotion: promoType,
      });
      setPendingPromotionMove(null);
      setShowPromotionUI(false);
      setSelectedSquare(null);
      setValidMoves([]);
    },
    [pendingPromotionMove, playMove]
  );

  const handleCancelPromotion = useCallback(() => {
    setPendingPromotionMove(null);
    setShowPromotionUI(false);
    setSelectedSquare(null);
    setValidMoves([]);
  }, []);

  const activePieceImages = useMemo(() => buildPieceImages(pieceSet), [pieceSet]);

  const boardTheme = useMemo(() => {
    return BOARD_THEME_MAP[boardThemeKey] || BOARD_THEME_MAP['classic-blue'];
  }, [boardThemeKey]);

  const arrowCoordinates = useMemo(() => {
    if (!showBestMoveArrow) return null;
    const bestMove = currentPosition?.lastEval?.bestMove;
    if (typeof bestMove !== 'string' || bestMove.length < 4) return null;
    
    if (moveClassification === MoveClassification.Best || 
        moveClassification === MoveClassification.Book || 
        moveClassification === MoveClassification.Brilliant || 
        moveClassification === MoveClassification.Great) {
      return null;
    }
        
    const from = algebraicToCoords(bestMove.slice(0, 2));
    const to = algebraicToCoords(bestMove.slice(2, 4));
    if (!from || !to) return null;
    const fromDisplay = toDisplayCoords(from.row, from.col, isWhiteBottom);
    const toDisplay = toDisplayCoords(to.row, to.col, isWhiteBottom);
    return { from: fromDisplay, to: toDisplay };
  }, [currentPosition, showBestMoveArrow, moveClassification, isWhiteBottom]);

  const fallbackAtom = useMemo(() => atom(false), []);
  const showPlayerMoveIcon = useAtomValue(showPlayerMoveIconAtom || fallbackAtom);

  return (
    <div className="flex w-full items-center justify-center">
      {showEvaluationBar && (
        <EvaluationBar
          height={boardHeight}
          boardOrientation={isWhiteBottom ? Color.White : Color.Black}
          currentPositionAtom={currentPositionAtom}
        />
      )}
      <div className="flex flex-col items-center flex-1 px-1">
        <PlayerHeader
          color={isWhiteBottom ? Color.Black : Color.White}
          gameAtom={gameAtom}
          player={isWhiteBottom ? blackPlayer : whitePlayer}
        />
        <div ref={boardContainerRef} className="relative w-full max-w-[800px] aspect-square my-1">
          <ChessBoardView
            board={boardForRender}
            selectedSquare={selectedForRender}
            validMoves={validMoves}
            kingInCheckPos={kingInCheckPos}
            lastMove={lastMove}
            moveClassification={moveClassification}
            showAnalysisMoveIcon={showPlayerMoveIcon}
            onSquareClick={onSquareClick}
            rankLabels={[]}
            fileLabels={[]}
            gameState={isGameOver ? 'game-over' : 'playing'}
            isReviewMode={false}
            enableDrag={true}
            pieceAnimation={true}
            dragAnimation={true}
            activePieceImages={activePieceImages}
            boardTheme={boardTheme}
            showPromotionUI={showPromotionUI}
            promotionSquare={promotionSquare}
            onPromotion={handlePromotion}
            onCancel={handleCancelPromotion}
          />

          {arrowCoordinates && (
            <svg
              className="pointer-events-none absolute inset-0 z-20"
              width="100%"
              height="100%"
              viewBox={`0 0 ${boardWidth} ${boardHeight}`}
            >
              <defs>
                <marker id="analysis-best-move-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 z" fill="rgba(34, 197, 94, 0.95)" />
                </marker>
              </defs>
              <line
                x1={(arrowCoordinates.from.col + 0.5) * (boardWidth / 8)}
                y1={(arrowCoordinates.from.row + 0.5) * (boardHeight / 8)}
                x2={(arrowCoordinates.to.col + 0.5) * (boardWidth / 8)}
                y2={(arrowCoordinates.to.row + 0.5) * (boardHeight / 8)}
                stroke="rgba(34, 197, 94, 0.75)"
                strokeWidth={Math.max(4, boardWidth * 0.02)}
                markerEnd="url(#analysis-best-move-arrow)"
                opacity={0.8}
              />
            </svg>
          )}
        </div>
        <PlayerHeader
          color={isWhiteBottom ? Color.White : Color.Black}
          gameAtom={gameAtom}
          player={isWhiteBottom ? whitePlayer : blackPlayer}
        />
      </div>
    </div>
  );
}
