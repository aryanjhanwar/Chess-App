import { jsx } from "react/jsx-runtime";
import { Icon } from "@iconify/react";
import { Chip, Tooltip } from "@mui/material";
function MovesNbChip({ movesNb }) {
  if (!movesNb) return null;
  return /* @__PURE__ */ jsx(Tooltip, { title: "Number of Moves", sx: { overflow: "hidden" }, children: /* @__PURE__ */ jsx(
    Chip,
    {
      icon: /* @__PURE__ */ jsx(Icon, { icon: "heroicons:hashtag-20-solid" }),
      label: `${Math.ceil(movesNb / 2)} moves`,
      size: "small"
    }
  ) });
}
export {
  MovesNbChip as default
};
