import { jsx, jsxs } from "react/jsx-runtime";
import { getCapturedPieces, getMaterialDifference } from "@/shared/chess/analysis/chess";
import { Color } from "@analysis/types/enums";
import { Box, Grid, Stack, Typography } from "@mui/material";
import { useMemo } from "react";
const PIECE_SCALE = 0.55;
function CapturedPieces({ fen, color }) {
  const piecesComponents = useMemo(() => {
    const capturedPieces = getCapturedPieces(fen, color);
    return capturedPieces.map(
      ({ piece, count }) => getCapturedPiecesComponents(piece, count)
    );
  }, [fen, color]);
  const materialDiff = useMemo(() => {
    const materialDiff2 = getMaterialDifference(fen);
    return color === Color.White ? materialDiff2 : -materialDiff2;
  }, [fen, color]);
  return /* @__PURE__ */ jsxs(
    Grid,
    {
      container: true,
      alignItems: "end",
      spacing: 0.7,
      size: "auto",
      marginLeft: `-${0.3 * PIECE_SCALE}rem`,
      children: [
        /* @__PURE__ */ jsx(Stack, { direction: "row", spacing: 0.1, children: piecesComponents }),
        materialDiff > 0 && /* @__PURE__ */ jsxs(
          Typography,
          {
            lineHeight: `${PIECE_SCALE * 1.5}rem`,
            fontSize: `${PIECE_SCALE * 1.5}rem`,
            marginLeft: 0.3,
            children: [
              "+",
              materialDiff
            ]
          }
        )
      ]
    }
  );
}
const getCapturedPiecesComponents = (pieceSymbol, pieceCount) => {
  if (!pieceCount) return null;
  return /* @__PURE__ */ jsx(
    Stack,
    {
      direction: "row",
      spacing: `-${1.2 * PIECE_SCALE}rem`,
      children: new Array(pieceCount).fill(0).map((_, index) => /* @__PURE__ */ jsx(
        Box,
        {
          width: `${2 * PIECE_SCALE}rem`,
          height: `${2 * PIECE_SCALE}rem`,
          sx: {
            backgroundImage: `url(/piece/cardinal/${pieceSymbol}.svg)`,
            backgroundRepeat: "no-repeat"
          }
        },
        `${pieceSymbol}-${index}`
      ))
    },
    pieceSymbol
  );
};
export {
  CapturedPieces as default
};

