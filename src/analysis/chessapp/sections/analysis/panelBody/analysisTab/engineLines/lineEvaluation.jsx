import { jsx, jsxs } from "react/jsx-runtime";
import { ListItem, Skeleton, Typography } from "@mui/material";
import { useAtomValue } from "jotai";
import { boardAtom } from "../../../states";
import { getLineEvalLabel, moveLineUciToSan } from "@/shared/chess/analysis/chess";
import { useChessActions } from "@analysis/hooks/useChessActions";
import PrettyMoveSan from "@analysis/components/prettyMoveSan";
function LineEvaluation({ line }) {
  const board = useAtomValue(boardAtom);
  const { addMoves } = useChessActions(boardAtom);
  const lineLabel = getLineEvalLabel(line);
  const isBlackCp = line.cp !== void 0 && line.cp < 0 || line.mate !== void 0 && line.mate < 0;
  const showSkeleton = line.depth < 6;
  const uciToSan = moveLineUciToSan(board.fen());
  const turn = board.turn();
  const getColorFromMoveIdx = (moveIdx) => {
    const moveColor = moveIdx % 2 === 0 ? turn : turn === "w" ? "b" : "w";
    return moveColor;
  };
  return /* @__PURE__ */ jsxs(ListItem, { disablePadding: true, children: [
    /* @__PURE__ */ jsx(
      Typography,
      {
        marginRight: 1.5,
        marginY: 0.3,
        paddingY: 0.2,
        noWrap: true,
        overflow: "visible",
        width: "3.5em",
        minWidth: "3.5em",
        textAlign: "center",
        fontSize: "0.8rem",
        sx: {
          backgroundColor: isBlackCp ? "black" : "white",
          color: isBlackCp ? "white" : "black"
        },
        borderRadius: "5px",
        border: "1px solid #424242",
        fontWeight: "500",
        children: showSkeleton ? /* @__PURE__ */ jsx(
          Skeleton,
          {
            variant: "rounded",
            animation: "wave",
            sx: { color: "transparent" },
            children: "placeholder"
          }
        ) : lineLabel
      }
    ),
    /* @__PURE__ */ jsx(Typography, { noWrap: true, fontSize: "0.9rem", children: showSkeleton ? /* @__PURE__ */ jsx(Skeleton, { variant: "rounded", animation: "wave", width: "20em" }) : line.pv.map((uci, i) => {
      const san = uciToSan(uci);
      const moveColor = getColorFromMoveIdx(i);
      return /* @__PURE__ */ jsx(
        PrettyMoveSan,
        {
          san,
          color: moveColor,
          additionalText: i < line.pv.length - 1 ? "," : "",
          boxProps: {
            onClick: () => {
              addMoves(line.pv.slice(0, i + 1));
            },
            sx: {
              cursor: "pointer",
              ml: i ? 0.5 : 0,
              transition: "opacity 0.2s ease-in-out",
              "&:hover": {
                opacity: 0.5
              }
            }
          }
        },
        i
      );
    }) })
  ] });
}
export {
  LineEvaluation as default
};
