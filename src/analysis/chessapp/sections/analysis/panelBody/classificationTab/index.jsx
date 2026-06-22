import { jsx, jsxs } from "react/jsx-runtime";
import { Grid } from "@mui/material";
import MovesPanel from "./movesPanel";
import MovesClassificationsRecap from "./movesClassificationsRecap";
function ClassificationTab(props) {
  return /* @__PURE__ */ jsxs(
    Grid,
    {
      container: true,
      justifyContent: "center",
      alignItems: "stretch",
      flexDirection: "row",
      flexWrap: "nowrap",
      size: 12,
      flexGrow: 1,
      minHeight: 0,
      gap: 1,
      ...props,
      sx: props.hidden
        ? { display: "none" }
        : {
            minHeight: 0,
            overflowX: "auto",
            ...props.sx
          },
      children: [
        /* @__PURE__ */ jsx(MovesPanel, {}),
        /* @__PURE__ */ jsx(MovesClassificationsRecap, {})
      ]
    }
  );
}
export {
  ClassificationTab as default
};

