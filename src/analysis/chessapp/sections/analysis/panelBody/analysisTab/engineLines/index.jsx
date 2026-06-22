import { jsx } from "react/jsx-runtime";
import { Grid, List } from "@mui/material";
import LineEvaluation from "./lineEvaluation";
import {
  boardAtom,
  currentPositionAtom,
  engineMultiPvAtom
} from "../../../states";
import { useAtomValue } from "jotai";
function EngineLines(props) {
  const board = useAtomValue(boardAtom);
  const linesNumber = useAtomValue(engineMultiPvAtom);
  const position = useAtomValue(currentPositionAtom);
  const linesSkeleton = Array.from({ length: linesNumber }).map(
    (_, i) => ({ pv: [`${i}`], depth: 0, multiPv: i + 1 })
  );
  const engineLines = position?.eval?.lines?.length ? position.eval.lines : linesSkeleton;
  if (board.isCheckmate()) return null;
  return /* @__PURE__ */ jsx(Grid, { container: true, justifyContent: "center", alignItems: "center", ...props, children: /* @__PURE__ */ jsx(List, { sx: { width: "95%", padding: 0 }, children: engineLines.map((line) => /* @__PURE__ */ jsx(LineEvaluation, { line }, line.multiPv)) }) });
}
export {
  EngineLines as default
};

