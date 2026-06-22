import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Icon } from "@iconify/react";
import {
  ClickAwayListener,
  Grid,
  IconButton,
  Slider as MuiSlider,
  Popover,
  Stack,
  styled,
  Typography
} from "@mui/material";
import { useState } from "react";
function Slider({
  min,
  max,
  label,
  value,
  setValue,
  size,
  marksFilter,
  step = 1,
  infoContent
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const handleOpenPopover = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClosePopover = () => {
    setAnchorEl(null);
  };
  return /* @__PURE__ */ jsxs(
    Grid,
    {
      container: true,
      justifyContent: "center",
      alignItems: "center",
      size: size ?? 11,
      children: [
        /* @__PURE__ */ jsxs(Stack, { direction: "row", width: "100%", children: [
          /* @__PURE__ */ jsx(Typography, { id: `input-${label}`, variant: "body2", children: step === 1 && marksFilter ? label : `${label}: ${value}` }),
          !!infoContent && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(ClickAwayListener, { onClickAway: handleClosePopover, children: /* @__PURE__ */ jsx(
              IconButton,
              {
                size: "medium",
                "aria-owns": anchorEl ? "mouse-over-popover" : void 0,
                "aria-haspopup": "true",
                onClick: handleOpenPopover,
                onMouseEnter: handleOpenPopover,
                onMouseLeave: handleClosePopover,
                sx: { ml: 1, padding: 0 },
                "aria-label": "Help about number of threads",
                children: /* @__PURE__ */ jsx(Icon, { icon: "mdi:info-outline", width: "1.1rem" })
              }
            ) }),
            /* @__PURE__ */ jsx(
              Popover,
              {
                id: "mouse-over-popover",
                open: !!anchorEl,
                anchorEl,
                onClose: handleClosePopover,
                anchorOrigin: { vertical: "bottom", horizontal: "center" },
                transformOrigin: { vertical: "top", horizontal: "center" },
                sx: { pointerEvents: "none" },
                disableRestoreFocus: true,
                children: /* @__PURE__ */ jsx(Typography, { variant: "body2", sx: { padding: 2, maxWidth: 500 }, children: infoContent })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          CustomSlider,
          {
            min,
            max,
            marks: marksFilter ? Array.from({ length: max - min + 1 }, (_, i) => ({
              value: i + min,
              label: `${i + min}`
            })).filter((_, i) => i % marksFilter === 0) : void 0,
            step,
            valueLabelDisplay: "off",
            value,
            onChange: (_, value2) => setValue(value2),
            "aria-labelledby": `input-${label}`
          }
        )
      ]
    }
  );
}
const CustomSlider = styled(MuiSlider)(() => ({
  ".MuiSlider-markLabel": {
    fontSize: "0.8rem",
    lineHeight: "0.8rem"
  },
  ".MuiSlider-thumb": {
    width: "18px",
    height: "18px"
  },
  marginBottom: "1rem"
}));
export {
  Slider as default
};

