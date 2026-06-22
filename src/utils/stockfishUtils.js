/**
 * STOCKFISH UTILITIES
 * Helper functions for Stockfish UCI integration
 */

export const ENGINE_PROFILES = [
  {
    id: 'auto',
    label: 'Auto (recommended)',
    description: 'Prefers Stockfish 17 Lite, then falls back through compatible engines.',
  },
  {
    id: 'stockfish-17-lite',
    label: 'Stockfish 17 Lite',
    description: 'Same default engine profile used in ChessApp.',
  },
  {
    id: 'stockfish-17',
    label: 'Stockfish 17',
    description: 'Stronger but heavier local variant.',
  },
  {
    id: 'stockfish-16_1-lite',
    label: 'Stockfish 16.1 Lite',
    description: 'Legacy lighter profile for broader compatibility.',
  },
  {
    id: 'stockfish-16_1',
    label: 'Stockfish 16.1',
    description: 'Legacy full 16.1 profile.',
  },
  {
    id: 'stockfish-16-nnue',
    label: 'Stockfish 16 NNUE',
    description: 'Stockfish 16 network evaluation (NNUE enabled).',
  },
  {
    id: 'stockfish-16',
    label: 'Stockfish 16 Classic',
    description: 'Stockfish 16 with NNUE disabled.',
  },
  {
    id: 'stockfish-11',
    label: 'Stockfish 11',
    description: 'Oldest compatibility fallback profile.',
  },
];

export const DEFAULT_ENGINE_PROFILE = 'stockfish-17-lite';

export const DEFAULT_LIVE_EVAL_SETTINGS = {
  depth: 12,
  moveTime: 500,
};

export const DEFAULT_ANALYSIS_SETTINGS = {
  depth: 17,
  moveTime: 1000,
  multiPv: 3,
};

const clamp = (value, min, max, fallback) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, Math.round(num)));
};

export const clampLiveEvalSettings = (settings = {}) => ({
  depth: clamp(settings.depth, 6, 24, DEFAULT_LIVE_EVAL_SETTINGS.depth),
  moveTime: clamp(settings.moveTime, 100, 4000, DEFAULT_LIVE_EVAL_SETTINGS.moveTime),
});

export const clampAnalysisSettings = (settings = {}) => ({
  depth: clamp(settings.depth, 8, 26, DEFAULT_ANALYSIS_SETTINGS.depth),
  moveTime: clamp(settings.moveTime, 200, 8000, DEFAULT_ANALYSIS_SETTINGS.moveTime),
  multiPv: clamp(settings.multiPv, 1, 6, DEFAULT_ANALYSIS_SETTINGS.multiPv),
});

/**
 * Get difficulty parameters for Stockfish
 * @param {number} level - Difficulty level (1-10)
 * @returns {Object} - {skill, depth, moveTime}
 */
export const getDifficultySettings = (level) => {
  const settings = {
    1: { skill: 0, depth: 1, moveTime: 40 },     // Beginner
    2: { skill: 1, depth: 2, moveTime: 80 },
    3: { skill: 3, depth: 3, moveTime: 140 },    // Easy
    4: { skill: 5, depth: 5, moveTime: 240 },
    5: { skill: 8, depth: 8, moveTime: 400 },    // Medium
    6: { skill: 11, depth: 10, moveTime: 650 },
    7: { skill: 14, depth: 12, moveTime: 950 },  // Hard
    8: { skill: 16, depth: 14, moveTime: 1400 },
    9: { skill: 18, depth: 17, moveTime: 2000 }, // Expert
    10: { skill: 20, depth: 20, moveTime: 2800 } // Master
  };
  
  return settings[level] || settings[5]; // Default to medium
};

/**
 * Convert Stockfish eval to white win percentage (ChessApp-style curve).
 * @param {number|null|undefined} evaluation - Evaluation in pawns.
 * @param {number|null|undefined} mate - Mate score from engine.
 * @returns {number} White win percentage in [0, 100].
 */
export const getWhiteWinPercentage = (evaluation, mate) => {
  if (typeof mate === 'number' && mate !== 0) {
    return mate > 0 ? 100 : 0;
  }

  if (typeof evaluation !== 'number') return 50;

  // Engine output is already normalized to white perspective.
  const cp = Math.round(evaluation * 100);
  const cpClamped = Math.max(-1000, Math.min(1000, cp));

  // Same conversion used by the imported ChessApp helpers.
  const multiplier = -0.00368208;
  const winChances = 2 / (1 + Math.exp(multiplier * cpClamped)) - 1;
  return Math.max(0, Math.min(100, 50 + 50 * winChances));
};

/**
 * Build evaluation bar payload matching ChessApp behavior.
 * Label is unsigned ("M3", "1.8", "12") and side is conveyed by bar position.
 * @param {number|null|undefined} evaluation - Evaluation in pawns.
 * @param {number|null|undefined} mate - Mate score from engine.
 * @returns {{ whiteBarPercentage: number, label: string }}
 */
export const getChessAppEvalBarValue = (evaluation, mate) => {
  const whiteBarPercentage = getWhiteWinPercentage(evaluation, mate);

  if (typeof mate === 'number' && mate !== 0) {
    return {
      whiteBarPercentage,
      label: `M${Math.abs(mate)}`,
    };
  }

  if (typeof evaluation !== 'number') {
    return {
      whiteBarPercentage,
      label: '0.0',
    };
  }

  const absEval = Math.abs(evaluation);
  let label = absEval.toFixed(1);
  if (label.length > 3) {
    label = absEval.toFixed(0);
  }

  return {
    whiteBarPercentage,
    label,
  };
};


