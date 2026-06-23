import { jsx, jsxs } from "react/jsx-runtime";
import { Skeleton, Stack, Typography } from "@mui/material";
import { useAtomValue } from "jotai";
import { boardAtom, currentPositionAtom } from "../../states";
import { useMemo } from "react";
import { moveLineUciToSan } from "@/shared/chess/analysis/chess";
import { MoveClassification } from "@analysis/types/enums";
import Image from "@analysis/shims/image";
import PrettyMoveSan from "@analysis/components/prettyMoveSan";
function MoveInfo() {
  const position = useAtomValue(currentPositionAtom);
  const board = useAtomValue(boardAtom);
  const bestMove = position?.lastEval?.bestMove;
  const bestMoveSan = useMemo(() => {
    if (!bestMove) return void 0;
    const lastPosition = board.history({ verbose: true }).at(-1)?.before;
    if (!lastPosition) return void 0;
    return moveLineUciToSan(lastPosition)(bestMove);
  }, [bestMove, board]);
  if (board.history().length === 0) return null;
  if (!bestMoveSan) {
    return /* @__PURE__ */ jsx(Stack, { direction: "row", alignItems: "center", columnGap: 5, marginTop: 0.8, children: /* @__PURE__ */ jsx(
      Skeleton,
      {
        variant: "rounded",
        animation: "wave",
        width: "12em",
        sx: { color: "transparent", maxWidth: "7vw" },
        children: /* @__PURE__ */ jsx(Typography, { align: "center", fontSize: "0.9rem", children: "placeholder" })
      }
    ) });
  }
  const moveClassification = position.eval?.moveClassification;
  const showBestMoveLabel = moveClassification !== MoveClassification.Best && moveClassification !== MoveClassification.Book && moveClassification !== MoveClassification.Brilliant && moveClassification !== MoveClassification.Great;
  return /* @__PURE__ */ jsxs(
    Stack,
    {
      direction: "row",
      alignItems: "center",
      justifyContent: "center",
      columnGap: 4,
      marginTop: 0.5,
      flexWrap: "wrap",
      children: [
        moveClassification && /* @__PURE__ */ jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [
          /* @__PURE__ */ jsx(
            Image,
            {
              src: `/icons/${moveClassification}.png`,
              alt: "move-icon",
              width: 16,
              height: 16,
              style: {
                maxWidth: "3.5vw",
                maxHeight: "3.5vw"
              }
            }
          ),
          /* @__PURE__ */ jsx(
            PrettyMoveSan,
            {
              typographyProps: {
                fontSize: "0.9rem"
              },
              san: position.lastMove?.san ?? "",
              color: position.lastMove?.color ?? "w",
              additionalText: " is " + moveClassificationLabels[moveClassification]
            }
          )
        ] }),
        showBestMoveLabel && /* @__PURE__ */ jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [
          /* @__PURE__ */ jsx(
            Image,
            {
              src: "/icons/best.png",
              alt: "move-icon",
              width: 16,
              height: 16,
              style: {
                maxWidth: "3.5vw",
                maxHeight: "3.5vw"
              }
            }
          ),
          /* @__PURE__ */ jsx(
            PrettyMoveSan,
            {
              typographyProps: {
                fontSize: "0.9rem"
              },
              san: bestMoveSan,
              color: position.lastMove?.color ?? "w",
              additionalText: " was the best move"
            }
          )
        ] })
      ]
    }
  );
}
const moveClassificationLabels = {
  [MoveClassification.Book]: "book",
  [MoveClassification.Brilliant]: "brilliant (!!)",
  [MoveClassification.Great]: "great (!)",
  [MoveClassification.Best]: "the best move",
  [MoveClassification.Excellent]: "excellent",
  [MoveClassification.Good]: "good",
  [MoveClassification.Miss]: "a miss",
  [MoveClassification.Inaccuracy]: "an inaccuracy",
  [MoveClassification.Mistake]: "a mistake",
  [MoveClassification.Blunder]: "a blunder (??)"
};
export {
  MoveInfo as default
};
