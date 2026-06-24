import { jsx, jsxs } from "react/jsx-runtime";
import { memo } from "react";
import { Box, Grid, Typography } from "@mui/material";
import MoveItem from "./moveItem";

function MovesLine({ moves, moveNb }) {
  return /* @__PURE__ */ jsxs(
    Grid,
    {
      container: true,
      justifyContent: "space-evenly",
      alignItems: "center",
      wrap: "nowrap",
      size: 12,
      children: [
        /* @__PURE__ */ jsxs(Typography, { width: "2rem", fontSize: "0.9rem", children: [
          moveNb,
          "."
        ] }),
        /* @__PURE__ */ jsx(MoveItem, { ...moves[0], moveIdx: (moveNb - 1) * 2 + 1, moveColor: "w" }),
        moves[1] ? /* @__PURE__ */ jsx(MoveItem, { ...moves[1], moveIdx: (moveNb - 1) * 2 + 2, moveColor: "b" }) : /* @__PURE__ */ jsx(Box, { width: "5rem" })
      ]
    }
  );
}

export default memo(MovesLine, (prevProps, nextProps) => {
  if (prevProps.moveNb !== nextProps.moveNb) return false;
  if (prevProps.moves.length !== nextProps.moves.length) return false;
  for (let i = 0; i < prevProps.moves.length; i++) {
    if (prevProps.moves[i].san !== nextProps.moves[i].san) return false;
    if (prevProps.moves[i].moveClassification !== nextProps.moves[i].moveClassification) return false;
  }
  return true;
});

