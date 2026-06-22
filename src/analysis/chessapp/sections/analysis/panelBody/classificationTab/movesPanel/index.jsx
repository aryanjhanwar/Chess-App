import { jsx } from "react/jsx-runtime";
import { Grid } from "@mui/material";
import MovesLine from "./movesLine";
import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { boardAtom, gameAtom, gameEvalAtom } from "../../../states";
function MovesPanel() {
  const game = useAtomValue(gameAtom);
  const board = useAtomValue(boardAtom);
  const gameEval = useAtomValue(gameEvalAtom);
  const gameMoves = useMemo(() => {
    const gameHistory = game.history();
    const boardHistory = board.history();
    const history = gameHistory.length ? gameHistory : boardHistory;
    if (!history.length) return void 0;
    const moves = [];
    for (let i = 0; i < history.length; i += 2) {
      const items = [
        {
          san: history[i],
          moveClassification: gameHistory.length ? gameEval?.positions[i + 1]?.moveClassification : void 0
        }
      ];
      if (history[i + 1]) {
        items.push({
          san: history[i + 1],
          moveClassification: gameHistory.length ? gameEval?.positions[i + 2]?.moveClassification : void 0
        });
      }
      moves.push(items);
    }
    return moves;
  }, [game, board, gameEval]);
  if (!gameMoves?.length) return null;
  return /* @__PURE__ */ jsx(
    Grid,
    {
      container: true,
      justifyContent: "center",
      alignItems: "start",
      gap: 0.5,
      paddingY: 1,
      sx: {
        scrollbarWidth: "thin",
        overflowY: "auto",
        width: "100%",
        background: "rgba(2, 20, 34, 0.42)",
        border: "1px solid rgba(125, 211, 252, 0.18)",
        borderRadius: "12px",
        paddingX: 1,
        "&::-webkit-scrollbar": {
          width: "0.45rem"
        },
        "&::-webkit-scrollbar-thumb": {
          background: "rgba(34, 211, 238, 0.45)",
          borderRadius: "999px"
        }
      },
      maxHeight: { xs: "19rem", lg: "24rem" },
      minHeight: { xs: "11rem", lg: "15rem" },
      size: { xs: 8, lg: 7 },
      minWidth: { xs: "18rem", lg: "22rem" },
      id: "moves-panel",
      children: gameMoves?.map((moves, idx) => /* @__PURE__ */ jsx(
        MovesLine,
        {
          moves,
          moveNb: idx + 1
        },
        `${moves.map(({ san }) => san).join()}-${idx}`
      ))
    }
  );
}
export {
  MovesPanel as default
};

