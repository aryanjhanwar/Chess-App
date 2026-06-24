import { jsx } from "react/jsx-runtime";
import { Icon } from "@iconify/react";
import {
  engineDepthAtom,
  engineMultiPvAtom,
  engineNameAtom,
  engineWorkersNbAtom,
  evaluationProgressAtom,
  gameAtom,
  gameEvalAtom,
  savedEvalsAtom
} from "../states";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { getEvaluateGameParams } from "@/shared/chess/analysis/chess";
import { useGameDatabase } from "@analysis/hooks/useGameDatabase";
import { Button } from "@mui/material";
import { useEngine } from "@analysis/hooks/useEngine";
import { logAnalyticsEvent } from "@analysis/lib/firebase";
import { useEffect, useCallback } from "react";
import { usePlayersData } from "@analysis/hooks/usePlayersData";
import { Typography } from "@mui/material";
import { useCurrentPosition } from "../hooks/useCurrentPosition";
function AnalyzeButton() {
  const engineName = useAtomValue(engineNameAtom);
  const engine = useEngine(engineName);
  useCurrentPosition(engine);
  const engineWorkersNb = useAtomValue(engineWorkersNbAtom);
  const [evaluationProgress, setEvaluationProgress] = useAtom(
    evaluationProgressAtom
  );
  const engineDepth = useAtomValue(engineDepthAtom);
  const engineMultiPv = useAtomValue(engineMultiPvAtom);
  const { setGameEval, gameFromUrl } = useGameDatabase();
  const [gameEval, setEval] = useAtom(gameEvalAtom);
  const game = useAtomValue(gameAtom);
  const setSavedEvals = useSetAtom(savedEvalsAtom);
  const { white, black } = usePlayersData(gameAtom);
  const readyToAnalyse = engine?.getIsReady() && game.history().length > 0 && !evaluationProgress;
  const handleAnalyze = useCallback(async () => {
    const params = getEvaluateGameParams(game);
    if (!engine?.getIsReady() || params.fens.length === 0 || evaluationProgress) {
      return;
    }
    const newGameEval = await engine.evaluateGame({
      ...params,
      depth: engineDepth,
      multiPv: engineMultiPv,
      setEvaluationProgress,
      playersRatings: {
        white: white?.rating,
        black: black?.rating
      },
      workersNb: engineWorkersNb
    });
    setEval(newGameEval);
    setEvaluationProgress(0);
    if (gameFromUrl) {
      setGameEval(gameFromUrl.id, newGameEval);
    }
    const gameSavedEvals = params.fens.reduce((acc, fen, idx) => {
      acc[fen] = { ...newGameEval.positions[idx], engine: engineName };
      return acc;
    }, {});
    setSavedEvals((prev) => ({
      ...prev,
      ...gameSavedEvals
    }));
    logAnalyticsEvent("analyze_game", {
      engine: engineName,
      depth: engineDepth,
      multiPv: engineMultiPv,
      nbPositions: params.fens.length
    });
  }, [
    engine,
    engineName,
    engineWorkersNb,
    game,
    engineDepth,
    engineMultiPv,
    evaluationProgress,
    setEvaluationProgress,
    setEval,
    gameFromUrl,
    setGameEval,
    setSavedEvals,
    white.rating,
    black.rating
  ]);
  useEffect(() => {
    setEvaluationProgress(0);
  }, [engine, setEvaluationProgress]);
  useEffect(() => {
    if (!gameEval && readyToAnalyse) {
      handleAnalyze();
    }
  }, [gameEval, readyToAnalyse, handleAnalyze]);
  if (evaluationProgress) return null;
  return /* @__PURE__ */ jsx(
    Button,
    {
      variant: "contained",
      size: "small",
      startIcon: /* @__PURE__ */ jsx(Icon, { icon: "streamline:magnifying-glass-solid", height: 12 }),
      onClick: handleAnalyze,
      disabled: !readyToAnalyse,
      children: /* @__PURE__ */ jsx(Typography, { fontSize: "0.9em", fontWeight: "500", lineHeight: "1.4em", children: gameEval ? "Analyze again" : "Analyze" })
    }
  );
}
export {
  AnalyzeButton as default
};
