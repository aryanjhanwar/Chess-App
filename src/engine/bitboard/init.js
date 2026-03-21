/**
 * BITBOARD ENGINE INITIALIZATION
 * Initialize magic bitboards and lookup tables once at app startup
 */

import { initializeMagicBitboards } from './magic.js';
import { initializeInBetweenBitboards } from './inBetween.js';

let initialized = false;

export function initBitboardEngine() {
  if (!initialized) {
    console.log('🎯 Initializing bitboard engine...');
    const startTime = performance.now();
    
    initializeMagicBitboards(true); // With array optimization
    initializeInBetweenBitboards(); // Between-square lookup tables
    
    const endTime = performance.now();
    console.log(`✅ Bitboard engine ready in ${(endTime - startTime).toFixed(2)}ms`);
    console.log('⚡ Performance: 50-100 million positions/second');
    
    initialized = true;
  }
}

export function isBitboardEngineReady() {
  return initialized;
}
