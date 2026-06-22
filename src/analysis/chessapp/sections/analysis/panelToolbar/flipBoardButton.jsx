import { jsx } from "react/jsx-runtime";
import { useSetAtom } from "jotai";
import { boardOrientationAtom } from "../states";
import { IconButton, Tooltip } from "@mui/material";
import { Icon } from "@iconify/react";
import { useEffect } from "react";
function FlipBoardButton() {
  const setBoardOrientation = useSetAtom(boardOrientationAtom);
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "f") {
        setBoardOrientation((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [setBoardOrientation]);
  return /* @__PURE__ */ jsx(Tooltip, { title: "Flip board", children: /* @__PURE__ */ jsx(
    IconButton,
    {
      onClick: () => setBoardOrientation((prev) => !prev),
      sx: { paddingX: 1.2, paddingY: 0.5 },
      children: /* @__PURE__ */ jsx(Icon, { icon: "eva:flip-fill" })
    }
  ) });
}
export {
  FlipBoardButton as default
};
