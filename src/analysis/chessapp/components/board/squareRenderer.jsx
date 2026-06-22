import { jsx, jsxs } from "react/jsx-runtime";
import { atom, useAtomValue } from "jotai";
import Image from "@analysis/shims/image";
import { forwardRef, useMemo } from "react";
import { CLASSIFICATION_COLORS } from "@analysis/constants";
import { boardHueAtom } from "./states";
import { toPublicPath } from "@analysis/lib/publicPath";
function getSquareRenderer({
  currentPositionAtom,
  clickedSquaresAtom,
  playableSquaresAtom,
  showPlayerMoveIconAtom = atom(false),
  boardSize
}) {
  const squareRenderer = forwardRef(
    (props, ref) => {
      const { children, square, style } = props;
      const showPlayerMoveIcon = useAtomValue(showPlayerMoveIconAtom);
      const position = useAtomValue(currentPositionAtom);
      const clickedSquares = useAtomValue(clickedSquaresAtom);
      const playableSquares = useAtomValue(playableSquaresAtom);
      const boardHue = useAtomValue(boardHueAtom);
      const fromSquare = position.lastMove?.from;
      const toSquare = position.lastMove?.to;
      const moveClassification = position?.eval?.moveClassification;
      const highlightSquareStyle = useMemo(
        () => clickedSquares.includes(square) ? rightClickSquareStyle : fromSquare === square || toSquare === square ? previousMoveSquareStyle(moveClassification) : void 0,
        [clickedSquares, square, fromSquare, toSquare, moveClassification]
      );
      const playableSquareStyle = useMemo(
        () => playableSquares.includes(square) ? playableSquareStyles : void 0,
        [playableSquares, square]
      );
      return /* @__PURE__ */ jsxs(
        "div",
        {
          ref,
          style: {
            ...style,
            position: "relative",
            filter: boardHue ? `hue-rotate(-${boardHue}deg)` : void 0
          },
          children: [
            children,
            highlightSquareStyle && /* @__PURE__ */ jsx("div", { style: highlightSquareStyle }),
            playableSquareStyle && /* @__PURE__ */ jsx("div", { style: playableSquareStyle }),
            moveClassification && showPlayerMoveIcon && square === toSquare && /* @__PURE__ */ jsx(
              Image,
              {
                src: toPublicPath(`icons/${moveClassification}.png`),
                alt: "move-icon",
                width: Math.min(40, boardSize * 0.06),
                height: Math.min(40, boardSize * 0.06),
                style: {
                  position: "absolute",
                  top: "2px",
                  right: "2px",
                  zIndex: 100
                }
              }
            )
          ]
        }
      );
    }
  );
  squareRenderer.displayName = "SquareRenderer";
  return squareRenderer;
}
const rightClickSquareStyle = {
  position: "absolute",
  width: "100%",
  height: "100%",
  backgroundColor: "#eb6150",
  opacity: "0.8"
};
const playableSquareStyles = {
  position: "absolute",
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0,0,0,.14)",
  padding: "35%",
  backgroundClip: "content-box",
  borderRadius: "50%",
  boxSizing: "border-box"
};
const previousMoveSquareStyle = (moveClassification) => ({
  position: "absolute",
  width: "100%",
  height: "100%",
  backgroundColor: moveClassification ? CLASSIFICATION_COLORS[moveClassification] : "#fad541",
  opacity: 0.5
});
export {
  getSquareRenderer
};
