/**
 * Chess Engine — Public API
 *
 * Single entry point for the bitboard engine.
 * All React code should import from here, not from bitboard/ submodules directly.
 */

// ── Position ────────────────────────────────────────────────────────
export { createStartingPosition, createPositionFromFEN } from './bitboard/position.js';

// ── Move generation ─────────────────────────────────────────────────
export {
  generateLegalMoves_v2 as generateLegalMoves,
  makeMove_v2 as makeMove,
  unmakeMove_v2 as unmakeMove,
  isInCheck,
} from './bitboard/moveGen.js';

// ── Notation ────────────────────────────────────────────────────────
export { getNotationV2 as getMoveNotation } from './notation.js';

// ── PGN ─────────────────────────────────────────────────────────────
export { generatePGN, getPGNResult, formatPGNTimeControl } from './pgn.js';

// ── Initialization ──────────────────────────────────────────────────
export { initBitboardEngine } from './bitboard/init.js';

// ── Constants (re-exported for convenience) ─────────────────────────
export {
  WP, WN, WB, WR, WQ, WK,
  BP, BN, BB, BR, BQ, BK,
  TAG_NONE, TAG_CAPTURE,
  TAG_WHITEEP, TAG_BLACKEP,
  TAG_WCASTLEKS, TAG_WCASTLEQS, TAG_BCASTLEKS, TAG_BCASTLEQS,
  TAG_DoublePawnWhite, TAG_DoublePawnBlack,
  TAG_CHECK, TAG_CHECK_CAPTURE,
  SQUARE_NAMES,
} from './bitboard/constants.js';

// ── Utilities ───────────────────────────────────────────────────────
export { bitScanForward, countBits } from './bitboard/utils.js';

