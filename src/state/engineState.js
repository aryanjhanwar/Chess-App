/**
 * src/state/engineState.js
 *
 * Jotai atoms for Stockfish engine evaluation state.
 * Components reading these atoms will re-render only when the specific
 * evaluation data they care about changes.
 */

import { atom } from 'jotai';

// ── Engine evaluation output ──────────────────────────────────────────────────

/**
 * The latest evaluation from the Stockfish engine.
 * Updated by the engine hooks after each depth iteration.
 */
export const engineEvaluationAtom = atom({
  /** Centipawn evaluation from White's perspective (null when not yet calculated). */
  evalValue: null,
  /** Mate-in-N from White's perspective (null if not a forced mate line). */
  mateValue: null,
  /** Current search depth reached. */
  depth: 0,
  /** True while the engine is actively searching. */
  isThinking: false,
  /** Best move in UCI format (e.g. "e2e4"). */
  bestMove: null,
  /** Principal variation lines (multi-PV). Array of { moves[], eval, mate, depth }. */
  pvLines: [],
  /** The path of the currently active engine worker file. */
  activeEnginePath: '',
});

// Convenience derived atoms for components that only need one value:

/** True while the engine is searching for a best move. */
export const isEngineThinkingAtom = atom((get) => get(engineEvaluationAtom).isThinking);

/** Centipawn evaluation value, or null. */
export const evalValueAtom = atom((get) => get(engineEvaluationAtom).evalValue);

/** Mate-in-N value, or null. */
export const mateValueAtom = atom((get) => get(engineEvaluationAtom).mateValue);

/** Current search depth. */
export const engineDepthAtom = atom((get) => get(engineEvaluationAtom).depth);

// ── Modal controller ──────────────────────────────────────────────────────────

/**
 * Which modal is currently open across the app.
 * Set to null to close all modals.
 *
 * Valid values: 'settings' | 'game-settings' | 'game-over' | 'draw-offer' | null
 */
export const activeModalAtom = atom(null);
