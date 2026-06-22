import { jsx } from "react/jsx-runtime";
import { Icon } from "@iconify/react";
import { Chip, Tooltip } from "@mui/material";
function DateChip({ date }) {
  if (!date) return null;
  return /* @__PURE__ */ jsx(Tooltip, { title: "Date Played", children: /* @__PURE__ */ jsx(
    Chip,
    {
      icon: /* @__PURE__ */ jsx(Icon, { icon: "material-symbols:calendar-today" }),
      label: date,
      size: "small"
    }
  ) });
}
export {
  DateChip as default
};
