import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Fab } from "@mui/material";
import { useState } from "react";
import EngineSettingsDialog from "./EngineSettingsModal";
import { Icon } from "@iconify/react";
function EngineSettingsButton() {
  const [openDialog, setOpenDialog] = useState(false);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      Fab,
      {
        title: "Engine settings",
        color: "secondary",
        size: "small",
        sx: {
          top: "auto",
          right: 16,
          bottom: 16,
          left: "auto",
          position: "fixed"
        },
        onClick: () => setOpenDialog(true),
        children: /* @__PURE__ */ jsx(Icon, { icon: "mdi:settings", height: 20 })
      }
    ),
    /* @__PURE__ */ jsx(
      EngineSettingsDialog,
      {
        open: openDialog,
        onClose: () => setOpenDialog(false)
      }
    )
  ] });
}
export {
  EngineSettingsButton as default
};
