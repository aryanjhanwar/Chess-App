import { Chess } from 'chess.js';

export const createAnalysisState = () => ({
  gameEval: undefined,
  game: new Chess(),
  board: new Chess(),
  currentPosition: {},
  boardOrientationWhite: true,
  showBestMoveArrow: true,
  showPlayerMoveIcon: true,
  engineName: 'stockfish17',
  engineDepth: 14,
  engineMultiPv: 3,
  engineWorkersNb:
    typeof navigator !== 'undefined' && navigator.hardwareConcurrency
      ? Math.max(1, Math.round(navigator.hardwareConcurrency - 2))
      : 2,
  evaluationProgress: 0,
  savedEvals: {},
});
