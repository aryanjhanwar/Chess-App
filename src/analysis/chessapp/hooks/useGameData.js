import { useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";
const useGameData = (gameAtom, gameDataAtom) => {
  const game = useAtomValue(gameAtom);
  const [gameData, setGameData] = useAtom(gameDataAtom);
  useEffect(() => {
    const history = game.history({ verbose: true });
    const lastMove = history.at(-1);
    setGameData({ lastMove });
  }, [game]);
  return gameData;
};
export {
  useGameData
};
