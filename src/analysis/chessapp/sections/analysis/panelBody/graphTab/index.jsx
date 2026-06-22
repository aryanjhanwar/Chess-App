import { jsx, jsxs } from "react/jsx-runtime";
import { createElement } from "react";
import { Box, Grid } from "@mui/material";
import { useAtomValue } from "jotai";
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  boardAtom,
  currentPositionAtom,
  gameAtom,
  gameEvalAtom
} from "../../states";
import { useCallback, useMemo } from "react";
import CustomTooltip from "./tooltip";
import { CLASSIFICATION_COLORS } from "@analysis/constants";
import CustomDot from "./dot";
import { MoveClassification } from "@analysis/types/enums";
import { useChessActions } from "@analysis/hooks/useChessActions";
function GraphTab(props) {
  const gameEval = useAtomValue(gameEvalAtom);
  const currentPosition = useAtomValue(currentPositionAtom);
  const { goToMove } = useChessActions(boardAtom);
  const game = useAtomValue(gameAtom);
  const chartData = useMemo(
    () => gameEval?.positions.map(formatEvalToChartData) ?? [],
    [gameEval]
  );
  const bestDotIndices = useMemo(() => {
    const bestItems = chartData.filter(
      (item) => item.moveClassification === MoveClassification.Best
    );
    const count = Math.ceil(bestItems.length * 0.15);
    const indices = bestItems.map((item) => item.moveNb);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return new Set(indices.slice(0, count));
  }, [chartData]);
  const boardMoveColor = currentPosition.eval?.moveClassification ? CLASSIFICATION_COLORS[currentPosition.eval.moveClassification] : "grey";
  const renderDot = useCallback(
    (props2) => {
      const payload = props2.payload;
      const moveClass = payload?.moveClassification;
      if (!moveClass) return /* @__PURE__ */ jsx("svg", {}, props2.key);
      if ([
        MoveClassification.Brilliant,
        MoveClassification.Great,
        MoveClassification.Blunder,
        MoveClassification.Mistake
      ].includes(moveClass) || moveClass === MoveClassification.Best && bestDotIndices.has(payload.moveNb)) {
        return /* @__PURE__ */ createElement(CustomDot, { ...props2, key: props2.key, payload });
      }
      return /* @__PURE__ */ jsx("svg", {}, props2.key);
    },
    [bestDotIndices]
  );
  if (!gameEval || props.hidden) return null;
  return /* @__PURE__ */ jsx(
    Grid,
    {
      container: true,
      justifyContent: "center",
      alignItems: "center",
      minHeight: { xs: "12rem", sm: "13rem", lg: "10rem" },
      height: { xs: "13.5rem", sm: "14.5rem", lg: "none" },
      maxHeight: { xs: "15rem", lg: "10rem" },
      marginTop: { xs: 0.5, sm: 1, lg: 0 },
      ...props,
      sx: props.sx,
      size: 12,
      children: /* @__PURE__ */ jsx(
        Box,
        {
          height: "100%",
          width: { xs: "100%", lg: "90%" },
          sx: {
            backgroundColor: "#2e2e2e",
            borderRadius: "15px",
            overflow: "hidden"
          },
          children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(
            AreaChart,
            {
              width: 500,
              height: 400,
              data: chartData,
              margin: { top: 0, left: 0, right: 0, bottom: 0 },
              onClick: (e) => {
                const payload = e?.activePayload?.[0]?.payload;
                if (!payload) return;
                goToMove(payload.moveNb, game);
              },
              style: { cursor: "pointer" },
              children: [
                /* @__PURE__ */ jsx(XAxis, { dataKey: "moveNb", hide: true, stroke: "red" }),
                /* @__PURE__ */ jsx(YAxis, { domain: [0, 20], hide: true }),
                /* @__PURE__ */ jsx(
                  Tooltip,
                  {
                    content: /* @__PURE__ */ jsx(CustomTooltip, {}),
                    isAnimationActive: false,
                    cursor: {
                      stroke: "grey",
                      strokeWidth: 2,
                      strokeOpacity: 0.3
                    }
                  }
                ),
                /* @__PURE__ */ jsx(
                  Area,
                  {
                    type: "monotone",
                    dataKey: "value",
                    stroke: "none",
                    fill: "#ffffff",
                    fillOpacity: 1,
                    dot: renderDot,
                    activeDot: /* @__PURE__ */ jsx(CustomDot, {}),
                    isAnimationActive: false
                  }
                ),
                /* @__PURE__ */ jsx(
                  ReferenceLine,
                  {
                    y: 10,
                    stroke: "grey",
                    strokeWidth: 2,
                    strokeOpacity: 0.4
                  }
                ),
                /* @__PURE__ */ jsx(
                  ReferenceLine,
                  {
                    x: currentPosition.currentMoveIdx,
                    stroke: boardMoveColor,
                    strokeWidth: 4,
                    strokeOpacity: 0.6
                  }
                )
              ]
            }
          ) })
        }
      )
    }
  );
}
const formatEvalToChartData = (position, index) => {
  const line = position.lines[0];
  const chartItem = {
    moveNb: index,
    value: 10,
    cp: line.cp,
    mate: line.mate,
    moveClassification: position.moveClassification
  };
  if (line.mate) {
    return {
      ...chartItem,
      value: line.mate > 0 ? 20 : 0
    };
  }
  if (line.cp) {
    return {
      ...chartItem,
      value: Math.max(Math.min(line.cp / 100, 10), -10) + 10
    };
  }
  return chartItem;
};
export {
  GraphTab as default
};

