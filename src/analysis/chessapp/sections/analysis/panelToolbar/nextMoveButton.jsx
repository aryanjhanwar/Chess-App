import { jsx } from "react/jsx-runtime";
import { Icon } from "@iconify/react";
import { Grid, IconButton, Tooltip } from "@mui/material";
import { useAtomValue } from "jotai";
import { boardAtom, gameAtom } from "../states";
import { useChessActions } from "@analysis/hooks/useChessActions";
import { useCallback, useEffect, useMemo, useRef } from "react";
function NextMoveButton() {
  const { playMove: playBoardMove } = useChessActions(boardAtom);
  const game = useAtomValue(gameAtom);
  const board = useAtomValue(boardAtom);
  const gameHistory = useMemo(() => game.history(), [game]);
  const boardHistory = useMemo(() => board.history(), [board]);
  const gameHistoryVerbose = useMemo(() => game.history({ verbose: true }), [game]);
  const commentsByFen = useMemo(() => {
    const map = new Map();
    for (const c of game.getComments()) {
      map.set(c.fen, c.comment);
    }
    return map;
  }, [game]);
  const isButtonEnabled = boardHistory.length < gameHistory.length && gameHistory.slice(0, boardHistory.length).join() === boardHistory.join();
  const addNextGameMoveToBoard = useCallback((options = {}) => {
    if (!isButtonEnabled) return;
    const nextMoveIndex = boardHistory.length;
    const nextMove = gameHistoryVerbose[nextMoveIndex];
    const comment = nextMove ? commentsByFen.get(nextMove.after) : void 0;
    if (nextMove) {
      playBoardMove({
        from: nextMove.from,
        to: nextMove.to,
        promotion: nextMove.promotion,
        comment,
        muteSound: options.muteSound
      });
    }
  }, [boardHistory.length, commentsByFen, gameHistoryVerbose, isButtonEnabled, playBoardMove]);

  const lastKeyTimeRef = useRef(0);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        const now = Date.now();
        const isScrubbing = now - lastKeyTimeRef.current < 150;
        lastKeyTimeRef.current = now;
        addNextGameMoveToBoard({ muteSound: isScrubbing });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [addNextGameMoveToBoard]);
  return /* @__PURE__ */ jsx(Tooltip, { title: "Go to next move", children: /* @__PURE__ */ jsx(Grid, { children: /* @__PURE__ */ jsx(
    IconButton,
    {
      onClick: () => addNextGameMoveToBoard(),
      disabled: !isButtonEnabled,
      sx: { paddingX: 1.2, paddingY: 0.5 },
      children: /* @__PURE__ */ jsx(Icon, { icon: "ri:arrow-right-s-line", height: 30 })
    }
  ) }) });
}
export {
  NextMoveButton as default
};

