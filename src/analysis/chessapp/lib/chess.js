import { Chess } from "chess.js";
import { getPositionWinPercentage } from "./engine/helpers/winPercentage";
import { Color } from "@analysis/types/enums";
const getEvaluateGameParams = (game) => {
  const history = game.history({ verbose: true });
  const fens = history.map((move) => move.before);
  fens.push(history[history.length - 1].after);
  const uciMoves = history.map(
    (move) => move.from + move.to + (move.promotion || "")
  );
  return { fens, uciMoves };
};
const getGameFromPgn = (pgn) => {
  const game = new Chess();
  game.loadPgn(pgn);
  return game;
};
const formatGameToDatabase = (game) => {
  const headers = game.getHeaders();
  return {
    pgn: game.pgn(),
    event: headers.Event,
    site: headers.Site,
    date: headers.Date,
    round: headers.Round ?? "?",
    white: {
      name: headers.White || "White",
      rating: headers.WhiteElo ? Number(headers.WhiteElo) : void 0
    },
    black: {
      name: headers.Black || "Black",
      rating: headers.BlackElo ? Number(headers.BlackElo) : void 0
    },
    result: headers.Result,
    termination: headers.Termination,
    timeControl: headers.TimeControl
  };
};
const getGameToSave = (game, board) => {
  if (game.history().length) return game;
  return setGameHeaders(board);
};
const setGameHeaders = (game, params = {}) => {
  game.setHeader("Event", "Chesskit Game");
  game.setHeader("Site", "Chesskit.org");
  game.setHeader(
    "Date",
    (/* @__PURE__ */ new Date()).toISOString().split("T")[0].replace(/-/g, ".")
  );
  const { white, black, resigned } = params;
  const whiteHeader = game.getHeaders().White;
  const blackHeader = game.getHeaders().Black;
  const whiteName = white?.name || (whiteHeader !== "?" ? whiteHeader : "White");
  const blackName = black?.name || (blackHeader !== "?" ? blackHeader : "Black");
  game.setHeader("White", whiteName);
  game.setHeader("Black", blackName);
  if (white?.rating) game.setHeader("WhiteElo", `${white.rating}`);
  if (black?.rating) game.setHeader("BlackElo", `${black.rating}`);
  if (resigned) {
    game.setHeader("Result", resigned === "w" ? "0-1" : "1-0");
    game.setHeader(
      "Termination",
      `${resigned === "w" ? blackName : whiteName} won by resignation`
    );
  }
  if (!game.isGameOver()) return game;
  if (game.isCheckmate()) {
    game.setHeader("Result", game.turn() === "w" ? "0-1" : "1-0");
    game.setHeader(
      "Termination",
      `${game.turn() === "w" ? blackName : whiteName} won by checkmate`
    );
  }
  if (game.isInsufficientMaterial()) {
    game.setHeader("Result", "1/2-1/2");
    game.setHeader("Termination", "Draw by insufficient material");
  }
  if (game.isStalemate()) {
    game.setHeader("Result", "1/2-1/2");
    game.setHeader("Termination", "Draw by stalemate");
  }
  if (game.isThreefoldRepetition()) {
    game.setHeader("Result", "1/2-1/2");
    game.setHeader("Termination", "Draw by threefold repetition");
  }
  return game;
};
const moveLineUciToSan = (fen) => {
  const game = new Chess(fen);
  return (moveUci) => {
    try {
      const move = game.move(uciMoveParams(moveUci));
      return move.san;
    } catch {
      return moveUci;
    }
  };
};
const getEvaluationBarValue = (position) => {
  const whiteBarPercentage = getPositionWinPercentage(position);
  const bestLine = position.lines[0];
  if (bestLine.mate) {
    return { label: `M${Math.abs(bestLine.mate)}`, whiteBarPercentage };
  }
  const cp = bestLine.cp;
  if (!cp) return { whiteBarPercentage, label: "0.0" };
  const pEval = Math.abs(cp) / 100;
  let label = pEval.toFixed(1);
  if (label.toString().length > 3) {
    label = pEval.toFixed(0);
  }
  return { whiteBarPercentage, label };
};
const getIsStalemate = (fen) => {
  const game = new Chess(fen);
  return game.isStalemate();
};
const getWhoIsCheckmated = (fen) => {
  const game = new Chess(fen);
  if (!game.isCheckmate()) return null;
  return game.turn();
};
const uciMoveParams = (uciMove) => ({
  from: uciMove.slice(0, 2),
  to: uciMove.slice(2, 4),
  promotion: uciMove.slice(4, 5) || void 0
});
const isSimplePieceRecapture = (fen, uciMoves) => {
  const game = new Chess(fen);
  const moves = uciMoves.map((uciMove) => uciMoveParams(uciMove));
  if (moves[0].to !== moves[1].to) return false;
  const piece = game.get(moves[0].to);
  if (piece) return true;
  return false;
};
const getIsPieceSacrifice = (fen, playedMove, bestLinePvToPlay) => {
  if (!bestLinePvToPlay.length) return false;
  const game = new Chess(fen);
  const whiteToPlay = game.turn() === "w";
  const startingMaterialDifference = getMaterialDifference(fen);
  let moves = [playedMove, ...bestLinePvToPlay];
  if (moves.length % 2 === 1) {
    moves = moves.slice(0, -1);
  }
  let nonCapturingMovesTemp = 1;
  const capturedPieces = {
    w: [],
    b: []
  };
  for (const move of moves) {
    try {
      const fullMove = game.move(uciMoveParams(move));
      if (fullMove.captured) {
        capturedPieces[fullMove.color].push(fullMove.captured);
        nonCapturingMovesTemp = 1;
      } else {
        nonCapturingMovesTemp--;
        if (nonCapturingMovesTemp < 0) break;
      }
    } catch (e) {
      console.error(e);
      return false;
    }
  }
  for (const p of capturedPieces["w"].slice(0)) {
    if (capturedPieces["b"].includes(p)) {
      capturedPieces["b"].splice(capturedPieces["b"].indexOf(p), 1);
      capturedPieces["w"].splice(capturedPieces["w"].indexOf(p), 1);
    }
  }
  if (Math.abs(capturedPieces["w"].length - capturedPieces["b"].length) <= 1 && capturedPieces["w"].concat(capturedPieces["b"]).every((p) => p === "p")) {
    return false;
  }
  const endingMaterialDifference = getMaterialDifference(game.fen());
  const materialDiff = endingMaterialDifference - startingMaterialDifference;
  const materialDiffPlayerRelative = whiteToPlay ? materialDiff : -materialDiff;
  return materialDiffPlayerRelative < 0;
};
const getMaterialDifference = (fen) => {
  const game = new Chess(fen);
  const board = game.board().flat();
  return board.reduce((acc, square) => {
    if (!square) return acc;
    const piece = square.type;
    if (square.color === "w") {
      return acc + getPieceValue(piece);
    }
    return acc - getPieceValue(piece);
  }, 0);
};
const getPieceValue = (piece) => {
  switch (piece) {
    case "p":
      return 1;
    case "n":
      return 3;
    case "b":
      return 3;
    case "r":
      return 5;
    case "q":
      return 9;
    default:
      return 0;
  }
};
const isCheck = (fen) => {
  const game = new Chess(fen);
  return game.inCheck();
};
const getCapturedPieces = (fen, color) => {
  const capturedPieces = color === Color.White ? [
    { piece: "p", count: 8 },
    { piece: "b", count: 2 },
    { piece: "n", count: 2 },
    { piece: "r", count: 2 },
    { piece: "q", count: 1 }
  ] : [
    { piece: "P", count: 8 },
    { piece: "B", count: 2 },
    { piece: "N", count: 2 },
    { piece: "R", count: 2 },
    { piece: "Q", count: 1 }
  ];
  const fenPiecePlacement = fen.split(" ")[0];
  return capturedPieces.map(({ piece, count }) => {
    const piecesLeftCount = fenPiecePlacement.match(
      new RegExp(piece, "g")
    )?.length;
    const newPiece = pieceFenToSymbol[piece] ?? piece;
    return {
      piece: newPiece,
      count: Math.max(0, count - (piecesLeftCount ?? 0))
    };
  });
};
const pieceFenToSymbol = {
  p: "bP",
  b: "bB",
  n: "bN",
  r: "bR",
  q: "bQ",
  k: "bK",
  P: "wP",
  B: "wB",
  N: "wN",
  R: "wR",
  Q: "wQ",
  K: "wK"
};
const getLineEvalLabel = (line) => {
  if (line.cp !== void 0) {
    return `${line.cp > 0 ? "+" : ""}${(line.cp / 100).toFixed(2)}`;
  }
  if (line.mate) {
    return `${line.mate > 0 ? "+" : "-"}M${Math.abs(line.mate)}`;
  }
  return "?";
};
const formatUciPv = (fen, uciMoves) => {
  const castlingRights = fen.split(" ")[2];
  let canWhiteCastleKingSide = castlingRights.includes("K");
  let canWhiteCastleQueenSide = castlingRights.includes("Q");
  let canBlackCastleKingSide = castlingRights.includes("k");
  let canBlackCastleQueenSide = castlingRights.includes("q");
  return uciMoves.map((uci) => {
    if (uci === "e1h1" && canWhiteCastleKingSide) {
      canWhiteCastleKingSide = false;
      return "e1g1";
    }
    if (uci === "e1a1" && canWhiteCastleQueenSide) {
      canWhiteCastleQueenSide = false;
      return "e1c1";
    }
    if (uci === "e8h8" && canBlackCastleKingSide) {
      canBlackCastleKingSide = false;
      return "e8g8";
    }
    if (uci === "e8a8" && canBlackCastleQueenSide) {
      canBlackCastleQueenSide = false;
      return "e8c8";
    }
    return uci;
  });
};
export {
  formatGameToDatabase,
  formatUciPv,
  getCapturedPieces,
  getEvaluateGameParams,
  getEvaluationBarValue,
  getGameFromPgn,
  getGameToSave,
  getIsPieceSacrifice,
  getIsStalemate,
  getLineEvalLabel,
  getMaterialDifference,
  getWhoIsCheckmated,
  isCheck,
  isSimplePieceRecapture,
  moveLineUciToSan,
  setGameHeaders,
  uciMoveParams
};
