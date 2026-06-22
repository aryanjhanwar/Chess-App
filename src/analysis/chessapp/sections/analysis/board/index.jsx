import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import tinycolor from 'tinycolor2';
import ChessBoardView from '../../../../../components/ChessBoardView.jsx';
import EvaluationBar from '@analysis/components/board/evaluationBar';
import { Color, MoveClassification } from '@analysis/types/enums';
import { boardAtom, boardOrientationAtom, currentPositionAtom, gameAtom, gameEvalAtom, showBestMoveArrowAtom, showPlayerMoveIconAtom } from '../states';
import { boardHueAtom, pieceSetAtom } from '@analysis/components/board/states';
import { toPublicPath } from '@analysis/lib/publicPath';
import { useChessActions } from '@analysis/hooks/useChessActions';

const PIECE_CODES = ['wP', 'wN', 'wB', 'wR', 'wQ', 'wK', 'bP', 'bN', 'bB', 'bR', 'bQ', 'bK'];
const BASE_BOARD_THEME = {
  light: '#eaf2f6',
  dark: '#a8c1cf',
  lastMoveLight: '#bce4f0',
  lastMoveDark: '#7ba7bd',
};

function getBoardThemeWithHue(hue) {
  if (!hue) return BASE_BOARD_THEME;
  return {
    light: tinycolor(BASE_BOARD_THEME.light).spin(hue).toHexString(),
    dark: tinycolor(BASE_BOARD_THEME.dark).spin(hue).toHexString(),
    lastMoveLight: tinycolor(BASE_BOARD_THEME.lastMoveLight).spin(hue).toHexString(),
    lastMoveDark: tinycolor(BASE_BOARD_THEME.lastMoveDark).spin(hue).toHexString(),
  };
}

function bestMoveArrowCoords(bestMove, isWhiteBottom) {
  if (typeof bestMove !== 'string' || bestMove.length < 4) return null;
  const from = algebraicToCoords(bestMove.slice(0, 2));
  const to = algebraicToCoords(bestMove.slice(2, 4));
  const fromDisplay = toDisplayCoords(from.row, from.col, isWhiteBottom);
  const toDisplay = toDisplayCoords(to.row, to.col, isWhiteBottom);
  return { from: fromDisplay, to: toDisplay };
}

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
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]);
  return { row: 8 - rank, col: file };
}

function toPieceCode(piece) {
  if (!piece) return null;
  const pieceType = piece.type.toUpperCase();
  return `${piece.color}${pieceType}`;
}

function flipBoard(board) {
  return board
    .slice()
    .reverse()
    .map((row) => row.slice().reverse());
}

function BitboardAnalysisBoard() {
  const analysisBoard = useAtomValue(boardAtom);
  const game = useAtomValue(gameAtom);
  const isWhiteBottom = useAtomValue(boardOrientationAtom);
  const currentPosition = useAtomValue(currentPositionAtom);
  const gameEval = useAtomValue(gameEvalAtom);
  const boardHue = useAtomValue(boardHueAtom);
  const pieceSet = useAtomValue(pieceSetAtom);
  const showBestMoveArrow = useAtomValue(showBestMoveArrowAtom);
  const showPlayerMoveIcon = useAtomValue(showPlayerMoveIconAtom);
  const { playMove: playBoardMove } = useChessActions(boardAtom);

  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [boardHeight, setBoardHeight] = useState(560);
  const [boardWidth, setBoardWidth] = useState(560);
  const boardContainerRef = useRef(null);

  useEffect(() => {
    const node = boardContainerRef.current;
    if (!node) return;
    const updateSize = () => {
      if (node.offsetHeight > 0 && node.offsetWidth > 0) {
        setBoardHeight(node.offsetHeight);
        setBoardWidth(node.offsetWidth);
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const boardHistoryLength = analysisBoard.history().length;

  useEffect(() => {
    setSelectedSquare(null);
    setValidMoves([]);
  }, [analysisBoard, boardHistoryLength]);

  const engineBoard = useMemo(() => {
    const rawBoard = analysisBoard.board();
    return rawBoard.map((row) => row.map((piece) => toPieceCode(piece)));
  }, [analysisBoard, boardHistoryLength]);

  const sideToMove = analysisBoard.turn();
  const isGameOver = analysisBoard.isCheckmate() || analysisBoard.isStalemate();

  const onSquareClick = useCallback(
    (displayRow, displayCol) => {
      if (isGameOver) return;

      const { row, col } = toEngineCoords(displayRow, displayCol, isWhiteBottom);
      const clickedSquare = coordsToAlgebraic(row, col);
      const piece = engineBoard[row]?.[col] || null;
      const isOwnPiece = !!piece && piece[0] === sideToMove;

      if (selectedSquare) {
        const fromSquare = coordsToAlgebraic(selectedSquare.row, selectedSquare.col);
        const candidateMoves = analysisBoard.moves({ square: fromSquare, verbose: true });
        const move = candidateMoves.find((m) => m.to === clickedSquare);

        if (move) {
          playBoardMove({
            from: move.from,
            to: move.to,
            promotion: move.promotion,
          });
          setSelectedSquare(null);
          setValidMoves([]);
          return;
        }
      }

      if (!isOwnPiece) {
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }

      const fromMoves = analysisBoard.moves({ square: clickedSquare, verbose: true });
      setSelectedSquare({ row, col });
      setValidMoves(
        fromMoves.map((m) => {
          const targetCoords = algebraicToCoords(m.to);
          const target = toDisplayCoords(targetCoords.row, targetCoords.col, isWhiteBottom);
          return { row: target.row, col: target.col };
        })
      );
    },
    [
      analysisBoard,
      engineBoard,
      isGameOver,
      isWhiteBottom,
      playBoardMove,
      selectedSquare,
      sideToMove,
    ]
  );

  const boardForRender = useMemo(
    () => (isWhiteBottom ? engineBoard : flipBoard(engineBoard)),
    [engineBoard, isWhiteBottom]
  );

  const selectedForRender = useMemo(() => {
    if (!selectedSquare) return null;
    return toDisplayCoords(selectedSquare.row, selectedSquare.col, isWhiteBottom);
  }, [selectedSquare, isWhiteBottom]);

  const kingInCheckPos = useMemo(() => {
    if (!analysisBoard.inCheck()) return null;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = engineBoard[row]?.[col];
        if (piece === `${sideToMove}K`) {
          return toDisplayCoords(row, col, isWhiteBottom);
        }
      }
    }
    return null;
  }, [analysisBoard, engineBoard, isWhiteBottom, sideToMove]);

  const lastMove = useMemo(() => {
    const history = analysisBoard.history({ verbose: true });
    const lastMoveInfo = history.at(-1);
    if (!lastMoveInfo) return null;
    const fromCoords = algebraicToCoords(lastMoveInfo.from);
    const toCoords = algebraicToCoords(lastMoveInfo.to);
    return {
      from: toDisplayCoords(fromCoords.row, fromCoords.col, isWhiteBottom),
      to: toDisplayCoords(toCoords.row, toCoords.col, isWhiteBottom),
      piece: lastMoveInfo.piece,
    };
  }, [analysisBoard, boardHistoryLength, isWhiteBottom]);

  const moveClassification = useMemo(() => {
    const instantClassification = gameEval?.positions?.[boardHistoryLength]?.moveClassification;
    if (instantClassification) return instantClassification;
    return currentPosition?.eval?.moveClassification;
  }, [boardHistoryLength, currentPosition?.eval?.moveClassification, gameEval]);

  const activePieceImages = useMemo(() => {
    return PIECE_CODES.reduce((acc, code) => {
      acc[code] = toPublicPath(`piece/${pieceSet}/${code}.svg`);
      return acc;
    }, {});
  }, [pieceSet]);

  const boardTheme = useMemo(() => getBoardThemeWithHue(boardHue), [boardHue]);

  const arrowCoordinates = useMemo(() => {
    if (!showBestMoveArrow) return null;
    if ([
      MoveClassification.Best,
      MoveClassification.Book,
      MoveClassification.Brilliant,
      MoveClassification.Great,
    ].includes(moveClassification)) {
      return null;
    }
    const bestMove = currentPosition?.lastEval?.lines?.[0]?.pv?.[0];
    return bestMoveArrowCoords(bestMove, isWhiteBottom);
  }, [showBestMoveArrow, moveClassification, currentPosition?.lastEval?.lines, isWhiteBottom]);

  const players = useMemo(() => {
    const headers = game.getHeaders();
    const whiteName = headers.White && headers.White !== '?' ? headers.White : 'White';
    const blackName = headers.Black && headers.Black !== '?' ? headers.Black : 'Black';
    const isLoaded = boardHistoryLength > 0 || (headers.White && headers.White !== '?') || (headers.Black && headers.Black !== '?');
    return {
      white: whiteName,
      black: blackName,
      isLoaded,
    };
  }, [boardHistoryLength, game]);

  const topPlayerName = isWhiteBottom ? players.black : players.white;
  const bottomPlayerName = isWhiteBottom ? players.white : players.black;
  const topDisplayName = players.isLoaded ? topPlayerName : (isWhiteBottom ? 'Black' : 'White');
  const bottomDisplayName = players.isLoaded ? bottomPlayerName : (isWhiteBottom ? 'White' : 'Black');

  const renderPlayerRow = (name, color) => {
    const initial = (name?.trim()?.[0] || '?').toUpperCase();
    return (
      <div className="flex items-center gap-2 text-cyan-50">
        <div className="w-7 h-7 rounded-full border border-cyan-200/60 bg-cyan-800/60 flex items-center justify-center text-xs font-semibold">
          {initial}
        </div>
        <div className="text-sm font-medium tracking-wide">{name}</div>
        <div className="text-xs text-cyan-200/80 uppercase">{color}</div>
      </div>
    );
  };

  return (
    <div className="mt-3">
      <div className="mb-2">
        {renderPlayerRow(topDisplayName, isWhiteBottom ? 'Black' : 'White')}
      </div>
      <div className="flex items-center gap-2">
        <EvaluationBar
          height={boardHeight}
          boardOrientation={isWhiteBottom ? Color.White : Color.Black}
          currentPositionAtom={currentPositionAtom}
        />
        <div ref={boardContainerRef} className="relative">
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
          />

          {arrowCoordinates && (
            <svg
              className="pointer-events-none absolute inset-0 z-20"
              width={boardWidth}
              height={boardHeight}
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
                stroke="rgba(34, 197, 94, 0.92)"
                strokeWidth={Math.max(4, boardWidth / 85)}
                strokeLinecap="round"
                markerEnd="url(#analysis-best-move-arrow)"
              />
            </svg>
          )}
        </div>
      </div>
      <div className="mt-2">
        {renderPlayerRow(bottomDisplayName, isWhiteBottom ? 'White' : 'Black')}
      </div>
    </div>
  );
}

export default BitboardAnalysisBoard;
