import { jsx } from "react/jsx-runtime";
import { Icon } from "@iconify/react";
import { Chip, Tooltip } from "@mui/material";
function TimeControlChip({ timeControl }) {
  if (!timeControl) return null;
  return /* @__PURE__ */ jsx(Tooltip, { title: "Time Control", children: /* @__PURE__ */ jsx(
    Chip,
    {
      icon: /* @__PURE__ */ jsx(Icon, { icon: "material-symbols:timer-outline" }),
      label: timeControl,
      size: "small"
    }
  ) });
}
export {
  TimeControlChip as default
};
