import { jsx, jsxs } from "react/jsx-runtime";
import { FormControl, TextField, Button } from "@mui/material";
import { Icon } from "@iconify/react";
function GamePgnInput({ pgn, setPgn }) {
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileContent = e.target?.result;
      setPgn(fileContent);
    };
    reader.readAsText(file);
  };
  return /* @__PURE__ */ jsxs(FormControl, { fullWidth: true, children: [
    /* @__PURE__ */ jsx(
      TextField,
      {
        label: "Enter PGN here...",
        variant: "outlined",
        multiline: true,
        value: pgn,
        onChange: (e) => setPgn(e.target.value),
        rows: 8,
        sx: { mb: 2 }
      }
    ),
    /* @__PURE__ */ jsxs(
      Button,
      {
        variant: "contained",
        component: "label",
        startIcon: /* @__PURE__ */ jsx(Icon, { icon: "material-symbols:upload" }),
        children: [
          "Upload PGN File",
          /* @__PURE__ */ jsx("input", { type: "file", hidden: true, accept: ".pgn", onChange: handleFileChange })
        ]
      }
    )
  ] });
}
export {
  GamePgnInput as default
};
