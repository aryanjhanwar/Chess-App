import { jsx, jsxs } from "react/jsx-runtime";
import { Checkbox, FormControlLabel, Grid } from "@mui/material";
import {
  showBestMoveArrowAtom,
  showPlayerMoveIconAtom
} from "../analysis/states";
import { useAtomLocalStorage } from "@analysis/hooks/useAtomLocalStorage";
function ArrowOptions() {
  const [showBestMove, setShowBestMove] = useAtomLocalStorage(
    "show-arrow-best-move",
    showBestMoveArrowAtom
  );
  const [showPlayerMoveIcon, setShowPlayerMoveIcon] = useAtomLocalStorage(
    "show-icon-player-move",
    showPlayerMoveIconAtom
  );
  return /* @__PURE__ */ jsxs(
    Grid,
    {
      container: true,
      justifyContent: "space-evenly",
      alignItems: "center",
      size: 12,
      gap: 3,
      children: [
        /* @__PURE__ */ jsx(
          FormControlLabel,
          {
            control: /* @__PURE__ */ jsx(
              Checkbox,
              {
                checked: showBestMove,
                onChange: (_, checked) => setShowBestMove(checked)
              }
            ),
            label: "Show engine best move arrow",
            sx: { marginX: 0 }
          }
        ),
        /* @__PURE__ */ jsx(
          FormControlLabel,
          {
            control: /* @__PURE__ */ jsx(
              Checkbox,
              {
                checked: showPlayerMoveIcon,
                onChange: (_, checked) => setShowPlayerMoveIcon(checked)
              }
            ),
            label: "Show played move icon",
            sx: { marginX: 0 }
          }
        )
      ]
    }
  );
}
export {
  ArrowOptions as default
};

