import { jsx, jsxs } from "react/jsx-runtime";
import { LINEAR_PROGRESS_BAR_COLOR } from "@analysis/constants";
import {
  Grid,
  LinearProgress,
  Typography,
  linearProgressClasses
} from "@mui/material";
const LinearProgressBar = (props) => {
  if (props.value === 0) return null;
  return /* @__PURE__ */ jsxs(
    Grid,
    {
      container: true,
      alignItems: "center",
      justifyContent: "center",
      wrap: "nowrap",
      width: "90%",
      columnGap: 2,
      size: 12,
      children: [
        /* @__PURE__ */ jsx(Typography, { variant: "caption", align: "center", children: props.label }),
        /* @__PURE__ */ jsx(Grid, { sx: { width: "100%" }, children: /* @__PURE__ */ jsx(
          LinearProgress,
          {
            variant: "determinate",
            ...props,
            sx: (theme) => ({
              borderRadius: "5px",
              height: "5px",
              [`&.${linearProgressClasses.colorPrimary}`]: {
                backgroundColor: theme.palette.grey[theme.palette.mode === "light" ? 200 : 700]
              },
              [`& .${linearProgressClasses.bar}`]: {
                borderRadius: 5,
                backgroundColor: LINEAR_PROGRESS_BAR_COLOR
              }
            })
          }
        ) }),
        /* @__PURE__ */ jsx(Grid, { children: /* @__PURE__ */ jsx(Typography, { variant: "body2", color: "text.secondary", children: `${Math.round(
          props.value
        )}%` }) })
      ]
    }
  );
};
var stdin_default = LinearProgressBar;
export {
  stdin_default as default
};

