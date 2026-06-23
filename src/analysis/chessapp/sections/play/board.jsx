import { jsx } from "react/jsx-runtime";
import { useAtomValue } from "jotai";
import {
  engineEloAtom,
  gameAtom,
  playerColorAtom,
  isGameInProgressAtom,
  gameDataAtom,
  enginePlayNameAtom
} from "./states";
import { useChessActions } from "@analysis/hooks/useChessActions";
import { useEffect, useMemo } from "react";
import { useScreenSize } from "@analysis/hooks/useScreenSize";
import { useEngine } from "@analysis/hooks/useEngine";
import { uciMoveParams } from "@/shared/chess/analysis/chess";
import Board from "@analysis/components/board";
import { useGameData } from "@analysis/hooks/useGameData";
import { usePlayersData } from "@analysis/hooks/usePlayersData";
import { sleep } from "@analysis/lib/helpers";
function BoardContainer() {
  const screenSize = useScreenSize();
  const engineName = useAtomValue(enginePlayNameAtom);
  const engine = useEngine(engineName);
  const game = useAtomValue(gameAtom);
  const { white, black } = usePlayersData(gameAtom);
  const playerColor = useAtomValue(playerColorAtom);
  const { playMove } = useChessActions(gameAtom);
  const engineElo = useAtomValue(engineEloAtom);
  const isGameInProgress = useAtomValue(isGameInProgressAtom);
  const gameFen = game.fen();
  const isGameFinished = game.isGameOver();
  useEffect(() => {
    const playEngineMove = async () => {
      if (!engine?.getIsReady() || game.turn() === playerColor || isGameFinished || !isGameInProgress) {
        return;
      }
      const timePromise = sleep(1e3);
      const move = await engine.getEngineNextMove(gameFen, engineElo);
      await timePromise;
      if (move) playMove(uciMoveParams(move));
    };
    playEngineMove();
    return () => {
      engine?.stopAllCurrentJobs();
    };
  }, [gameFen, isGameInProgress, engine, playerColor, isGameFinished, engineElo, playMove]);
  const boardSize = useMemo(() => {
    const width = screenSize.width;
    const height = screenSize.height;
    if (window?.innerWidth < 900) {
      return Math.min(width, height - 150);
    }
    return Math.min(width - 300, height * 0.83);
  }, [screenSize]);
  useGameData(gameAtom, gameDataAtom);
  return /* @__PURE__ */ jsx(
    Board,
    {
      id: "PlayBoard",
      canPlay: isGameInProgress ? playerColor : false,
      gameAtom,
      boardSize,
      whitePlayer: white,
      blackPlayer: black,
      boardOrientation: playerColor,
      currentPositionAtom: gameDataAtom
    }
  );
}
export {
  BoardContainer as default
};
