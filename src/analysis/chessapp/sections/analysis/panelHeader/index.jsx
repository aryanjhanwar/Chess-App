import { jsx, jsxs } from "react/jsx-runtime";
import { Icon } from "@iconify/react";
import { Grid, Typography } from "@mui/material";
import GamePanel from "./gamePanel";
import LoadGame from "./loadGame";
import AnalyzeButton from "./analyzeButton";
import LinearProgressBar from "@analysis/components/LinearProgressBar";
import { useAtomValue } from "jotai";
import { evaluationProgressAtom } from "../states";
function PanelHeader() {
  const evaluationProgress = useAtomValue(evaluationProgressAtom);
  return /* @__PURE__ */ jsxs(
    Grid,
    {
      container: true,
      justifyContent: "center",
      alignItems: "center",
      rowGap: 2,
      size: 12,
      children: [
        /* @__PURE__ */ jsxs(
          Grid,
          {
            container: true,
            justifyContent: "center",
            alignItems: "center",
            columnGap: 1,
            size: 12,
            children: /* @__PURE__ */ jsxs(Grid, { container: true, alignItems: "center", columnGap: 1, size: "auto", children: [
              /* @__PURE__ */ jsx(Icon, { icon: "streamline:clipboard-check", height: 24, style: { color: "#67e8f9" } }),
              /* @__PURE__ */ jsx(Typography, { variant: "h5", align: "center", sx: { color: "#ecfeff", letterSpacing: "0.01em" }, children: "Game Analysis" })
            ] })
          }
        ),
        /* @__PURE__ */ jsxs(
          Grid,
          {
            container: true,
            justifyContent: "center",
            alignItems: "center",
            rowGap: 2,
            columnGap: 12,
            size: 12,
            children: [
              /* @__PURE__ */ jsx(GamePanel, {}),
              /* @__PURE__ */ jsx(LoadGame, {}),
              /* @__PURE__ */ jsx(AnalyzeButton, {}),
              /* @__PURE__ */ jsx(LinearProgressBar, { value: evaluationProgress, label: "Analyzing..." })
            ]
          }
        )
      ]
    }
  );
}
export {
  PanelHeader as default
};

