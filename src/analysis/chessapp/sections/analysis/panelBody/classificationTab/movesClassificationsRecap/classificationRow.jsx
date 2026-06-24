import { jsx, jsxs } from "react/jsx-runtime";
import { Color } from "@analysis/types/enums";
import { Grid, Typography } from "@mui/material";
import { useAtomValue } from "jotai";
import { boardAtom, gameAtom, gameEvalAtom } from "../../../states";
import { useMemo } from "react";
import Image from "@analysis/shims/image";
import { MoveClassification } from "@analysis/types/enums";
import { useChessActions } from "@analysis/hooks/useChessActions";
import { CLASSIFICATION_COLORS } from "@analysis/constants";
import { toPublicPath } from "@/utils/assetPath";
function ClassificationRow({ classification }) {
  const gameEval = useAtomValue(gameEvalAtom);
  const board = useAtomValue(boardAtom);
  const game = useAtomValue(gameAtom);
  const { goToMove } = useChessActions(boardAtom);
  const whiteNb = useMemo(() => {
    if (!gameEval) return 0;
    return gameEval.positions.filter(
      (position, idx) => idx % 2 !== 0 && position.moveClassification === classification
    ).length;
  }, [gameEval, classification]);
  const blackNb = useMemo(() => {
    if (!gameEval) return 0;
    return gameEval.positions.filter(
      (position, idx) => idx % 2 === 0 && position.moveClassification === classification
    ).length;
  }, [gameEval, classification]);
  const handleClick = (color) => {
    if (!gameEval || color === Color.White && !whiteNb || color === Color.Black && !blackNb) {
      return;
    }
    const filterColor = (idx) => idx % 2 !== 0 && color === Color.White || idx % 2 === 0 && color === Color.Black;
    const moveIdx = board.history().length;
    const nextPositionIdx = gameEval.positions.findIndex(
      (position, idx) => filterColor(idx) && position.moveClassification === classification && idx > moveIdx
    );
    if (nextPositionIdx > 0) {
      goToMove(nextPositionIdx, game);
    } else {
      const firstPositionIdx = gameEval.positions.findIndex(
        (position, idx) => filterColor(idx) && position.moveClassification === classification
      );
      if (firstPositionIdx > 0 && firstPositionIdx !== moveIdx) {
        goToMove(firstPositionIdx, game);
      }
    }
  };
  return /* @__PURE__ */ jsxs(
    Grid,
    {
      container: true,
      justifyContent: "space-evenly",
      alignItems: "center",
      wrap: "nowrap",
      color: CLASSIFICATION_COLORS[classification],
      size: 12,
      children: [
        /* @__PURE__ */ jsx(
          Grid,
          {
            container: true,
            justifyContent: "center",
            alignItems: "center",
            width: "3rem",
            style: { cursor: whiteNb ? "pointer" : "default" },
            onClick: () => handleClick(Color.White),
            fontSize: "0.9rem",
            children: whiteNb
          }
        ),
        /* @__PURE__ */ jsxs(
          Grid,
          {
            container: true,
            justifyContent: "start",
            alignItems: "center",
            width: "7rem",
            gap: 1,
            wrap: "nowrap",
            children: [
              /* @__PURE__ */ jsx(
                Image,
                {
                  src: toPublicPath(`icons/${classification}.png`),
                  alt: "move-icon",
                  width: 18,
                  height: 18,
                  style: {
                    maxWidth: "3.5vw",
                    maxHeight: "3.5vw"
                  }
                }
              ),
              /* @__PURE__ */ jsx(Typography, { align: "center", fontSize: "0.9rem", children: CLASSIFICATION_LABELS[classification] ?? classification })
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          Grid,
          {
            container: true,
            justifyContent: "center",
            alignItems: "center",
            width: "3rem",
            style: { cursor: blackNb ? "pointer" : "default" },
            onClick: () => handleClick(Color.Black),
            fontSize: "0.9rem",
            children: blackNb
          }
        )
      ]
    }
  );
}
const CLASSIFICATION_LABELS = {
  [MoveClassification.Brilliant]: "Brilliant (!!)",
  [MoveClassification.Great]: "Great (!)",
  [MoveClassification.Best]: "Best",
  [MoveClassification.Excellent]: "Excellent",
  [MoveClassification.Good]: "Good",
  [MoveClassification.Book]: "Book",
  [MoveClassification.Inaccuracy]: "Inaccuracy",
  [MoveClassification.Miss]: "Miss",
  [MoveClassification.Mistake]: "Mistake",
  [MoveClassification.Blunder]: "Blunder (??)"
};
export {
  ClassificationRow as default
};

