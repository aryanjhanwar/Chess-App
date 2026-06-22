import { jsx, jsxs } from "react/jsx-runtime";
import { Grid, Typography } from "@mui/material";
import { useGameDatabase } from "@analysis/hooks/useGameDatabase";
import { useAtomValue } from "jotai";
import { gameAtom } from "../states";
function GamePanel() {
  const { gameFromUrl } = useGameDatabase();
  const game = useAtomValue(gameAtom);
  const gameHeaders = game.getHeaders();
  const hasGameInfo = gameFromUrl !== void 0 || !!gameHeaders.White && gameHeaders.White !== "?";
  if (!hasGameInfo) return null;
  const termination = gameFromUrl?.termination || gameHeaders.Termination || "?";
  const result = termination.split(" ").length > 2 ? termination : gameFromUrl?.result || gameHeaders.Result || "?";
  return /* @__PURE__ */ jsxs(
    Grid,
    {
      container: true,
      justifyContent: "space-evenly",
      alignItems: "center",
      rowGap: 1,
      columnGap: { xs: 1, sm: 3 },
      wrap: { xs: "wrap", sm: "nowrap" },
      size: 11,
      children: [
        /* @__PURE__ */ jsx(Grid, { container: true, justifyContent: "center", alignItems: "center", size: { xs: 12, sm: "grow" }, children: /* @__PURE__ */ jsxs(Typography, { noWrap: false, fontSize: { xs: "0.8rem", sm: "0.9rem" }, align: "center", children: [
          "Site : ",
          gameFromUrl?.site || gameHeaders.Site || "?"
        ] }) }),
        /* @__PURE__ */ jsx(Grid, { container: true, justifyContent: "center", alignItems: "center", size: { xs: 6, sm: "grow" }, children: /* @__PURE__ */ jsxs(Typography, { noWrap: false, fontSize: { xs: "0.8rem", sm: "0.9rem" }, align: "center", children: [
          "Date : ",
          gameFromUrl?.date || gameHeaders.Date || "?"
        ] }) }),
        /* @__PURE__ */ jsx(Grid, { container: true, justifyContent: "center", alignItems: "center", size: { xs: 6, sm: "grow" }, children: /* @__PURE__ */ jsxs(Typography, { noWrap: false, fontSize: { xs: "0.8rem", sm: "0.9rem" }, align: "center", children: [
          "Result : ",
          result
        ] }) })
      ]
    }
  );
}
export {
  GamePanel as default
};

