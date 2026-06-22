/**
 * Pre-computed Attack Tables for Pieces
 * Knight, King, and Pawn attacks for all 64 squares
 * Converted from C++ enginecode.cpp constants.h
 */

import { FILE_A_BITBOARD, FILE_H_BITBOARD } from './constants.js';

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Check if square is on board
 */
function isValidSquare(rank, file) {
  return rank >= 0 && rank <= 7 && file >= 0 && file <= 7;
}

/**
 * Convert rank/file to square index
 * Square 0 = a8, Square 63 = h1
 * rank 0 = rank 8, rank 7 = rank 1
 */
function toSquare(rank, file) {
  return rank * 8 + file;
}

/**
 * Get rank from square (0 = rank 8, 7 = rank 1)
 */
function getRank(square) {
  return Math.floor(square / 8);
}

/**
 * Get file from square (0 = a-file, 7 = h-file)
 */
function getFile(square) {
  return square % 8;
}

// ========================================
// KNIGHT ATTACKS
// ========================================

/**
 * Generate knight attack bitboard for a square
 * Knight moves in L-shape: 2 squares in one direction, 1 in perpendicular
 */
function generateKnightAttacks(square) {
  const rank = getRank(square);
  const file = getFile(square);
  let attacks = 0n;
  
  // All 8 possible knight moves
  const moves = [
    [2, 1], [2, -1],   // 2 up, 1 left/right
    [-2, 1], [-2, -1], // 2 down, 1 left/right
    [1, 2], [1, -2],   // 1 up, 2 left/right
    [-1, 2], [-1, -2]  // 1 down, 2 left/right
  ];
  
  for (const [rankDelta, fileDelta] of moves) {
    const newRank = rank + rankDelta;
    const newFile = file + fileDelta;
    
    if (isValidSquare(newRank, newFile)) {
      const targetSquare = toSquare(newRank, newFile);
      attacks |= (1n << BigInt(targetSquare));
    }
  }
  
  return attacks;
}

/**
 * Pre-computed knight attacks for all 64 squares
 */
export const KNIGHT_ATTACKS = Array.from({ length: 64 }, (_, sq) => generateKnightAttacks(sq));

// ========================================
// KING ATTACKS
// ========================================

/**
 * Generate king attack bitboard for a square
 * King moves 1 square in any direction
 */
function generateKingAttacks(square) {
  const rank = getRank(square);
  const file = getFile(square);
  let attacks = 0n;
  
  // All 8 possible king moves
  const moves = [
    [1, 0], [-1, 0],   // up, down
    [0, 1], [0, -1],   // left, right
    [1, 1], [1, -1],   // diagonals up
    [-1, 1], [-1, -1]  // diagonals down
  ];
  
  for (const [rankDelta, fileDelta] of moves) {
    const newRank = rank + rankDelta;
    const newFile = file + fileDelta;
    
    if (isValidSquare(newRank, newFile)) {
      const targetSquare = toSquare(newRank, newFile);
      attacks |= (1n << BigInt(targetSquare));
    }
  }
  
  return attacks;
}

/**
 * Pre-computed king attacks for all 64 squares
 */
export const KING_ATTACKS = Array.from({ length: 64 }, (_, sq) => generateKingAttacks(sq));

// ========================================
// PAWN ATTACKS
// ========================================

/**
 * Generate white pawn attack bitboard for a square
 * White pawns attack diagonally upward (rank - 1)
 */
function generateWhitePawnAttacks(square) {
  const rank = getRank(square);
  const file = getFile(square);
  let attacks = 0n;
  
  // White pawns attack diagonally up-left and up-right
  const targetRank = rank - 1;
  
  if (targetRank >= 0) {
    // Up-left attack
    if (file > 0) {
      const targetSquare = toSquare(targetRank, file - 1);
      attacks |= (1n << BigInt(targetSquare));
    }
    
    // Up-right attack
    if (file < 7) {
      const targetSquare = toSquare(targetRank, file + 1);
      attacks |= (1n << BigInt(targetSquare));
    }
  }
  
  return attacks;
}

/**
 * Generate black pawn attack bitboard for a square
 * Black pawns attack diagonally downward (rank + 1)
 */
function generateBlackPawnAttacks(square) {
  const rank = getRank(square);
  const file = getFile(square);
  let attacks = 0n;
  
  // Black pawns attack diagonally down-left and down-right
  const targetRank = rank + 1;
  
  if (targetRank <= 7) {
    // Down-left attack
    if (file > 0) {
      const targetSquare = toSquare(targetRank, file - 1);
      attacks |= (1n << BigInt(targetSquare));
    }
    
    // Down-right attack
    if (file < 7) {
      const targetSquare = toSquare(targetRank, file + 1);
      attacks |= (1n << BigInt(targetSquare));
    }
  }
  
  return attacks;
}

/**
 * Pre-computed white pawn attacks for all 64 squares
 */
export const WHITE_PAWN_ATTACKS = Array.from({ length: 64 }, (_, sq) => generateWhitePawnAttacks(sq));

/**
 * Pre-computed black pawn attacks for all 64 squares
 */
export const BLACK_PAWN_ATTACKS = Array.from({ length: 64 }, (_, sq) => generateBlackPawnAttacks(sq));

// ========================================
// SLIDING PIECE MASKS (for magic bitboards later)
// ========================================

/**
 * Generate rook attack mask (no edges, used for magic bitboards)
 * Returns squares a rook can move to, excluding edge squares
 */
function generateRookMask(square) {
  const rank = getRank(square);
  const file = getFile(square);
  let mask = 0n;
  
  // North (up)
  for (let r = rank - 1; r > 0; r--) {
    mask |= (1n << BigInt(toSquare(r, file)));
  }
  
  // South (down)
  for (let r = rank + 1; r < 7; r++) {
    mask |= (1n << BigInt(toSquare(r, file)));
  }
  
  // East (right)
  for (let f = file + 1; f < 7; f++) {
    mask |= (1n << BigInt(toSquare(rank, f)));
  }
  
  // West (left)
  for (let f = file - 1; f > 0; f--) {
    mask |= (1n << BigInt(toSquare(rank, f)));
  }
  
  return mask;
}

/**
 * Generate bishop attack mask (no edges, used for magic bitboards)
 */
function generateBishopMask(square) {
  const rank = getRank(square);
  const file = getFile(square);
  let mask = 0n;
  
  // North-East
  for (let r = rank - 1, f = file + 1; r > 0 && f < 7; r--, f++) {
    mask |= (1n << BigInt(toSquare(r, f)));
  }
  
  // South-East
  for (let r = rank + 1, f = file + 1; r < 7 && f < 7; r++, f++) {
    mask |= (1n << BigInt(toSquare(r, f)));
  }
  
  // South-West
  for (let r = rank + 1, f = file - 1; r < 7 && f > 0; r++, f--) {
    mask |= (1n << BigInt(toSquare(r, f)));
  }
  
  // North-West
  for (let r = rank - 1, f = file - 1; r > 0 && f > 0; r--, f--) {
    mask |= (1n << BigInt(toSquare(r, f)));
  }
  
  return mask;
}

/**
 * Pre-computed rook masks for all 64 squares
 */
export const ROOK_MASKS = Array.from({ length: 64 }, (_, sq) => generateRookMask(sq));

/**
 * Pre-computed bishop masks for all 64 squares
 */
export const BISHOP_MASKS = Array.from({ length: 64 }, (_, sq) => generateBishopMask(sq));

// ========================================
// UTILITY: Get attack squares as array
// ========================================

/**
 * Convert attack bitboard to array of square indices
 */
export function getAttackSquares(attackBitboard) {
  const squares = [];
  let bb = attackBitboard;
  
  while (bb !== 0n) {
    const lsb = bb & -bb; // Isolate LSB
    
    // Alternative: use loop
    let sq = 0;
    let tempBb = lsb;
    while (tempBb > 1n) {
      tempBb >>= 1n;
      sq++;
    }
    
    squares.push(sq);
    bb &= bb - 1n; // Remove LSB
  }
  
  return squares;
}

// ========================================
// EXPORT SUMMARY
// ========================================

/**
 * Get statistics about attack tables
 */
export function getAttackTableStats() {
  return {
    knightAttacks: KNIGHT_ATTACKS.length,
    kingAttacks: KING_ATTACKS.length,
    whitePawnAttacks: WHITE_PAWN_ATTACKS.length,
    blackPawnAttacks: BLACK_PAWN_ATTACKS.length,
    rookMasks: ROOK_MASKS.length,
    bishopMasks: BISHOP_MASKS.length,
    totalTables: 6,
    totalEntries: 64 * 6
  };
}
