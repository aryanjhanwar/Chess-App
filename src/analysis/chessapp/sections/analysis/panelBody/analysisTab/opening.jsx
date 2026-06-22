import { jsx } from "react/jsx-runtime";
import { useAtomValue } from "jotai";
import { Grid, Skeleton, Typography } from "@mui/material";
import { currentPositionAtom } from "../../states";
function Opening() {
  const position = useAtomValue(currentPositionAtom);
  const lastMove = position?.lastMove;
  if (!lastMove) return null;
  const opening = position?.eval?.opening || position.opening;
  if (!opening) {
    return /* @__PURE__ */ jsx(Grid, { justifyItems: "center", alignContent: "center", children: /* @__PURE__ */ jsx(
      Skeleton,
      {
        variant: "rounded",
        animation: "wave",
        width: "12em",
        sx: { color: "transparent", maxWidth: "7vw", maxHeight: "3.5vw" },
        children: /* @__PURE__ */ jsx(Typography, { align: "center", fontSize: "0.9rem", children: "placeholder" })
      }
    ) });
  }
  return /* @__PURE__ */ jsx(Grid, { children: /* @__PURE__ */ jsx(Typography, { align: "center", fontSize: "0.9rem", maxWidth: "20rem", children: opening }) });
}
export {
  Opening as default
};

