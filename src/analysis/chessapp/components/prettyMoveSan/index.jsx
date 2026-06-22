import { jsx, jsxs } from "react/jsx-runtime";
import {
  Box,
  Typography,
  useTheme
} from "@mui/material";
import localFont from "@analysis/shims/fontLocal";
import { useMemo } from "react";
const chessFont = localFont({
  src: "./chess_merida_unicode.ttf"
});
function PrettyMoveSan({
  san,
  color,
  additionalText,
  typographyProps,
  boxProps
}) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const { icon, text } = useMemo(() => {
    const firstChar = san.charAt(0);
    const isPiece = ["K", "Q", "R", "B", "N"].includes(firstChar);
    if (!isPiece) return { text: san };
    const pieceColor = isDarkMode ? color : color === "w" ? "b" : "w";
    const icon2 = unicodeMap[firstChar][pieceColor];
    return { icon: icon2, text: san.slice(1) };
  }, [san, color, isDarkMode]);
  return /* @__PURE__ */ jsxs(Box, { component: "span", ...boxProps, children: [
    icon && /* @__PURE__ */ jsx(
      Typography,
      {
        component: "span",
        fontFamily: chessFont.style.fontFamily,
        ...typographyProps,
        children: icon
      }
    ),
    /* @__PURE__ */ jsxs(Typography, { component: "span", noWrap: true, ...typographyProps, children: [
      text,
      additionalText
    ] })
  ] });
}
const unicodeMap = {
  K: { w: "\u265A", b: "\u2654" },
  Q: { w: "\u265B", b: "\u2655" },
  R: { w: "\u265C", b: "\u2656" },
  B: { w: "\u265D", b: "\u2657" },
  N: { w: "\u265E", b: "\u2658" }
};
export {
  PrettyMoveSan as default
};
