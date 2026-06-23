import { jsx } from "react/jsx-runtime";
import { getLineEvalLabel } from "@/shared/chess/analysis/chess";
function CustomTooltip({
  active,
  payload
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return /* @__PURE__ */ jsx(
    "div",
    {
      style: {
        backgroundColor: "#f0f0f0",
        padding: 5,
        color: "black",
        opacity: 0.9,
        border: "1px solid black",
        borderRadius: 3
      },
      children: getLineEvalLabel(data)
    }
  );
}
export {
  CustomTooltip as default
};
