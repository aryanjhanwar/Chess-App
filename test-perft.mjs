/**
 * Quick perft benchmark — run with: node test-perft.mjs
 * Tests correctness (depths 1-5) and reports timing.
 */
import { initBitboardEngine } from './src/engine/bitboard/init.js';
import { createStartingPosition, createPositionFromFEN } from './src/engine/bitboard/position.js';
import { generateLegalMoves_v2, makeMove_v2, unmakeMove_v2 } from './src/engine/bitboard/moveGen.js';

// Init magic tables etc.
initBitboardEngine();

function perft(position, depth) {
  if (depth === 0) return 1;
  const moves = generateLegalMoves_v2(position);
  if (depth === 1) return moves.length;
  let nodes = 0;
  for (let i = 0; i < moves.length; i++) {
    const saved = makeMove_v2(position, moves[i]);
    nodes += perft(position, depth - 1);
    unmakeMove_v2(position, moves[i], saved);
  }
  return nodes;
}

const EXPECTED = [1, 20, 400, 8902, 197281, 4865609];

console.log('═══════════════════════════════════════════════');
console.log('   PERFT BENCHMARK (mailbox + incremental occ)');
console.log('═══════════════════════════════════════════════');

const pos = createStartingPosition();
let allPassed = true;

for (let d = 1; d <= 5; d++) {
  const t0 = performance.now();
  const nodes = perft(pos, d);
  const ms = (performance.now() - t0).toFixed(2);
  const ok = nodes === EXPECTED[d];
  if (!ok) allPassed = false;
  console.log(`  depth ${d}: ${nodes}  expected ${EXPECTED[d]}  ${ok ? '✅' : '❌ MISMATCH'}  (${ms} ms)`);
}

// Kiwipete: a complex position with lots of promotions/EP/castling
const KIWIPETE = 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1';
const KIWI_EXPECTED = [48, 2039, 97862];
console.log('\n  Kiwipete:');
const kiwiPos = createPositionFromFEN(KIWIPETE);
for (let d = 1; d <= 3; d++) {
  const t0 = performance.now();
  const nodes = perft(kiwiPos, d);
  const ms = (performance.now() - t0).toFixed(2);
  const ok = nodes === KIWI_EXPECTED[d - 1];
  if (!ok) allPassed = false;
  console.log(`  depth ${d}: ${nodes}  expected ${KIWI_EXPECTED[d - 1]}  ${ok ? '✅' : '❌ MISMATCH'}  (${ms} ms)`);
}

console.log('\n═══════════════════════════════════════════════');
console.log(allPassed ? '  ALL PERFT TESTS PASSED ✅' : '  SOME TESTS FAILED ❌');
console.log('═══════════════════════════════════════════════');
process.exit(allPassed ? 0 : 1);
