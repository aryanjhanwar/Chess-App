import { jsx } from "react/jsx-runtime";
import LoadGameButton from "../../loadGame/loadGameButton";
import { useCallback, useEffect } from "react";
import { useChessActions } from "@analysis/hooks/useChessActions";
import {
  boardAtom,
  boardOrientationAtom,
  evaluationProgressAtom,
  gameAtom,
  gameEvalAtom
} from "../states";
import { useGameDatabase } from "@analysis/hooks/useGameDatabase";
import { useAtomValue, useSetAtom } from "jotai";
import { Chess } from "chess.js";
import { useRouter } from "@analysis/shims/router";
import { fetchLichessGame } from "@analysis/lib/lichess";
const ANALYSIS_HANDOFF_KEY = "chessapp_analysis_handoff_v1";
function LoadGame() {
  const router = useRouter();
  const game = useAtomValue(gameAtom);
  const { setPgn: setGamePgn } = useChessActions(gameAtom);
  const { resetToStartingPosition: resetBoard, goToMove: goToBoardMove } = useChessActions(boardAtom);
  const { gameFromUrl } = useGameDatabase();
  const setEval = useSetAtom(gameEvalAtom);
  const setBoardOrientation = useSetAtom(boardOrientationAtom);
  const evaluationProgress = useAtomValue(evaluationProgressAtom);
  const resetAndSetGamePgn = useCallback(
    (pgn, orientation, gameEval, targetPly) => {
      const gameFromPgn = new Chess();
      gameFromPgn.loadPgn(pgn);
      resetBoard(pgn);
      setEval(gameEval);
      setGamePgn(pgn);
      setBoardOrientation(orientation ?? true);

      const safeTargetPly = Number.isInteger(targetPly)
        ? Math.max(0, Math.min(targetPly, gameFromPgn.history().length))
        : null;
      if (safeTargetPly !== null) {
        goToBoardMove(safeTargetPly, gameFromPgn);
      }
    },
    [goToBoardMove, resetBoard, setGamePgn, setEval, setBoardOrientation]
  );
  const { lichessGameId, orientation: orientationParam } = router.query;
  useEffect(() => {
    const handoffRaw = window.localStorage.getItem(ANALYSIS_HANDOFF_KEY);
    if (handoffRaw) {
      try {
        const payload = JSON.parse(handoffRaw);
        if (payload?.pgn) {
          const targetPly = Number.isInteger(payload.targetPly) ? payload.targetPly : null;
          resetAndSetGamePgn(payload.pgn, payload.orientation !== "black", void 0, targetPly);
          window.localStorage.removeItem(ANALYSIS_HANDOFF_KEY);
          return;
        }
      } catch (error) {
        console.error("Failed to parse analysis handoff payload:", error);
      }
      window.localStorage.removeItem(ANALYSIS_HANDOFF_KEY);
    }

    const handleLichess = async (id) => {
      const res = await fetchLichessGame(id);
      if (typeof res === "string") {
        resetAndSetGamePgn(res, orientationParam !== "black");
      }
    };
    if (gameFromUrl) {
      const orientation = !(gameFromUrl.site === "Chesskit.org" && gameFromUrl.black.name === "You");
      resetAndSetGamePgn(gameFromUrl.pgn, orientation, gameFromUrl.eval);
    } else if (typeof lichessGameId === "string" && !!lichessGameId) {
      handleLichess(lichessGameId);
    }
  }, [gameFromUrl, lichessGameId, orientationParam, resetAndSetGamePgn]);
  useEffect(() => {
    const eventHandler = (event) => {
      try {
        if (!event?.data?.pgn) return;
        const { pgn, orientation } = event.data;
        resetAndSetGamePgn(pgn, orientation !== "black");
      } catch (error) {
        console.error("Error processing message event:", error);
      }
    };
    window.addEventListener("message", eventHandler);
    return () => {
      window.removeEventListener("message", eventHandler);
    };
  }, [resetAndSetGamePgn]);
  const isGameLoaded = gameFromUrl !== void 0 || !!game.getHeaders().White && game.getHeaders().White !== "?" || game.history().length > 0;
  if (evaluationProgress) return null;
  return /* @__PURE__ */ jsx(
    LoadGameButton,
    {
      label: isGameLoaded ? "Load another game" : "Load game",
      size: "small",
      setGame: async (game2) => {
        await router.replace(
          {
            query: {},
            pathname: router.pathname
          },
          void 0,
          { shallow: true, scroll: false }
        );
        resetAndSetGamePgn(game2.pgn());
      }
    }
  );
}
export {
  LoadGame as default
};
