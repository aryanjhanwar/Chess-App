import { jsx, jsxs } from "react/jsx-runtime";
import { usePlayersData } from "@analysis/hooks/usePlayersData";
import { Grid, Typography } from "@mui/material";
import { gameAtom, gameEvalAtom } from "../../../states";
import { MoveClassification } from "@analysis/types/enums";
import ClassificationRow from "./classificationRow";
import { useAtomValue } from "jotai";
function MovesClassificationsRecap() {
  const { white, black } = usePlayersData(gameAtom);
  const gameEval = useAtomValue(gameEvalAtom);
  if (!gameEval?.positions.length) return null;
  return /* @__PURE__ */ jsxs(
    Grid,
    {
      container: true,
      justifyContent: "center",
      alignItems: "center",
      rowGap: 0.7,
      sx: {
        overflowY: "visible",
        width: "100%",
        background: "rgba(2, 20, 34, 0.42)",
        border: "1px solid rgba(125, 211, 252, 0.18)",
        borderRadius: "12px",
        padding: "0.55rem"
      },
      height: "auto",
      maxHeight: "none",
      size: { xs: 4, lg: 5 },
      minWidth: { xs: "14rem", lg: "16rem" },
      children: [
        /* @__PURE__ */ jsxs(
          Grid,
          {
            container: true,
            alignItems: "center",
            justifyContent: "space-evenly",
            wrap: "nowrap",
            size: 12,
            children: [
              /* @__PURE__ */ jsx(Typography, { width: { xs: "42%", sm: "12rem" }, align: "center", noWrap: true, fontSize: { xs: "0.8rem", sm: "0.9rem" }, children: white.name }),
              /* @__PURE__ */ jsx(Typography, { width: { xs: "16%", sm: "7rem" } }),
              /* @__PURE__ */ jsx(Typography, { width: { xs: "42%", sm: "12rem" }, align: "center", noWrap: true, fontSize: { xs: "0.8rem", sm: "0.9rem" }, children: black.name })
            ]
          }
        ),
        sortedMoveClassfications.map((classification) => /* @__PURE__ */ jsx(
          ClassificationRow,
          {
            classification
          },
          classification
        ))
      ]
    }
  );
}
const sortedMoveClassfications = [
  MoveClassification.Brilliant,
  MoveClassification.Great,
  MoveClassification.Best,
  MoveClassification.Excellent,
  MoveClassification.Good,
  MoveClassification.Book,
  MoveClassification.Inaccuracy,
  MoveClassification.Miss,
  MoveClassification.Mistake,
  MoveClassification.Blunder
];
export {
  MovesClassificationsRecap as default,
  sortedMoveClassfications
};

