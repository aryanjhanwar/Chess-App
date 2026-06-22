import { jsx, jsxs } from "react/jsx-runtime";
import {
  Button,
  CircularProgress,
  Grid,
  Typography
} from "@mui/material";
import { useAtom, useAtomValue } from "jotai";
import { gameAtom, isGameInProgressAtom } from "./states";
import { useEffect } from "react";
import UndoMoveButton from "./undoMoveButton";
function GameInProgress() {
  const game = useAtomValue(gameAtom);
  const [isGameInProgress, setIsGameInProgress] = useAtom(isGameInProgressAtom);
  useEffect(() => {
    if (game.isGameOver()) setIsGameInProgress(false);
  }, [game, setIsGameInProgress]);
  const handleResign = () => {
    setIsGameInProgress(false);
  };
  if (!isGameInProgress) return null;
  return /* @__PURE__ */ jsxs(
    Grid,
    {
      container: true,
      justifyContent: "center",
      alignItems: "center",
      gap: 2,
      size: 12,
      children: [
        /* @__PURE__ */ jsxs(
          Grid,
          {
            container: true,
            justifyContent: "center",
            alignItems: "center",
            gap: 2,
            size: 12,
            children: [
              /* @__PURE__ */ jsx(Typography, { children: "Game in progress" }),
              /* @__PURE__ */ jsx(CircularProgress, { size: 20, color: "info" })
            ]
          }
        ),
        /* @__PURE__ */ jsx(Grid, { container: true, justifyContent: "center", alignItems: "center", size: 12, children: /* @__PURE__ */ jsx(UndoMoveButton, {}) }),
        /* @__PURE__ */ jsx(Grid, { container: true, justifyContent: "center", alignItems: "center", size: 12, children: /* @__PURE__ */ jsx(Button, { variant: "outlined", onClick: handleResign, children: "Resign" }) })
      ]
    }
  );
}
export {
  GameInProgress as default
};

