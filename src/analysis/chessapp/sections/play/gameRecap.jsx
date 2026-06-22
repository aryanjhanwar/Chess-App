import { jsx, jsxs } from "react/jsx-runtime";
import { useAtomValue } from "jotai";
import { gameAtom, isGameInProgressAtom, playerColorAtom } from "./states";
import { Button, Grid, Typography } from "@mui/material";
import { Color } from "@analysis/types/enums";
import { setGameHeaders } from "@analysis/lib/chess";
import { useGameDatabase } from "@analysis/hooks/useGameDatabase";
import { useRouter } from "@analysis/shims/router";
function GameRecap() {
  const game = useAtomValue(gameAtom);
  const playerColor = useAtomValue(playerColorAtom);
  const isGameInProgress = useAtomValue(isGameInProgressAtom);
  const { addGame } = useGameDatabase();
  const router = useRouter();
  if (isGameInProgress || !game.history().length) return null;
  const getResultLabel = () => {
    if (game.isCheckmate()) {
      const winnerColor = game.turn() === "w" ? Color.Black : Color.White;
      const winnerLabel = winnerColor === playerColor ? "You" : "Stockfish";
      return `${winnerLabel} won by checkmate !`;
    }
    if (game.isInsufficientMaterial()) return "Draw by insufficient material";
    if (game.isStalemate()) return "Draw by stalemate";
    if (game.isThreefoldRepetition()) return "Draw by threefold repetition";
    if (game.isDraw()) return "Draw by fifty-move rule";
    return "You resigned";
  };
  const handleOpenGameAnalysis = async () => {
    const gameToAnalysis = setGameHeaders(game, {
      resigned: !game.isGameOver() ? playerColor : void 0
    });
    const gameId = await addGame(gameToAnalysis);
    router.push({ pathname: "/", query: { gameId } });
  };
  return /* @__PURE__ */ jsxs(
    Grid,
    {
      container: true,
      justifyContent: "center",
      alignItems: "center",
      gap: 2,
      size: 12,
      children: [
        /* @__PURE__ */ jsx(Grid, { container: true, justifyContent: "center", size: 12, children: /* @__PURE__ */ jsx(Typography, { children: getResultLabel() }) }),
        /* @__PURE__ */ jsx(Button, { variant: "outlined", onClick: handleOpenGameAnalysis, children: "Open game analysis" })
      ]
    }
  );
}
export {
  GameRecap as default
};

