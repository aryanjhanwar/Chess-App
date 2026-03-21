/**
 * Bitboard Utility Functions
 * Core BigInt operations for 64-bit bitboards
 * Converted from C++ enginecode.cpp
 */

import { MAGIC, DEBRUIJN64, SQUARE_BBS } from './constants.js';

// ========================================
// BIT MANIPULATION
// ========================================

/**
 * Set a bit at given square (0-63)
 * @param {bigint} bitboard - Current bitboard
 * @param {number} square - Square index (0-63)
 * @returns {bigint} - Updated bitboard
 */
export function setBit(bitboard, square) {
  return bitboard | (1n << BigInt(square));
}

/**
 * Get bit value at given square
 * @param {bigint} bitboard - Current bitboard
 * @param {number} square - Square index (0-63)
 * @returns {boolean} - True if bit is set
 */
export function getBit(bitboard, square) {
  return (bitboard & (1n << BigInt(square))) !== 0n;
}

/**
 * Clear (pop) a bit at given square
 * @param {bigint} bitboard - Current bitboard
 * @param {number} square - Square index (0-63)
 * @returns {bigint} - Updated bitboard
 */
export function popBit(bitboard, square) {
  return bitboard & ~(1n << BigInt(square));
}

/**
 * Toggle a bit at given square
 * @param {bigint} bitboard - Current bitboard
 * @param {number} square - Square index (0-63)
 * @returns {bigint} - Updated bitboard
 */
export function toggleBit(bitboard, square) {
  return bitboard ^ (1n << BigInt(square));
}

// ========================================
// BITSCAN (Find piece positions)
// ========================================

/**
 * Bitscan Forward - Find index of LSB (Least Significant Bit)
 * Converted from C++: BitscanForward
 * Uses DeBruijn multiplication for O(1) lookup
 * 
 * @param {bigint} bitboard - Bitboard to scan
 * @returns {number} - Square index (0-63) or 64 if empty
 */
export function bitScanForward(bitboard) {
  if (bitboard === 0n) return 64; // NO_SQUARE
  
  // DeBruijn algorithm: DEBRUIJN64[(MAGIC * (bb ^ (bb - 1))) >> 58 & 0x3F]
  const isolated = bitboard ^ (bitboard - 1n);
  const hash = (MAGIC * isolated) >> 58n;
  // Mask to 6 bits (0-63) to ensure valid index
  const index = Number(hash & 0x3Fn);
  
  return DEBRUIJN64[index];
}

/**
 * Bitscan Forward and Pop - Find LSB and remove it
 * @param {bigint} bitboard - Bitboard to scan
 * @returns {{ square: number, bitboard: bigint }}
 */
export function bitScanForwardPop(bitboard) {
  const square = bitScanForward(bitboard);
  const newBitboard = bitboard & (bitboard - 1n); // Remove LSB
  return { square, bitboard: newBitboard };
}

/**
 * Alternative: Pop LSB without finding index
 * @param {bigint} bitboard - Bitboard
 * @returns {bigint} - Bitboard with LSB removed
 */
export function popLSB(bitboard) {
  return bitboard & (bitboard - 1n);
}

// ========================================
// BIT COUNTING
// ========================================

/**
 * Count number of set bits (population count)
 * JavaScript equivalent of __builtin_popcountll
 * 
 * @param {bigint} bitboard - Bitboard to count
 * @returns {number} - Number of set bits
 */
export function countBits(bitboard) {
  let count = 0;
  let bb = bitboard;
  
  // Brian Kernighan's algorithm
  while (bb !== 0n) {
    bb &= bb - 1n; // Remove LSB
    count++;
  }
  
  return count;
}

/**
 * Alternative: Get all square indices from bitboard
 * @param {bigint} bitboard - Bitboard
 * @returns {number[]} - Array of square indices
 */
export function getSetBits(bitboard) {
  const squares = [];
  let bb = bitboard;
  
  while (bb !== 0n) {
    const square = bitScanForward(bb);
    squares.push(square);
    bb = popLSB(bb);
  }
  
  return squares;
}

// ========================================
// BITBOARD QUERIES
// ========================================

/**
 * Check if bitboard is empty
 * @param {bigint} bitboard
 * @returns {boolean}
 */
export function isEmpty(bitboard) {
  return bitboard === 0n;
}

/**
 * Check if bitboard has exactly one bit set
 * @param {bigint} bitboard
 * @returns {boolean}
 */
export function isSingleBit(bitboard) {
  return bitboard !== 0n && (bitboard & (bitboard - 1n)) === 0n;
}

/**
 * Get the only square if bitboard has single bit
 * @param {bigint} bitboard
 * @returns {number} - Square index or -1 if not single bit
 */
export function getSingleSquare(bitboard) {
  if (!isSingleBit(bitboard)) return -1;
  return bitScanForward(bitboard);
}

// ========================================
// BITBOARD OPERATIONS
// ========================================

/**
 * Combine multiple bitboards with OR
 * @param {...bigint} bitboards
 * @returns {bigint}
 */
export function combineBitboards(...bitboards) {
  return bitboards.reduce((acc, bb) => acc | bb, 0n);
}

/**
 * Get common bits between bitboards (AND)
 * @param {...bigint} bitboards
 * @returns {bigint}
 */
export function intersectBitboards(...bitboards) {
  if (bitboards.length === 0) return 0n;
  return bitboards.reduce((acc, bb) => acc & bb);
}

/**
 * Check if two bitboards overlap (have common bits)
 * @param {bigint} bb1
 * @param {bigint} bb2
 * @returns {boolean}
 */
export function hasOverlap(bb1, bb2) {
  return (bb1 & bb2) !== 0n;
}

/**
 * Shift bitboard (for pawn moves, etc.)
 * @param {bigint} bitboard
 * @param {number} direction - Positive = up ranks, negative = down
 * @returns {bigint}
 */
export function shiftBitboard(bitboard, direction) {
  if (direction > 0) {
    return bitboard >> BigInt(direction);
  } else {
    return bitboard << BigInt(-direction);
  }
}

// ========================================
// CONVERSION UTILITIES
// ========================================

/**
 * Convert square index to algebraic notation
 * @param {number} square - Square index (0-63)
 * @returns {string} - e.g., "e4"
 */
export function squareToAlgebraic(square) {
  if (square === 64) return '-';
  const file = String.fromCharCode(97 + (square % 8)); // a-h
  const rank = 8 - Math.floor(square / 8); // 8-1
  return file + rank;
}

/**
 * Convert algebraic notation to square index
 * @param {string} algebraic - e.g., "e4"
 * @returns {number} - Square index (0-63) or 64 if invalid
 */
export function algebraicToSquare(algebraic) {
  if (!algebraic || algebraic === '-') return 64;
  
  const file = algebraic.charCodeAt(0) - 97; // a=0, h=7
  const rank = 8 - parseInt(algebraic[1]);    // 8=0, 1=7
  
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return 64;
  
  return rank * 8 + file;
}

/**
 * Get file (column) of square
 * @param {number} square - Square index (0-63)
 * @returns {number} - File (0-7)
 */
export function getFile(square) {
  return square % 8;
}

/**
 * Get rank (row) of square
 * @param {number} square - Square index (0-63)
 * @returns {number} - Rank (0-7)
 */
export function getRank(square) {
  return Math.floor(square / 8);
}

/**
 * Check if piece is white
 * Converted from C++: PieceIsWhite
 * @param {number} piece - Piece constant (0-11)
 * @returns {boolean}
 */
export function pieceIsWhite(piece) {
  return piece >= 0 && piece <= 5;
}

// ========================================
// DEBUG UTILITIES
// ========================================

/**
 * Print bitboard as 8x8 grid (for debugging)
 * @param {bigint} bitboard
 * @param {string} label - Optional label
 */
export function printBitboard(bitboard, label = '') {
  if (label) console.log(`\n${label}:`);
  
  for (let rank = 0; rank < 8; rank++) {
    let row = '';
    for (let file = 0; file < 8; file++) {
      const square = rank * 8 + file;
      row += getBit(bitboard, square) ? '1 ' : '. ';
    }
    console.log(`${8 - rank}  ${row}`);
  }
  console.log('   a b c d e f g h\n');
}

/**
 * Convert bitboard to binary string (for debugging)
 * @param {bigint} bitboard
 * @returns {string}
 */
export function bitboardToBinary(bitboard) {
  return bitboard.toString(2).padStart(64, '0');
}

/**
 * Convert bitboard to hex string (for debugging)
 * @param {bigint} bitboard
 * @returns {string}
 */
export function bitboardToHex(bitboard) {
  return '0x' + bitboard.toString(16).toUpperCase().padStart(16, '0');
}
