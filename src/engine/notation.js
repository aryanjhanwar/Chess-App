/**
 * Algebraic Notation (bitboard-native)
 *
 * Accepts a Position + v2 Move object directly.
 * Disambiguation uses bitboard piece lookups + attack tables.
 */

import { KNIGHT_ATTACKS } from './bitboard/attacks.js';
import { getRookAttacks, getBishopAttacks, getQueenAttacks } from './bitboard/magic.js';
import { SQUARE_BBS, WP, WN, WB, WR, WQ, WK, BP, BN, BB, BR, BQ, BK } from './bitboard/constants.js';
import { bitScanForward } from './bitboard/utils.js';

const FILE_CHARS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANK_CHARS = ['8', '7', '6', '5', '4', '3', '2', '1'];

// Piece letter for notation (pawns = '')
const PIECE_LETTER = {
  [WN]: 'N', [WB]: 'B', [WR]: 'R', [WQ]: 'Q', [WK]: 'K',
  [BN]: 'N', [BB]: 'B', [BR]: 'R', [BQ]: 'Q', [BK]: 'K',
  [WP]: '', [BP]: '',
};

// Promotion piece tag → letter
const PROMO_SETS = {
  Q: new Set([10, 14, 18, 22]),  // TAG_BQueenPromo, TAG_WQueenPromo, TAG_BCapQP, TAG_WCapQP
  R: new Set([11, 15, 19, 23]),
  B: new Set([9, 13, 17, 21]),
  N: new Set([8, 12, 16, 20]),
};
function getPromoLetter(tag) {
  for (const [letter, s] of Object.entries(PROMO_SETS)) {
    if (s.has(tag)) return letter;
  }
  return null;
}

// Tag sets
const CASTLING_TAGS = new Set([4, 5, 6, 7]);
const EP_TAGS = new Set([2, 3]);
const ALL_PROMO_TAGS = new Set([8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23]);
const CAPTURE_TAGS = new Set([1, 27]); // TAG_CAPTURE, TAG_CHECK_CAPTURE

function isCapture(tag) {
  return CAPTURE_TAGS.has(tag) || EP_TAGS.has(tag) ||
         tag === 16 || tag === 17 || tag === 18 || tag === 19 ||
         tag === 20 || tag === 21 || tag === 22 || tag === 23;
}

/**
 * Get the attack bitboard for a piece on a square, given occupancy.
 * Used for disambiguation: which other same-type piece can also reach `toSq`?
 */
function getAttacksForPiece(piece, sq, occ) {
  switch (piece) {
    case WN: case BN: return KNIGHT_ATTACKS[sq];
    case WB: case BB: return getBishopAttacks(sq, occ);
    case WR: case BR: return getRookAttacks(sq, occ);
    case WQ: case BQ: return getQueenAttacks(sq, occ);
    default: return 0n;
  }
}

/**
 * Compute disambiguation prefix for a piece move.
 * Checks if another piece of the same type can also reach the target square.
 */
function getDisambiguation(position, fromSq, toSq, piece) {
  // Pawns and kings never need disambiguation
  if (piece === WP || piece === BP || piece === WK || piece === BK) return '';

  const samePieceBB = position.bitboards[piece] & ~SQUARE_BBS[fromSq]; // other pieces of same type
  if (samePieceBB === 0n) return ''; // only one of this piece type

  const occ = position.allOccupancy;
  const toSqBB = SQUARE_BBS[toSq];

  // Check each other same-type piece
  const ambiguous = [];
  let bb = samePieceBB;
  while (bb !== 0n) {
    const otherSq = bitScanForward(bb);
    bb &= bb - 1n;
    // Can this other piece attack the target square?
    if (getAttacksForPiece(piece, otherSq, occ) & toSqBB) {
      ambiguous.push(otherSq);
    }
  }

  if (ambiguous.length === 0) return '';

  const fromFile = fromSq & 7;
  const fromRank = fromSq >> 3;

  const sameFile = ambiguous.some(sq => (sq & 7) === fromFile);
  if (!sameFile) return FILE_CHARS[fromFile];

  const sameRank = ambiguous.some(sq => (sq >> 3) === fromRank);
  if (!sameRank) return RANK_CHARS[fromRank];

  return FILE_CHARS[fromFile] + RANK_CHARS[fromRank];
}

/**
 * Generate base algebraic notation for a v2 move, given the Position BEFORE the move.
 * Does NOT append +/# — the engine does that after checking post-move state.
 *
 * @param {Position} position — position BEFORE the move
 * @param {{ from:number, to:number, piece:number, tag:number }} move — v2 move
 * @returns {string} — e.g. "Nf3", "exd5", "O-O", "e8=Q"
 */
export function getNotationV2(position, move) {
  const { from, to, piece, tag } = move;
  const toFile = FILE_CHARS[to & 7];
  const toRank = RANK_CHARS[to >> 3];

  // ── Castling ──────────────────────────────────────────────────
  if (CASTLING_TAGS.has(tag)) {
    return (to & 7) === 6 ? 'O-O' : 'O-O-O';   // g-file = kingside
  }

  const cap = isCapture(tag);
  const promo = getPromoLetter(tag);
  const isPawn = piece === WP || piece === BP;

  // ── Pawns ─────────────────────────────────────────────────────
  if (isPawn) {
    let notation = '';
    if (cap) {
      notation = FILE_CHARS[from & 7] + 'x' + toFile + toRank;
    } else {
      notation = toFile + toRank;
    }
    if (promo) notation += '=' + promo;
    if (EP_TAGS.has(tag)) notation += ' e.p.';
    return notation;
  }

  // ── Pieces ────────────────────────────────────────────────────
  let notation = PIECE_LETTER[piece];
  notation += getDisambiguation(position, from, to, piece);
  if (cap) notation += 'x';
  notation += toFile + toRank;
  return notation;
}


