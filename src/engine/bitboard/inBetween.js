/**
 * INBETWEEN BITBOARDS
 * Pre-computed table: INBETWEEN_BITBOARDS[sq1][sq2] = bitboard of all squares
 * on the line from sq1 to sq2, EXCLUSIVE of sq1 and INCLUSIVE of sq2.
 * Returns 0n for non-aligned squares or identical squares.
 *
 * Used for:
 * - Check masking: check_bitboard = INBETWEEN[king][checker]
 *     Includes checker for capture, intermediate squares for blocking
 * - Pin detection: INBETWEEN[king][attacker] & friendlyOcc
 *     0 bits = direct check, 1 bit = pin, 2+ = fully blocked
 * - Pin masking: pinned piece can only move to squares in INBETWEEN[king][pinner]
 */

import { SQUARE_BBS } from './constants.js';

/** @type {BigInt[][]} 64x64 table of between-bitboards */
export const INBETWEEN_BITBOARDS = Array.from({ length: 64 }, () => new Array(64).fill(0n));

/**
 * Initialize the INBETWEEN_BITBOARDS table.
 * Must be called once at engine startup (after magic init).
 */
export function initializeInBetweenBitboards() {
  for (let sq1 = 0; sq1 < 64; sq1++) {
    const r1 = sq1 >> 3;
    const f1 = sq1 & 7;

    for (let sq2 = 0; sq2 < 64; sq2++) {
      if (sq1 === sq2) continue; // already 0n

      const r2 = sq2 >> 3;
      const f2 = sq2 & 7;
      const dr = Math.sign(r2 - r1);
      const df = Math.sign(f2 - f1);

      // Must be aligned on rank, file, or diagonal
      const rankAligned = r1 === r2;
      const fileAligned = f1 === f2;
      const diagAligned = Math.abs(r2 - r1) === Math.abs(f2 - f1);

      if (!rankAligned && !fileAligned && !diagAligned) continue; // 0n

      // Walk from sq1 toward sq2 (exclusive of sq1, inclusive of sq2)
      let bb = 0n;
      let r = r1 + dr;
      let f = f1 + df;
      while (r >= 0 && r < 8 && f >= 0 && f < 8) {
        const sq = (r << 3) | f;
        bb |= SQUARE_BBS[sq];
        if (sq === sq2) break;
        r += dr;
        f += df;
      }

      INBETWEEN_BITBOARDS[sq1][sq2] = bb;
    }
  }
}
