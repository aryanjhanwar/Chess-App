import { jsx, jsxs } from "react/jsx-runtime";
import { Stack, Typography } from "@mui/material";
function PlayersMetric({
  title,
  whiteValue,
  blackValue
}) {
  return /* @__PURE__ */ jsxs(
    Stack,
    {
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "row",
      flexWrap: { xs: "wrap", sm: "nowrap" },
      rowGap: { xs: 0.8, sm: 0 },
      columnGap: { xs: "6vw", md: 10 },
      children: [
        /* @__PURE__ */ jsx(ValueBlock, { value: whiteValue, color: "white" }),
        /* @__PURE__ */ jsx(Typography, { align: "center", fontSize: { xs: "0.78em", sm: "0.8em" }, noWrap: false, children: title }),
        /* @__PURE__ */ jsx(ValueBlock, { value: blackValue, color: "black" })
      ]
    }
  );
}
const ValueBlock = ({
  value,
  color
}) => {
  return /* @__PURE__ */ jsx(
    Typography,
    {
      align: "center",
      sx: {
        backgroundColor: color,
        color: color === "white" ? "black" : "white"
      },
      borderRadius: "5px",
      lineHeight: "1em",
      fontSize: { xs: "0.82em", sm: "0.9em" },
      padding: 0.8,
      fontWeight: "500",
      border: "1px solid #424242",
      noWrap: true,
      children: value
    }
  );
};
export {
  PlayersMetric as default
};
