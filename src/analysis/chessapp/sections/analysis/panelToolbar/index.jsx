import { jsx, jsxs } from "react/jsx-runtime";
import { Grid, IconButton, Tooltip } from "@mui/material";
import { Icon } from "@iconify/react";
import { useAtomValue } from "jotai";
import { boardAtom, gameAtom } from "../states";
import { useChessActions } from "@analysis/hooks/useChessActions";
import FlipBoardButton from "./flipBoardButton";
import NextMoveButton from "./nextMoveButton";
import GoToLastPositionButton from "./goToLastPositionButton";
import SaveButton from "./saveButton";
import { useEffect, useRef } from "react";
function PanelToolBar() {
  const board = useAtomValue(boardAtom);
  const { resetToStartingPosition: resetBoard, undoMove: undoBoardMove } = useChessActions(boardAtom);
  const boardHistoryLength = board.history().length;
  const game = useAtomValue(gameAtom);
  const toolbarButtonSx = {
    paddingX: 1.2,
    paddingY: 0.5,
    color: "#ecfeff",
    borderRadius: 1.5,
    transition: "all 120ms ease",
    '&:hover': {
      backgroundColor: "rgba(34, 211, 238, 0.18)",
      color: "#a5f3fc"
    }
  };
  const lastKeyTimeRef = useRef(0);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (boardHistoryLength === 0) return;
      const now = Date.now();
      const isScrubbing = now - lastKeyTimeRef.current < 150;
      lastKeyTimeRef.current = now;
      
      if (e.key === "ArrowLeft") {
        undoBoardMove({ muteSound: isScrubbing });
      } else if (e.key === "ArrowDown") {
        resetBoard();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [boardHistoryLength, resetBoard, undoBoardMove]);
  return /* @__PURE__ */ jsxs(Grid, { container: true, justifyContent: "center", alignItems: "center", size: 12, children: [
    /* @__PURE__ */ jsx(FlipBoardButton, {}),
    /* @__PURE__ */ jsx(Tooltip, { title: "Reset board", children: /* @__PURE__ */ jsx(Grid, { children: /* @__PURE__ */ jsx(
      IconButton,
      {
        onClick: () => resetBoard(),
        disabled: boardHistoryLength === 0,
        sx: toolbarButtonSx,
        children: /* @__PURE__ */ jsx(Icon, { icon: "ri:skip-back-line" })
      }
    ) }) }),
    /* @__PURE__ */ jsx(Tooltip, { title: "Go to previous move", children: /* @__PURE__ */ jsx(Grid, { children: /* @__PURE__ */ jsx(
      IconButton,
      {
        onClick: () => undoBoardMove(),
        disabled: boardHistoryLength === 0,
        sx: toolbarButtonSx,
        children: /* @__PURE__ */ jsx(Icon, { icon: "ri:arrow-left-s-line", height: 30 })
      }
    ) }) }),
    /* @__PURE__ */ jsx(NextMoveButton, {}),
    /* @__PURE__ */ jsx(GoToLastPositionButton, {}),
    /* @__PURE__ */ jsx(Tooltip, { title: "Copy pgn", children: /* @__PURE__ */ jsx(Grid, { children: /* @__PURE__ */ jsx(
      IconButton,
      {
        disabled: game.history().length === 0,
        onClick: () => {
          navigator.clipboard?.writeText?.(game.pgn());
        },
        sx: toolbarButtonSx,
        children: /* @__PURE__ */ jsx(Icon, { icon: "ri:clipboard-line" })
      }
    ) }) }),
    /* @__PURE__ */ jsx(SaveButton, {})
  ] });
}
export {
  PanelToolBar as default
};

