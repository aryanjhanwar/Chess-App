import { Fragment, jsx } from "react/jsx-runtime";
import { useGameDatabase } from "@analysis/hooks/useGameDatabase";
import { Icon } from "@iconify/react";
import { Grid, IconButton, Tooltip } from "@mui/material";
import { useAtomValue } from "jotai";
import { useRouter } from "@analysis/shims/router";
import { boardAtom, gameAtom, gameEvalAtom } from "../states";
import { getGameToSave } from "@/shared/chess/analysis/chess";
function SaveButton() {
  const game = useAtomValue(gameAtom);
  const board = useAtomValue(boardAtom);
  const gameEval = useAtomValue(gameEvalAtom);
  const { addGame, setGameEval, gameFromUrl } = useGameDatabase();
  const router = useRouter();
  const enableSave = !gameFromUrl && (board.history().length || game.history().length);
  const handleSave = async () => {
    if (!enableSave) return;
    const gameToSave = getGameToSave(game, board);
    const gameId = await addGame(gameToSave);
    if (gameEval) {
      await setGameEval(gameId, gameEval);
    }
    router.replace(
      {
        query: { gameId },
        pathname: router.pathname
      },
      void 0,
      { shallow: true, scroll: false }
    );
  };
  return /* @__PURE__ */ jsx(Fragment, { children: gameFromUrl ? /* @__PURE__ */ jsx(Tooltip, { title: "Game saved in database", children: /* @__PURE__ */ jsx(Grid, { children: /* @__PURE__ */ jsx(IconButton, { disabled: true, sx: { paddingX: 1.2, paddingY: 0.5 }, children: /* @__PURE__ */ jsx(Icon, { icon: "ri:folder-check-line" }) }) }) }) : /* @__PURE__ */ jsx(Tooltip, { title: "Save game", children: /* @__PURE__ */ jsx(Grid, { children: /* @__PURE__ */ jsx(
    IconButton,
    {
      onClick: handleSave,
      disabled: !enableSave,
      sx: { paddingX: 1.2, paddingY: 0.5 },
      children: /* @__PURE__ */ jsx(Icon, { icon: "ri:save-3-line" })
    }
  ) }) }) });
}
export {
  SaveButton as default
};

