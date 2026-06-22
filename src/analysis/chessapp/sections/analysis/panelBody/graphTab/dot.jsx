import { jsx } from "react/jsx-runtime";
import { CLASSIFICATION_COLORS } from "@analysis/constants";
function CustomDot({
  cx,
  cy,
  r,
  payload
}) {
  const moveColor = payload?.moveClassification ? CLASSIFICATION_COLORS[payload.moveClassification] : "grey";
  return /* @__PURE__ */ jsx(
    "circle",
    {
      cx,
      cy,
      r,
      stroke: moveColor,
      strokeWidth: 5,
      fill: moveColor,
      fillOpacity: 1
    }
  );
}
export {
  CustomDot as default
};
