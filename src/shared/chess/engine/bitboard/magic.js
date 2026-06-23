/**
 * Magic Bitboards - Part 1: Infrastructure
 * Pre-computed magic numbers and attack generation
 * 
 * Magic bitboards use multiplication and bit shifts for O(1) attack lookup
 * Based on Tord Romstad's magic bitboard implementation
 */

import { ROOK_MASKS, BISHOP_MASKS } from './attacks.js';

// ========================================
// MAGIC NUMBERS (Pre-computed)
// These are "magic" multipliers that create unique hash indices
// Source: Chess Programming Wiki / Stockfish
// ========================================

/**
 * Pre-computed magic numbers for rook attacks
 * One magic number per square (64 total)
 */
export const ROOK_MAGIC_NUMBERS = [
  0x0080001020400080n, 0x0040001000200040n, 0x0080081000200080n, 0x0080040800100080n,
  0x0080020400080080n, 0x0080010200040080n, 0x0080008001000200n, 0x0080002040800100n,
  0x0000800020400080n, 0x0000400020005000n, 0x0000801000200080n, 0x0000800800100080n,
  0x0000800400080080n, 0x0000800200040080n, 0x0000800100020080n, 0x0000800040800100n,
  0x0000208000400080n, 0x0000404000201000n, 0x0000808010002000n, 0x0000808008001000n,
  0x0000808004000800n, 0x0000808002000400n, 0x0000010100020004n, 0x0000020000408104n,
  0x0000208080004000n, 0x0000200040005000n, 0x0000100080200080n, 0x0000080080100080n,
  0x0000040080080080n, 0x0000020080040080n, 0x0000010080800200n, 0x0000800080004100n,
  0x0000204000800080n, 0x0000200040401000n, 0x0000100080802000n, 0x0000080080801000n,
  0x0000040080800800n, 0x0000020080800400n, 0x0000020001010004n, 0x0000800040800100n,
  0x0000204000808000n, 0x0000200040008080n, 0x0000100020008080n, 0x0000080010008080n,
  0x0000040008008080n, 0x0000020004008080n, 0x0000010002008080n, 0x0000004081020004n,
  0x0000204000800080n, 0x0000200040008080n, 0x0000100020008080n, 0x0000080010008080n,
  0x0000040008008080n, 0x0000020004008080n, 0x0000800100020080n, 0x0000800041000080n,
  0x00FFFCDDFCED714An, 0x007FFCDDFCED714An, 0x003FFFCDFFD88096n, 0x0000040810002101n,
  0x0001000204080011n, 0x0001000204000801n, 0x0001000082000401n, 0x0001FFFAABFAD1A2n
];

/**
 * Pre-computed magic numbers for bishop attacks
 * One magic number per square (64 total)
 */
export const BISHOP_MAGIC_NUMBERS = [
  0x0002020202020200n, 0x0002020202020000n, 0x0004010202000000n, 0x0004040080000000n,
  0x0001104000000000n, 0x0000821040000000n, 0x0000410410400000n, 0x0000104104104000n,
  0x0000040404040400n, 0x0000020202020200n, 0x0000040102020000n, 0x0000040400800000n,
  0x0000011040000000n, 0x0000008210400000n, 0x0000004104104000n, 0x0000002082082000n,
  0x0004000808080800n, 0x0002000404040400n, 0x0001000202020200n, 0x0000800802004000n,
  0x0000800400A00000n, 0x0000200100884000n, 0x0000400082082000n, 0x0000200041041000n,
  0x0002080010101000n, 0x0001040008080800n, 0x0000208004010400n, 0x0000404004010200n,
  0x0000840000802000n, 0x0000404002011000n, 0x0000808001041000n, 0x0000404000820800n,
  0x0001041000202000n, 0x0000820800101000n, 0x0000104400080800n, 0x0000020080080080n,
  0x0000404040040100n, 0x0000808100020100n, 0x0001010100020800n, 0x0000808080010400n,
  0x0000820820004000n, 0x0000410410002000n, 0x0000082088001000n, 0x0000002011000800n,
  0x0000080100400400n, 0x0001010101000200n, 0x0002020202000400n, 0x0001010101000200n,
  0x0000410410400000n, 0x0000208208200000n, 0x0000002084100000n, 0x0000000020880000n,
  0x0000001002020000n, 0x0000040408020000n, 0x0004040404040000n, 0x0002020202020000n,
  0x0000104104104000n, 0x0000002082082000n, 0x0000000020841000n, 0x0000000000208800n,
  0x0000000010020200n, 0x0000000404080200n, 0x0000040404040400n, 0x0002020202020200n
];

// ========================================
// RELEVANT BITS (Mask bit counts)
// Number of bits in each square's mask
// ========================================

/**
 * Number of relevant bits for rook masks at each square
 * Used to determine hash table size (2^bits)
 */
export const ROOK_REL_BITS = [
  12, 11, 11, 11, 11, 11, 11, 12,
  11, 10, 10, 10, 10, 10, 10, 11,
  11, 10, 10, 10, 10, 10, 10, 11,
  11, 10, 10, 10, 10, 10, 10, 11,
  11, 10, 10, 10, 10, 10, 10, 11,
  11, 10, 10, 10, 10, 10, 10, 11,
  11, 10, 10, 10, 10, 10, 10, 11,
  12, 11, 11, 11, 11, 11, 11, 12
];

/**
 * Number of relevant bits for bishop masks at each square
 */
export const BISHOP_REL_BITS = [
  6, 5, 5, 5, 5, 5, 5, 6,
  5, 5, 5, 5, 5, 5, 5, 5,
  5, 5, 7, 7, 7, 7, 5, 5,
  5, 5, 7, 9, 9, 7, 5, 5,
  5, 5, 7, 9, 9, 7, 5, 5,
  5, 5, 7, 7, 7, 7, 5, 5,
  5, 5, 5, 5, 5, 5, 5, 5,
  6, 5, 5, 5, 5, 5, 5, 6
];

// ========================================
// ATTACK GENERATION (with blockers)
// ========================================

/**
 * Generate rook attacks on the fly with given occupancy
 * Used to populate attack tables during initialization
 * 
 * @param {number} square - Starting square (0-63)
 * @param {bigint} blockers - Occupancy bitboard (blocking pieces)
 * @returns {bigint} - Attack bitboard
 */
function generateRookAttacks(square, blockers) {
  let attacks = 0n;
  const rank = Math.floor(square / 8);
  const file = square % 8;
  
  // North (up)
  for (let r = rank - 1; r >= 0; r--) {
    const sq = r * 8 + file;
    attacks |= (1n << BigInt(sq));
    if (blockers & (1n << BigInt(sq))) break;
  }
  
  // South (down)
  for (let r = rank + 1; r <= 7; r++) {
    const sq = r * 8 + file;
    attacks |= (1n << BigInt(sq));
    if (blockers & (1n << BigInt(sq))) break;
  }
  
  // East (right)
  for (let f = file + 1; f <= 7; f++) {
    const sq = rank * 8 + f;
    attacks |= (1n << BigInt(sq));
    if (blockers & (1n << BigInt(sq))) break;
  }
  
  // West (left)
  for (let f = file - 1; f >= 0; f--) {
    const sq = rank * 8 + f;
    attacks |= (1n << BigInt(sq));
    if (blockers & (1n << BigInt(sq))) break;
  }
  
  return attacks;
}

/**
 * Generate bishop attacks on the fly with given occupancy
 * 
 * @param {number} square - Starting square (0-63)
 * @param {bigint} blockers - Occupancy bitboard (blocking pieces)
 * @returns {bigint} - Attack bitboard
 */
function generateBishopAttacks(square, blockers) {
  let attacks = 0n;
  const rank = Math.floor(square / 8);
  const file = square % 8;
  
  // North-East
  for (let r = rank - 1, f = file + 1; r >= 0 && f <= 7; r--, f++) {
    const sq = r * 8 + f;
    attacks |= (1n << BigInt(sq));
    if (blockers & (1n << BigInt(sq))) break;
  }
  
  // South-East
  for (let r = rank + 1, f = file + 1; r <= 7 && f <= 7; r++, f++) {
    const sq = r * 8 + f;
    attacks |= (1n << BigInt(sq));
    if (blockers & (1n << BigInt(sq))) break;
  }
  
  // South-West
  for (let r = rank + 1, f = file - 1; r <= 7 && f >= 0; r++, f--) {
    const sq = r * 8 + f;
    attacks |= (1n << BigInt(sq));
    if (blockers & (1n << BigInt(sq))) break;
  }
  
  // North-West
  for (let r = rank - 1, f = file - 1; r >= 0 && f >= 0; r--, f--) {
    const sq = r * 8 + f;
    attacks |= (1n << BigInt(sq));
    if (blockers & (1n << BigInt(sq))) break;
  }
  
  return attacks;
}

// ========================================
// MAGIC BITBOARD ALGORITHM
// ========================================

/**
 * Compute magic index for rook attacks
 * This is the core magic bitboard algorithm
 * 
 * @param {number} square - Square index (0-63)
 * @param {bigint} occupancy - Current board occupancy
 * @returns {number} - Hash index for attack table lookup
 */
function getMagicIndexRook(square, occupancy) {
  // 1. Mask occupancy to relevant bits
  const masked = occupancy & ROOK_MASKS[square];
  
  // 2. Multiply by magic number
  const product = masked * ROOK_MAGIC_NUMBERS[square];
  
  // 3. Shift to get hash index
  const shift = 64 - ROOK_REL_BITS[square];
  const index = Number(product >> BigInt(shift));
  
  return index;
}

/**
 * Compute magic index for bishop attacks
 */
function getMagicIndexBishop(square, occupancy) {
  const masked = occupancy & BISHOP_MASKS[square];
  const product = masked * BISHOP_MAGIC_NUMBERS[square];
  const shift = 64 - BISHOP_REL_BITS[square];
  const index = Number(product >> BigInt(shift));
  
  return index;
}

// ========================================
// ATTACK TABLE GENERATION
// ========================================

/**
 * Generate all blocker combinations for a mask
 * Used to populate attack tables
 */
function generateBlockerCombinations(mask) {
  const combinations = [];
  const bits = [];
  
  // Get all set bits in mask
  let m = mask;
  while (m !== 0n) {
    const lsb = m & -m;
    let sq = 0;
    let temp = lsb;
    while (temp > 1n) {
      temp >>= 1n;
      sq++;
    }
    bits.push(sq);
    m &= m - 1n;
  }
  
  // Generate all 2^n combinations
  const n = bits.length;
  const total = 1 << n;
  
  for (let i = 0; i < total; i++) {
    let blocker = 0n;
    for (let j = 0; j < n; j++) {
      if (i & (1 << j)) {
        blocker |= (1n << BigInt(bits[j]));
      }
    }
    combinations.push(blocker);
  }
  
  return combinations;
}

/**
 * Initialize rook attack tables
 * Returns array of Maps (one per square)
 */
export function initializeRookAttacks() {
  const tables = Array.from({ length: 64 }, () => new Map());
  
  for (let square = 0; square < 64; square++) {
    const mask = ROOK_MASKS[square];
    const blockerCombos = generateBlockerCombinations(mask);
    
    for (const blockers of blockerCombos) {
      const index = getMagicIndexRook(square, blockers);
      const attacks = generateRookAttacks(square, blockers);
      tables[square].set(index, attacks);
    }
  }
  
  return tables;
}

/**
 * Initialize bishop attack tables
 */
export function initializeBishopAttacks() {
  const tables = Array.from({ length: 64 }, () => new Map());
  
  for (let square = 0; square < 64; square++) {
    const mask = BISHOP_MASKS[square];
    const blockerCombos = generateBlockerCombinations(mask);
    
    for (const blockers of blockerCombos) {
      const index = getMagicIndexBishop(square, blockers);
      const attacks = generateBishopAttacks(square, blockers);
      tables[square].set(index, attacks);
    }
  }
  
  return tables;
}

// ========================================
// FAST LOOKUP FUNCTIONS (after init)
// ========================================

// Attack tables - will be populated during initialization
export let ROOK_ATTACKS = null;
export let BISHOP_ATTACKS = null;

// Optimized array-based tables (Part 2 optimization)
let ROOK_ATTACKS_ARRAY = null;
let BISHOP_ATTACKS_ARRAY = null;

/**
 * Get rook attacks for square with given occupancy
 * Converted from C++: GetRookAttacksFast
 * 
 * @param {number} square - Square index (0-63)
 * @param {bigint} occupancy - Board occupancy
 * @returns {bigint} - Attack bitboard
 */
export function getRookAttacks(square, occupancy) {
  if (!ROOK_ATTACKS && !ROOK_ATTACKS_ARRAY) {
    // Fallback: generate on the fly (slower)
    return generateRookAttacks(square, occupancy);
  }
  
  const index = getMagicIndexRook(square, occupancy);
  
  // Use optimized array if available (faster)
  if (ROOK_ATTACKS_ARRAY) {
    return ROOK_ATTACKS_ARRAY[square][index] || 0n;
  }
  
  // Fall back to Map-based lookup
  return ROOK_ATTACKS[square].get(index) || 0n;
}

/**
 * Get bishop attacks for square with given occupancy
 * Converted from C++: GetBishopAttacksFast
 */
export function getBishopAttacks(square, occupancy) {
  if (!BISHOP_ATTACKS && !BISHOP_ATTACKS_ARRAY) {
    // Fallback: generate on the fly (slower)
    return generateBishopAttacks(square, occupancy);
  }
  
  const index = getMagicIndexBishop(square, occupancy);
  
  // Use optimized array if available (faster)
  if (BISHOP_ATTACKS_ARRAY) {
    return BISHOP_ATTACKS_ARRAY[square][index] || 0n;
  }
  
  // Fall back to Map-based lookup
  return BISHOP_ATTACKS[square].get(index) || 0n;
}

/**
 * Get queen attacks (rook + bishop)
 */
export function getQueenAttacks(square, occupancy) {
  return getRookAttacks(square, occupancy) | getBishopAttacks(square, occupancy);
}

// ========================================
// ARRAY OPTIMIZATION (Part 2)
// ========================================

/**
 * Convert Map-based tables to array-based tables for faster access
 * This is a performance optimization (saves ~0.0001ms per lookup)
 */
function optimizeToArrays() {
  if (!ROOK_ATTACKS || !BISHOP_ATTACKS) {
    console.warn('⚠️ Tables not initialized, cannot optimize');
    return;
  }
  
  console.log('⚡ Optimizing to array-based lookup...');
  const startTime = performance.now();
  
  // Rook arrays
  ROOK_ATTACKS_ARRAY = Array.from({ length: 64 }, (_, square) => {
    const maxIndex = 1 << ROOK_REL_BITS[square];
    const arr = new Array(maxIndex).fill(0n);
    
    for (const [index, attacks] of ROOK_ATTACKS[square]) {
      arr[index] = attacks;
    }
    
    return arr;
  });
  
  // Bishop arrays
  BISHOP_ATTACKS_ARRAY = Array.from({ length: 64 }, (_, square) => {
    const maxIndex = 1 << BISHOP_REL_BITS[square];
    const arr = new Array(maxIndex).fill(0n);
    
    for (const [index, attacks] of BISHOP_ATTACKS[square]) {
      arr[index] = attacks;
    }
    
    return arr;
  });
  
  const endTime = performance.now();
  console.log(`✅ Optimization complete in ${(endTime - startTime).toFixed(2)}ms`);
  
  // Calculate memory usage
  let totalArrays = 0;
  for (let i = 0; i < 64; i++) {
    totalArrays += ROOK_ATTACKS_ARRAY[i].length;
    totalArrays += BISHOP_ATTACKS_ARRAY[i].length;
  }
  console.log(`📊 Total array entries: ${totalArrays.toLocaleString()}`);
}

// ========================================
// INITIALIZATION
// ========================================

/**
 * Initialize all magic bitboard tables
 * Call this once at startup
 * 
 * @param {boolean} optimize - Convert to array-based lookup (faster, more memory)
 */
export function initializeMagicBitboards(optimize = true) {
  console.log('🎯 Initializing magic bitboards...');
  const startTime = performance.now();
  
  ROOK_ATTACKS = initializeRookAttacks();
  BISHOP_ATTACKS = initializeBishopAttacks();
  
  const midTime = performance.now();
  console.log(`✅ Tables generated in ${(midTime - startTime).toFixed(2)}ms`);
  
  // Optional optimization
  if (optimize) {
    optimizeToArrays();
  }
  
  const endTime = performance.now();
  const totalTime = endTime - startTime;
  console.log(`🏁 Total initialization: ${totalTime.toFixed(2)}ms`);
  
  return { 
    ROOK_ATTACKS, 
    BISHOP_ATTACKS,
    ROOK_ATTACKS_ARRAY,
    BISHOP_ATTACKS_ARRAY,
    optimized: optimize
  };
}

/**
 * Get initialization statistics
 */
export function getInitStats() {
  let rookMapEntries = 0;
  let bishopMapEntries = 0;
  let rookArrayEntries = 0;
  let bishopArrayEntries = 0;
  
  if (ROOK_ATTACKS) {
    for (let i = 0; i < 64; i++) {
      rookMapEntries += ROOK_ATTACKS[i].size;
    }
  }
  
  if (BISHOP_ATTACKS) {
    for (let i = 0; i < 64; i++) {
      bishopMapEntries += BISHOP_ATTACKS[i].size;
    }
  }
  
  if (ROOK_ATTACKS_ARRAY) {
    for (let i = 0; i < 64; i++) {
      rookArrayEntries += ROOK_ATTACKS_ARRAY[i].length;
    }
  }
  
  if (BISHOP_ATTACKS_ARRAY) {
    for (let i = 0; i < 64; i++) {
      bishopArrayEntries += BISHOP_ATTACKS_ARRAY[i].length;
    }
  }
  
  return {
    mapBased: {
      rook: rookMapEntries,
      bishop: bishopMapEntries,
      total: rookMapEntries + bishopMapEntries
    },
    arrayBased: {
      rook: rookArrayEntries,
      bishop: bishopArrayEntries,
      total: rookArrayEntries + bishopArrayEntries
    },
    optimized: ROOK_ATTACKS_ARRAY !== null
  };
}
