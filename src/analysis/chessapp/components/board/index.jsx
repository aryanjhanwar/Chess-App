import { jsx, jsxs } from "react/jsx-runtime";
import { Box, Grid } from "@mui/material";
import { Chessboard } from "react-chessboard";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { useChessActions } from "@analysis/hooks/useChessActions";
import { useCallback, useEffect, useMemo, useState } from "react";
import PawnPromotionUI from "@/components/PawnPromotionUI";
import { Color, MoveClassification } from "@analysis/types/enums";
import { getSquareRenderer } from "./squareRenderer";
import EvaluationBar from "./evaluationBar";
import { CLASSIFICATION_COLORS } from "@analysis/constants";
import PlayerHeader from "./playerHeader";
import { boardHueAtom, pieceSetAtom } from "./states";
import tinycolor from "tinycolor2";
function Board({
  id: boardId,
  canPlay,
  gameAtom,
  boardSize,
  whitePlayer,
  blackPlayer,
  boardOrientation = Color.White,
  currentPositionAtom = atom({}),
  showBestMoveArrow = false,
  showPlayerMoveIconAtom,
  showEvaluationBar = false
}) {
  const [boardPixelHeight, setBoardPixelHeight] = useState(boardSize || 400);
  const setBoardContainerRef = useCallback((node) => {
    if (!node) return;
    const measured = node.offsetHeight || boardSize || 400;
    setBoardPixelHeight((prev) => prev === measured ? prev : measured);
  }, [boardSize]);
  const game = useAtomValue(gameAtom);
  const { playMove } = useChessActions(gameAtom);
  const clickedSquaresAtom = useMemo(() => atom([]), []);
  const setClickedSquares = useSetAtom(clickedSquaresAtom);
  const playableSquaresAtom = useMemo(() => atom([]), []);
  const setPlayableSquares = useSetAtom(playableSquaresAtom);
  const position = useAtomValue(currentPositionAtom);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [moveClickFrom, setMoveClickFrom] = useState(null);
  const [moveClickTo, setMoveClickTo] = useState(null);
  const pieceSet = useAtomValue(pieceSetAtom);
  const boardHue = useAtomValue(boardHueAtom);
  const gameFen = game.fen();

  const getVisualCoords = useCallback((square) => {
    if (!square) return null;
    const col = square.charCodeAt(0) - 97;
    const row = 8 - parseInt(square[1], 10);
    const isFlipped = boardOrientation === Color.Black;
    return {
      row: isFlipped ? 7 - row : row,
      col: isFlipped ? 7 - col : col
    };
  }, [boardOrientation]);

  const promotionPieceImages = useMemo(() => {
    const codes = ['wQ', 'wR', 'wB', 'wN', 'bQ', 'bR', 'bB', 'bN'];
    return codes.reduce((acc, code) => {
      acc[code] = `/piece/${pieceSet}/${code}.svg`;
      return acc;
    }, {});
  }, [pieceSet]);

  const visualPromotionSquare = useMemo(() => {
    if (!showPromotionDialog || !moveClickTo) return null;
    const coords = getVisualCoords(moveClickTo);
    if (!coords) return null;
    const color = moveClickTo[1] === "8" ? "w" : "b";
    return { ...coords, color };
  }, [showPromotionDialog, moveClickTo, getVisualCoords]);
  useEffect(() => {
    setClickedSquares([]);
  }, [gameFen, setClickedSquares]);
  const isPiecePlayable = useCallback(
    ({ piece }) => {
      if (game.isGameOver() || !canPlay) return false;
      if (canPlay === true || canPlay === piece[0]) return true;
      return false;
    },
    [canPlay, game]
  );
  const onPieceDrop = useCallback(
    (source, target, piece) => {
      if (!isPiecePlayable({ piece })) return false;

      // Check for pawn promotion move during drag-and-drop
      const isPawn = piece[1]?.toLowerCase() === "p";
      const isPromotionRank = (piece[0] === "w" && target[1] === "8") || (piece[0] === "b" && target[1] === "1");

      if (isPawn && isPromotionRank) {
        const moves = game.moves({ square: source, verbose: true });
        const hasValidPromo = moves.some(m => m.to === target && m.flags.includes("p"));
        if (hasValidPromo) {
          setMoveClickFrom(source);
          setMoveClickTo(target);
          setShowPromotionDialog(true);
          return false; // Return false to prevent react-chessboard from completing immediately
        }
      }

      const result = playMove({
        from: source,
        to: target,
        promotion: piece[1]?.toLowerCase() ?? "q"
      });
      return !!result;
    },
    [isPiecePlayable, playMove, game, setMoveClickFrom, setMoveClickTo, setShowPromotionDialog]
  );
  const resetMoveClick = useCallback(
    (square) => {
      setMoveClickFrom(square ?? null);
      setMoveClickTo(null);
      setShowPromotionDialog(false);
      if (square) {
        const moves = game.moves({ square, verbose: true });
        setPlayableSquares(moves.map((m) => m.to));
      } else {
        setPlayableSquares([]);
      }
    },
    [setMoveClickFrom, setMoveClickTo, setPlayableSquares, game]
  );
  const handleSquareLeftClick = useCallback(
    (square, piece) => {
      setClickedSquares([]);
      if (!moveClickFrom) {
        if (piece && !isPiecePlayable({ piece })) return;
        resetMoveClick(square);
        return;
      }
      const validMoves = game.moves({ square: moveClickFrom, verbose: true });
      const move = validMoves.find((m) => m.to === square);
      if (!move) {
        resetMoveClick(square);
        return;
      }
      setMoveClickTo(square);
      if (move.piece === "p" && (move.color === "w" && square[1] === "8" || move.color === "b" && square[1] === "1")) {
        setShowPromotionDialog(true);
        return;
      }
      const result = playMove({
        from: moveClickFrom,
        to: square
      });
      resetMoveClick(result ? void 0 : square);
    },
    [
      game,
      isPiecePlayable,
      moveClickFrom,
      playMove,
      resetMoveClick,
      setClickedSquares
    ]
  );
  const handleSquareRightClick = useCallback(
    (square) => {
      setClickedSquares(
        (prev) => prev.includes(square) ? prev.filter((s) => s !== square) : [...prev, square]
      );
    },
    [setClickedSquares]
  );
  const handlePieceDragBegin = useCallback(
    (_, square) => {
      resetMoveClick(square);
    },
    [resetMoveClick]
  );
  const handlePieceDragEnd = useCallback(() => {
    resetMoveClick();
  }, [resetMoveClick]);
  const onPromotionPieceSelect = useCallback(
    (piece, from, to) => {
      if (!piece) return false;
      const promotionPiece = piece[1]?.toLowerCase() ?? "q";
      if (moveClickFrom && moveClickTo) {
        const result = playMove({
          from: moveClickFrom,
          to: moveClickTo,
          promotion: promotionPiece
        });
        resetMoveClick();
        return !!result;
      }
      if (from && to) {
        const result = playMove({
          from,
          to,
          promotion: promotionPiece
        });
        resetMoveClick();
        return !!result;
      }
      resetMoveClick(moveClickFrom);
      return false;
    },
    [moveClickFrom, moveClickTo, playMove, resetMoveClick]
  );
  const customArrows = useMemo(() => {
    const bestMove = position?.lastEval?.bestMove;
    const moveClassification = position?.eval?.moveClassification;
    if (bestMove && showBestMoveArrow && moveClassification !== MoveClassification.Best && moveClassification !== MoveClassification.Book && moveClassification !== MoveClassification.Brilliant && moveClassification !== MoveClassification.Great) {
      const bestMoveArrow = [
        bestMove.slice(0, 2),
        bestMove.slice(2, 4),
        tinycolor(CLASSIFICATION_COLORS[MoveClassification.Best]).spin(-boardHue).toHexString()
      ];
      return [bestMoveArrow];
    }
    return [];
  }, [position, showBestMoveArrow, boardHue]);
  const SquareRenderer = useMemo(() => {
    return getSquareRenderer({
      currentPositionAtom,
      clickedSquaresAtom,
      playableSquaresAtom,
      showPlayerMoveIconAtom,
      boardSize: boardSize || 400
    });
  }, [
    currentPositionAtom,
    clickedSquaresAtom,
    playableSquaresAtom,
    showPlayerMoveIconAtom,
    boardSize
  ]);
  const customPieces = useMemo(
    () => PIECE_CODES.reduce((acc, piece) => {
      acc[piece] = ({ squareWidth }) => /* @__PURE__ */ jsx(
        Box,
        {
          width: squareWidth,
          height: squareWidth,
          sx: {
            backgroundImage: `url(/piece/${pieceSet}/${piece}.svg)`,
            backgroundSize: "contain"
          }
        }
      );
      return acc;
    }, {}),
    [pieceSet]
  );
  const customBoardStyle = useMemo(() => {
    const commonBoardStyle = {
      borderRadius: "5px",
      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)"
    };
    if (boardHue) {
      return {
        ...commonBoardStyle,
        filter: `hue-rotate(${boardHue}deg)`
      };
    }
    return commonBoardStyle;
  }, [boardHue]);
  return /* @__PURE__ */ jsxs(
    Grid,
    {
      container: true,
      justifyContent: "center",
      alignItems: "center",
      wrap: "nowrap",
      width: boardSize,
      children: [
        showEvaluationBar && /* @__PURE__ */ jsx(
          EvaluationBar,
          {
            height: boardPixelHeight || boardSize || 400,
            boardOrientation,
            currentPositionAtom
          }
        ),
        /* @__PURE__ */ jsxs(
          Grid,
          {
            container: true,
            rowGap: 1.5,
            justifyContent: "center",
            alignItems: "center",
            paddingLeft: { xs: 0.5, sm: showEvaluationBar ? 2 : 0 },
            size: "grow",
            children: [
              /* @__PURE__ */ jsx(
                PlayerHeader,
                {
                  color: boardOrientation === Color.White ? Color.Black : Color.White,
                  gameAtom,
                  player: boardOrientation === Color.White ? blackPlayer : whitePlayer
                }
              ),
              /* @__PURE__ */ jsx(
                Grid,
                {
                  container: true,
                  justifyContent: "center",
                  alignItems: "center",
                  ref: setBoardContainerRef,
                  size: 12,
                  sx: { position: "relative" },
                  children: [
                    /* @__PURE__ */ jsx(
                      Chessboard,
                      {
                        id: `${boardId}-${canPlay}`,
                        position: gameFen,
                        onPieceDrop,
                        boardOrientation: boardOrientation === Color.White ? "white" : "black",
                        customBoardStyle,
                        customArrows,
                        isDraggablePiece: isPiecePlayable,
                        customSquare: SquareRenderer,
                        onSquareClick: handleSquareLeftClick,
                        onSquareRightClick: handleSquareRightClick,
                        onPieceDragBegin: handlePieceDragBegin,
                        onPieceDragEnd: handlePieceDragEnd,
                        onPromotionPieceSelect,
                        showPromotionDialog: false,
                        animationDuration: 200,
                        customPieces
                      }
                    ),
                    visualPromotionSquare && /* @__PURE__ */ jsx(
                      PawnPromotionUI,
                      {
                        promotionSquare: visualPromotionSquare,
                        onPromotion: (pieceType) => onPromotionPieceSelect(visualPromotionSquare.color + pieceType, moveClickFrom, moveClickTo),
                        onCancel: () => resetMoveClick(moveClickFrom),
                        activePieceImages: promotionPieceImages
                      }
                    )
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                PlayerHeader,
                {
                  color: boardOrientation,
                  gameAtom,
                  player: boardOrientation === Color.White ? whitePlayer : blackPlayer
                }
              )
            ]
          }
        )
      ]
    }
  );
}
const PIECE_CODES = [
  "wP",
  "wB",
  "wN",
  "wR",
  "wQ",
  "wK",
  "bP",
  "bB",
  "bN",
  "bR",
  "bQ",
  "bK"
];
export {
  PIECE_CODES,
  Board as default
};

