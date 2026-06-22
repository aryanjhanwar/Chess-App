import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Button } from "@mui/material";
import { useState } from "react";
import GameSettingsDialog from "./gameSettingsDialog";
import { gameAtom } from "../states";
import { useAtomValue } from "jotai";
function GameSettingsButton() {
  const [openDialog, setOpenDialog] = useState(false);
  const game = useAtomValue(gameAtom);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Button, { variant: "contained", onClick: () => setOpenDialog(true), children: game.history().length ? "Start new game" : "Start game" }),
    /* @__PURE__ */ jsx(
      GameSettingsDialog,
      {
        open: openDialog,
        onClose: () => setOpenDialog(false)
      }
    )
  ] });
}
export {
  GameSettingsButton as default
};
