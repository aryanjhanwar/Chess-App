import { jsx } from "react/jsx-runtime";
import { Icon } from "@iconify/react";
import { Grid, IconButton, Tooltip } from "@mui/material";
import { useAtomValue } from "jotai";
import { boardAtom, gameAtom } from "../states";
import { useChessActions } from "@analysis/hooks/useChessActions";
import { useEffect } from "react";
function GoToLastPositionButton() {
  const { setPgn: setBoardPgn } = useChessActions(boardAtom);
  const game = useAtomValue(gameAtom);
  const board = useAtomValue(boardAtom);
  const gameHistory = game.history();
  const boardHistory = board.history();
  const isButtonDisabled = boardHistory.length >= gameHistory.length;
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "ArrowUp") {
        if (isButtonDisabled) return;
        setBoardPgn(game.pgn());
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isButtonDisabled, setBoardPgn, game]);
  return /* @__PURE__ */ jsx(Tooltip, { title: "Go to final position", children: /* @__PURE__ */ jsx(Grid, { children: /* @__PURE__ */ jsx(
    IconButton,
    {
      onClick: () => {
        if (isButtonDisabled) return;
        setBoardPgn(game.pgn());
      },
      disabled: isButtonDisabled,
      sx: { paddingX: 1.2, paddingY: 0.5 },
      children: /* @__PURE__ */ jsx(Icon, { icon: "ri:skip-forward-line" })
    }
  ) }) });
}
export {
  GoToLastPositionButton as default
};

