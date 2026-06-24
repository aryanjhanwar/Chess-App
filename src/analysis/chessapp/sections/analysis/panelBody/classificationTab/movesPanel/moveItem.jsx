import { jsx, jsxs } from "react/jsx-runtime";
import { Grid } from "@mui/material";
import Image from "@analysis/shims/image";
import { useAtomValue } from "jotai";
import { boardAtom, currentPositionAtom, gameAtom } from "../../../states";
import { useChessActions } from "@analysis/hooks/useChessActions";
import { useEffect } from "react";
import { isInViewport } from "@analysis/lib/helpers";
import PrettyMoveSan from "@analysis/components/prettyMoveSan";
import { toPublicPath } from "@/utils/assetPath";
function MoveItem({
  san,
  moveClassification,
  moveIdx,
  moveColor
}) {
  const game = useAtomValue(gameAtom);
  const board = useAtomValue(boardAtom);
  const { goToMove } = useChessActions(boardAtom);
  const position = useAtomValue(currentPositionAtom);
  const isCurrentMove = position?.currentMoveIdx === moveIdx;
  useEffect(() => {
    if (!isCurrentMove) return;
    const moveItem = document.getElementById(`move-${moveIdx}`);
    if (!moveItem) return;
    const movePanel = document.getElementById("moves-panel");
    if (!movePanel || !isInViewport(movePanel)) return;
    moveItem.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [isCurrentMove, moveIdx]);
  const handleClick = () => {
    if (isCurrentMove) return;
    const gameToUse = game.moveNumber() > 1 ? game : board;
    goToMove(moveIdx, gameToUse);
  };
  return /* @__PURE__ */ jsxs(
    Grid,
    {
      container: true,
      justifyContent: "center",
      alignItems: "center",
      gap: 1,
      width: "5rem",
      wrap: "nowrap",
      onClick: handleClick,
      paddingY: 0.5,
      sx: (theme) => ({
        cursor: isCurrentMove ? void 0 : "pointer",
        backgroundColor: isCurrentMove && theme.palette.mode === "dark" ? "#4f4f4f" : void 0,
        border: isCurrentMove && theme.palette.mode === "light" ? "1px solid #424242" : void 0,
        borderRadius: 1
      }),
      id: `move-${moveIdx}`,
      title: moveClassification || "",
      children: [
        moveClassification && /* @__PURE__ */ jsx(
          Image,
          {
            src: toPublicPath(`icons/${moveClassification}.png`),
            alt: "move-icon",
            width: 14,
            height: 14,
            style: {
              maxWidth: "3.5vw",
              maxHeight: "3.5vw"
            }
          }
        ),
        /* @__PURE__ */ jsx(
          PrettyMoveSan,
          {
            san,
            color: moveColor,
            typographyProps: { fontSize: "0.9rem" }
          }
        )
      ]
    }
  );
}
export {
  MoveItem as default
};

