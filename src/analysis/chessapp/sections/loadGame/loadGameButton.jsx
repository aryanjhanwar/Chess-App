import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Button, Typography } from "@mui/material";
import { useState } from "react";
import NewGameDialog from "./loadGameDialog";
function LoadGameButton({ setGame, label, size }) {
  const [openDialog, setOpenDialog] = useState(false);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      Button,
      {
        variant: "contained",
        onClick: () => setOpenDialog(true),
        size,
        children: /* @__PURE__ */ jsx(Typography, { fontSize: "0.9em", fontWeight: "500", lineHeight: "1.4em", children: label || "Add game" })
      }
    ),
    /* @__PURE__ */ jsx(
      NewGameDialog,
      {
        open: openDialog,
        onClose: () => setOpenDialog(false),
        setGame
      }
    )
  ] });
}
export {
  LoadGameButton as default
};
