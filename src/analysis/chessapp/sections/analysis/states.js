import { DEFAULT_ENGINE } from "@analysis/constants";
import { getRecommendedWorkersNb } from "@/shared/chess/stockfish/worker";
import { Chess } from "chess.js";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
const gameEvalAtom = atom(void 0);
const gameAtom = atom(new Chess());
const boardAtom = atom(new Chess());
const currentPositionAtom = atom({});
const boardOrientationAtom = atom(true);
const showBestMoveArrowAtom = atom(true);
const showPlayerMoveIconAtom = atom(true);
const engineNameAtom = atom(DEFAULT_ENGINE);
const engineDepthAtom = atom(14);
const engineMultiPvAtom = atom(3);
const engineWorkersNbAtom = atomWithStorage(
  "engineWorkersNb",
  getRecommendedWorkersNb()
);
const evaluationProgressAtom = atom(0);
const savedEvalsAtom = atom({});
export {
  boardAtom,
  boardOrientationAtom,
  currentPositionAtom,
  engineDepthAtom,
  engineMultiPvAtom,
  engineNameAtom,
  engineWorkersNbAtom,
  evaluationProgressAtom,
  gameAtom,
  gameEvalAtom,
  savedEvalsAtom,
  showBestMoveArrowAtom,
  showPlayerMoveIconAtom
};
