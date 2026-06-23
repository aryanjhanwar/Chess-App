import { getGameFromPgn, setGameHeaders } from "@/shared/chess/analysis/chess";
import { playIllegalMoveSound, playSoundFromMove } from "@analysis/lib/sounds";
import { Chess, DEFAULT_POSITION } from "chess.js";
import { useAtom } from "jotai";
import { useCallback } from "react";
const useChessActions = (chessAtom) => {
  const [game, setGame] = useAtom(chessAtom);
  const setPgn = useCallback(
    (pgn) => {
      const newGame = new Chess();
      newGame.loadPgn(pgn);
      setGame(newGame);
    },
    [setGame]
  );
  const reset = useCallback(
    (params) => {
      const newGame = new Chess(params?.fen);
      if (!params?.noHeaders) setGameHeaders(newGame, params);
      setGame(newGame);
    },
    [setGame]
  );
  const copyGame = useCallback(() => {
    const newGame = new Chess();
    if (game.history().length === 0) {
      const pgnSplitted = game.pgn().split("]");
      if (["1-0", "0-1", "1/2-1/2", "*"].includes(
        pgnSplitted.at(-1)?.trim() ?? ""
      )) {
        newGame.loadPgn(pgnSplitted.slice(0, -1).join("]") + "]");
        return newGame;
      }
    }
    newGame.loadPgn(game.pgn());
    return newGame;
  }, [game]);
  const resetToStartingPosition = useCallback(
    (pgn) => {
      const newGame = pgn ? getGameFromPgn(pgn) : copyGame();
      newGame.load(newGame.getHeaders().FEN || DEFAULT_POSITION, {
        preserveHeaders: true
      });
      setGame(newGame);
    },
    [copyGame, setGame]
  );
  const playMove = useCallback(
    (params) => {
      const newGame = copyGame();
      try {
        const { comment, muteSound, ...move } = params;
        const result = newGame.move(move);
        if (comment) newGame.setComment(comment);
        setGame(newGame);
        if (!muteSound) playSoundFromMove(result);
        return result;
      } catch {
        playIllegalMoveSound();
        return null;
      }
    },
    [copyGame, setGame]
  );
  const addMoves = useCallback(
    (moves) => {
      const newGame = copyGame();
      let lastMove = null;
      for (const move of moves) {
        lastMove = newGame.move(move);
      }
      setGame(newGame);
      if (lastMove) playSoundFromMove(lastMove);
    },
    [copyGame, setGame]
  );
  const undoMove = useCallback((params) => {
    const newGame = copyGame();
    const move = newGame.undo();
    if (move && !params?.muteSound) playSoundFromMove(move);
    setGame(newGame);
  }, [copyGame, setGame]);
  const goToMove = useCallback(
    (moveIdx, fullGame) => {
      if (moveIdx < 0) return;
      const newGame = new Chess();
      newGame.loadPgn(fullGame.pgn());
      const movesNb = fullGame.history().length;
      if (moveIdx > movesNb) return;
      let lastMove = {};
      for (let i = movesNb; i > moveIdx; i--) {
        lastMove = newGame.undo();
      }
      setGame(newGame);
      playSoundFromMove(lastMove);
    },
    [setGame]
  );
  return {
    setPgn,
    reset,
    playMove,
    undoMove,
    goToMove,
    resetToStartingPosition,
    addMoves
  };
};
export {
  useChessActions
};
