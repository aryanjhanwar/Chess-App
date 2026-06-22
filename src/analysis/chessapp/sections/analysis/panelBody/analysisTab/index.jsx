import { jsx, jsxs } from "react/jsx-runtime";
import {
  Grid,
  Stack,
  Typography
} from "@mui/material";
import { useAtomValue } from "jotai";
import { boardAtom, gameAtom, gameEvalAtom } from "../../states";
import PlayersMetric from "./playersMetric";
import MoveInfo from "./moveInfo";
import Opening from "./opening";
import EngineLines from "./engineLines";
function AnalysisTab(props) {
  const gameEval = useAtomValue(gameEvalAtom);
  const game = useAtomValue(gameAtom);
  const board = useAtomValue(boardAtom);
  const boardHistory = board.history();
  const gameHistory = game.history();
  const isGameOver = boardHistory.length > 0 && (board.isCheckmate() || board.isDraw() || boardHistory.join() === gameHistory.join());
  return /* @__PURE__ */ jsxs(
    Grid,
    {
      container: true,
      size: 12,
      justifyContent: { xs: "center", lg: gameEval ? "start" : "center" },
      alignItems: "start",
      flexWrap: { lg: gameEval ? "nowrap" : void 0 },
      gap: 1.25,
      marginY: { lg: gameEval ? 0.5 : void 0 },
      paddingX: { xs: 0.5, lg: "calc(3% - 1rem)" },
      minHeight: 0,
      ...props,
      sx: props.hidden ? { display: "none" } : { minHeight: 0, ...props.sx },
      children: [
        /* @__PURE__ */ jsxs(
          Stack,
          {
            justifyContent: "start",
            alignItems: "center",
            rowGap: 0.85,
            minWidth: gameEval ? "min(25rem, 95vw)" : void 0,
            sx: {
              background: "rgba(3, 20, 33, 0.42)",
              border: "1px solid rgba(125, 211, 252, 0.22)",
              borderRadius: "14px",
              padding: "0.8rem"
            },
            children: [
              gameEval && /* @__PURE__ */ jsx(
                PlayersMetric,
                {
                  title: "Accuracy",
                  whiteValue: `${gameEval.accuracy.white.toFixed(1)} %`,
                  blackValue: `${gameEval.accuracy.black.toFixed(1)} %`
                }
              ),
              gameEval?.estimatedElo && /* @__PURE__ */ jsx(
                PlayersMetric,
                {
                  title: "Game Rating",
                  whiteValue: Math.round(gameEval.estimatedElo.white),
                  blackValue: Math.round(gameEval.estimatedElo.black)
                }
              ),
              /* @__PURE__ */ jsx(MoveInfo, {}),
              /* @__PURE__ */ jsx(Opening, {}),
              isGameOver && /* @__PURE__ */ jsx(Typography, { align: "center", fontSize: "0.9rem", noWrap: true, children: "Game is over" })
            ]
          }
        ),
        /* @__PURE__ */ jsx(EngineLines, { size: { lg: gameEval ? void 0 : 12 } })
      ]
    }
  );
}
export {
  AnalysisTab as default
};

