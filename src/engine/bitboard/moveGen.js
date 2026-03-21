/**
 * MOVE GENERATION
 * Generate legal chess moves using bitboards
 * Converted from C++ enginecode.cpp
 */

import {
  WP, WN, WB, WR, WQ, WK,
  BP, BN, BB, BR, BQ, BK,
  RANK_1_BITBOARD, RANK_2_BITBOARD, RANK_4_BITBOARD,
  RANK_5_BITBOARD, RANK_7_BITBOARD, RANK_8_BITBOARD,
  FILE_A_BITBOARD, FILE_H_BITBOARD,
  SQUARE_BBS, MAX_ULONG,
  A1, A8, C1, C8, D1, D8, E1, E8, F1, F8, G1, G8, H1, H8, NO_SQUARE,
  WKS_EMPTY_BITBOARD, WQS_EMPTY_BITBOARD, BKS_EMPTY_BITBOARD, BQS_EMPTY_BITBOARD,
  TAG_NONE, TAG_CAPTURE, TAG_WHITEEP, TAG_BLACKEP,
  TAG_WCASTLEKS, TAG_WCASTLEQS, TAG_BCASTLEKS, TAG_BCASTLEQS,
  TAG_BKnightPromotion, TAG_BBishopPromotion, TAG_BQueenPromotion, TAG_BRookPromotion,
  TAG_WKnightPromotion, TAG_WBishopPromotion, TAG_WQueenPromotion, TAG_WRookPromotion,
  TAG_BCaptureKnightPromotion, TAG_BCaptureBishopPromotion,
  TAG_BCaptureQueenPromotion, TAG_BCaptureRookPromotion,
  TAG_WCaptureKnightPromotion, TAG_WCaptureBishopPromotion,
  TAG_WCaptureQueenPromotion, TAG_WCaptureRookPromotion,
  TAG_DoublePawnWhite, TAG_DoublePawnBlack,
  TAG_CHECK, TAG_CHECK_CAPTURE
} from './constants.js';

import {
  getBit,
  setBit,
  countBits,
  getSetBits,
  squareToAlgebraic,
  bitScanForward
} from './utils.js';

import {
  KNIGHT_ATTACKS,
  KING_ATTACKS,
  WHITE_PAWN_ATTACKS,
  BLACK_PAWN_ATTACKS
} from './attacks.js';

import {
  getRookAttacks,
  getBishopAttacks,
  getQueenAttacks
} from './magic.js';

import { INBETWEEN_BITBOARDS } from './inBetween.js';

// ========================================
// ATTACK DETECTION
// ========================================

/**
 * Check if a square is attacked by a given side
 * 
 * @param {Position} position - Current position
 * @param {number} square - Square to check (0-63)
 * @param {number} bySide - Attacking side (0=white, 1=black)
 * @returns {boolean} - True if square is attacked
 */
export function isSquareAttacked(position, square, bySide) {
  const occupancy = position.getAllOccupancy();
  
  if (bySide === 0) {
    // Attacked by white
    
    // Pawn attacks â€” reverse lookup: use BLACK_PAWN_ATTACKS to find squares one rank
    // below 'square' where a white pawn could stand and attack upward toward 'square'
    if (BLACK_PAWN_ATTACKS[square] & position.bitboards[WP]) return true;
    
    // Knight attacks
    if (KNIGHT_ATTACKS[square] & position.bitboards[WN]) return true;
    
    // King attacks
    if (KING_ATTACKS[square] & position.bitboards[WK]) return true;
    
    // Bishop/Queen diagonal attacks
    const bishopAttacks = getBishopAttacks(square, occupancy);
    if (bishopAttacks & (position.bitboards[WB] | position.bitboards[WQ])) return true;
    
    // Rook/Queen straight attacks
    const rookAttacks = getRookAttacks(square, occupancy);
    if (rookAttacks & (position.bitboards[WR] | position.bitboards[WQ])) return true;
    
  } else {
    // Attacked by black
    
    // Pawn attacks â€” reverse lookup: use WHITE_PAWN_ATTACKS to find squares one rank
    // above 'square' where a black pawn could stand and attack downward toward 'square'
    if (WHITE_PAWN_ATTACKS[square] & position.bitboards[BP]) return true;
    
    // Knight attacks
    if (KNIGHT_ATTACKS[square] & position.bitboards[BN]) return true;
    
    // King attacks
    if (KING_ATTACKS[square] & position.bitboards[BK]) return true;
    
    // Bishop/Queen diagonal attacks
    const bishopAttacks = getBishopAttacks(square, occupancy);
    if (bishopAttacks & (position.bitboards[BB] | position.bitboards[BQ])) return true;
    
    // Rook/Queen straight attacks
    const rookAttacks = getRookAttacks(square, occupancy);
    if (rookAttacks & (position.bitboards[BR] | position.bitboards[BQ])) return true;
  }
  
  return false;
}

/**
 * Check if the side to move is in check
 * 
 * @param {Position} position - Current position
 * @returns {boolean} - True if king is in check
 */
export function isInCheck(position) {
  const sideToMove = position.sideToMove;
  const kingPiece = sideToMove === 0 ? WK : BK;
  const kingSquares = getSetBits(position.bitboards[kingPiece]);
  
  if (kingSquares.length === 0) return false; // No king (shouldn't happen)
  
  const kingSquare = kingSquares[0];
  return isSquareAttacked(position, kingSquare, 1 - sideToMove);
}

// ========================================================================
// â€” Pin-aware legal move generation with makeMove / unmakeMove
// Ported from C++ enginecode.cpp.
// ========================================================================

// â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Check if a square is attacked by `bySide`, using a caller-supplied
 * combined occupancy (needed for king-safety checks where the king is
 * temporarily removed from the board).
 */
function isSquareAttackedWithOcc(position, square, bySide, occupancy) {
  if (bySide === 0) {
    // Attacked by white
    if ((BLACK_PAWN_ATTACKS[square] & position.bitboards[WP]) !== 0n) return true;
    if ((KNIGHT_ATTACKS[square] & position.bitboards[WN]) !== 0n) return true;
    if ((getBishopAttacks(square, occupancy) & (position.bitboards[WB] | position.bitboards[WQ])) !== 0n) return true;
    if ((getRookAttacks(square, occupancy) & (position.bitboards[WR] | position.bitboards[WQ])) !== 0n) return true;
    if ((KING_ATTACKS[square] & position.bitboards[WK]) !== 0n) return true;
    return false;
  } else {
    // Attacked by black
    if ((WHITE_PAWN_ATTACKS[square] & position.bitboards[BP]) !== 0n) return true;
    if ((KNIGHT_ATTACKS[square] & position.bitboards[BN]) !== 0n) return true;
    if ((getBishopAttacks(square, occupancy) & (position.bitboards[BB] | position.bitboards[BQ])) !== 0n) return true;
    if ((getRookAttacks(square, occupancy) & (position.bitboards[BR] | position.bitboards[BQ])) !== 0n) return true;
    if ((KING_ATTACKS[square] & position.bitboards[BK]) !== 0n) return true;
    return false;
  }
}

/**
 * Detect whether an en-passant capture would leave the king exposed
 * to a horizontal (rank) attack.  Both the capturing pawn and the
 * captured pawn sit on the same rank; removing them simultaneously
 * can uncover a rook / queen that x-rays the king.
 */
function isEPHorizontallyPinned(position, pawnSq, capturedPawnSq, kingSquare) {
  const pawnRank = pawnSq >> 3;
  if ((kingSquare >> 3) !== pawnRank) return false; // king not on same rank

  const isWhite = position.sideToMove === 0;
  const enemyRQ =
    position.bitboards[isWhite ? BR : WR] |
    position.bitboards[isWhite ? BQ : WQ];

  // Quick exit: no enemy rook / queen on that rank at all
  const rankBB = 0xFFn << BigInt(pawnRank * 8);
  if ((enemyRQ & rankBB) === 0n) return false;

  // Remove both pawns, fire rook rays from king
  const occWithout =
    position.allOccupancy &
    ~SQUARE_BBS[pawnSq] &
    ~SQUARE_BBS[capturedPawnSq];

  return (getRookAttacks(kingSquare, occWithout) & enemyRQ & rankBB) !== 0n;
}

// â”€â”€ makeMove_v2 / unmakeMove_v2 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Apply a v2 move to the position IN PLACE.  Returns a savedState
 * object that must be passed to unmakeMove_v2 to undo the move.
 *
 * Move object shape: { from, to, piece, tag }
 *
 * @param {Position} position
 * @param {{ from:number, to:number, piece:number, tag:number }} move
 * @returns {{ castlingRights:number, enPassantSquare:number,
 *             halfmoveClock:number, fullmoveNumber:number,
 *             capturedPiece:number }}
 */
export function makeMove_v2(position, move) {
  const savedState = {
    castlingRights: position.castlingRights,
    enPassantSquare: position.enPassantSquare,
    halfmoveClock: position.halfmoveClock,
    fullmoveNumber: position.fullmoveNumber,
    capturedPiece: -1,
  };

  const { from, to, piece, tag } = move;
  const bb = position.bitboards;
  const mb = position.mailbox;
  const sqFrom = SQUARE_BBS[from];
  const sqTo   = SQUARE_BBS[to];

  // Flip side first (same order as C++ engine)
  position.sideToMove ^= 1;

  // Track occupancy changes for incremental update
  // whiteFlip/blackFlip: bits to XOR. whiteClear/blackClear: bits to AND-NOT.
  let whiteFlip = 0n, blackFlip = 0n;
  let whiteClear = 0n, blackClear = 0n;

  switch (tag) {
    // â”€â”€ quiet / check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    case TAG_NONE:
    case TAG_CHECK:
      bb[piece] = (bb[piece] | sqTo) & ~sqFrom;
      mb[from] = -1; mb[to] = piece;
      if (piece <= WK) whiteFlip = sqFrom | sqTo;
      else blackFlip = sqFrom | sqTo;
      position.enPassantSquare = -1;
      break;

    // â”€â”€ capture / check-capture â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    case TAG_CAPTURE:
    case TAG_CHECK_CAPTURE: {
      bb[piece] = (bb[piece] | sqTo) & ~sqFrom;
      // Mailbox O(1) capture detection
      const cap = mb[to];
      savedState.capturedPiece = cap;
      bb[cap] &= ~sqTo;
      mb[from] = -1; mb[to] = piece;
      if (piece <= WK) { whiteFlip = sqFrom | sqTo; blackClear = sqTo; }
      else { blackFlip = sqFrom | sqTo; whiteClear = sqTo; }
      position.enPassantSquare = -1;
      break;
    }

    // â”€â”€ en passant â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    case TAG_WHITEEP: {
      bb[WP] = (bb[WP] | sqTo) & ~sqFrom;
      const epCapSq = to + 8;
      bb[BP] &= ~SQUARE_BBS[epCapSq];
      savedState.capturedPiece = BP;
      mb[from] = -1; mb[to] = WP; mb[epCapSq] = -1;
      whiteFlip = sqFrom | sqTo;
      blackClear = SQUARE_BBS[epCapSq];
      position.enPassantSquare = -1;
      break;
    }
    case TAG_BLACKEP: {
      bb[BP] = (bb[BP] | sqTo) & ~sqFrom;
      const epCapSq = to - 8;
      bb[WP] &= ~SQUARE_BBS[epCapSq];
      savedState.capturedPiece = WP;
      mb[from] = -1; mb[to] = BP; mb[epCapSq] = -1;
      blackFlip = sqFrom | sqTo;
      whiteClear = SQUARE_BBS[epCapSq];
      position.enPassantSquare = -1;
      break;
    }

    // â”€â”€ castling â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    case TAG_WCASTLEKS:
      bb[WK] = (bb[WK] | SQUARE_BBS[G1]) & ~SQUARE_BBS[E1];
      bb[WR] = (bb[WR] | SQUARE_BBS[F1]) & ~SQUARE_BBS[H1];
      mb[E1] = -1; mb[G1] = WK; mb[H1] = -1; mb[F1] = WR;
      whiteFlip = SQUARE_BBS[E1] | SQUARE_BBS[G1] | SQUARE_BBS[H1] | SQUARE_BBS[F1];
      position.castlingRights &= ~3;
      position.enPassantSquare = -1;
      break;

    case TAG_WCASTLEQS:
      bb[WK] = (bb[WK] | SQUARE_BBS[C1]) & ~SQUARE_BBS[E1];
      bb[WR] = (bb[WR] | SQUARE_BBS[D1]) & ~SQUARE_BBS[A1];
      mb[E1] = -1; mb[C1] = WK; mb[A1] = -1; mb[D1] = WR;
      whiteFlip = SQUARE_BBS[E1] | SQUARE_BBS[C1] | SQUARE_BBS[A1] | SQUARE_BBS[D1];
      position.castlingRights &= ~3;
      position.enPassantSquare = -1;
      break;

    case TAG_BCASTLEKS:
      bb[BK] = (bb[BK] | SQUARE_BBS[G8]) & ~SQUARE_BBS[E8];
      bb[BR] = (bb[BR] | SQUARE_BBS[F8]) & ~SQUARE_BBS[H8];
      mb[E8] = -1; mb[G8] = BK; mb[H8] = -1; mb[F8] = BR;
      blackFlip = SQUARE_BBS[E8] | SQUARE_BBS[G8] | SQUARE_BBS[H8] | SQUARE_BBS[F8];
      position.castlingRights &= ~12;
      position.enPassantSquare = -1;
      break;

    case TAG_BCASTLEQS:
      bb[BK] = (bb[BK] | SQUARE_BBS[C8]) & ~SQUARE_BBS[E8];
      bb[BR] = (bb[BR] | SQUARE_BBS[D8]) & ~SQUARE_BBS[A8];
      mb[E8] = -1; mb[C8] = BK; mb[A8] = -1; mb[D8] = BR;
      blackFlip = SQUARE_BBS[E8] | SQUARE_BBS[C8] | SQUARE_BBS[A8] | SQUARE_BBS[D8];
      position.castlingRights &= ~12;
      position.enPassantSquare = -1;
      break;

    // â”€â”€ promotions (quiet) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    case TAG_WKnightPromotion: bb[WN] |= sqTo; bb[WP] &= ~sqFrom; mb[from] = -1; mb[to] = WN; whiteFlip = sqFrom | sqTo; position.enPassantSquare = -1; break;
    case TAG_WBishopPromotion: bb[WB] |= sqTo; bb[WP] &= ~sqFrom; mb[from] = -1; mb[to] = WB; whiteFlip = sqFrom | sqTo; position.enPassantSquare = -1; break;
    case TAG_WQueenPromotion:  bb[WQ] |= sqTo; bb[WP] &= ~sqFrom; mb[from] = -1; mb[to] = WQ; whiteFlip = sqFrom | sqTo; position.enPassantSquare = -1; break;
    case TAG_WRookPromotion:   bb[WR] |= sqTo; bb[WP] &= ~sqFrom; mb[from] = -1; mb[to] = WR; whiteFlip = sqFrom | sqTo; position.enPassantSquare = -1; break;

    case TAG_BKnightPromotion: bb[BN] |= sqTo; bb[BP] &= ~sqFrom; mb[from] = -1; mb[to] = BN; blackFlip = sqFrom | sqTo; position.enPassantSquare = -1; break;
    case TAG_BBishopPromotion: bb[BB] |= sqTo; bb[BP] &= ~sqFrom; mb[from] = -1; mb[to] = BB; blackFlip = sqFrom | sqTo; position.enPassantSquare = -1; break;
    case TAG_BQueenPromotion:  bb[BQ] |= sqTo; bb[BP] &= ~sqFrom; mb[from] = -1; mb[to] = BQ; blackFlip = sqFrom | sqTo; position.enPassantSquare = -1; break;
    case TAG_BRookPromotion:   bb[BR] |= sqTo; bb[BP] &= ~sqFrom; mb[from] = -1; mb[to] = BR; blackFlip = sqFrom | sqTo; position.enPassantSquare = -1; break;

    // â”€â”€ capture-promotions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    case TAG_WCaptureKnightPromotion: case TAG_WCaptureBishopPromotion:
    case TAG_WCaptureQueenPromotion:  case TAG_WCaptureRookPromotion: {
      bb[WP] &= ~sqFrom;
      const cap = mb[to];
      savedState.capturedPiece = cap;
      bb[cap] &= ~sqTo;
      if (tag === TAG_WCaptureKnightPromotion)      bb[WN] |= sqTo;
      else if (tag === TAG_WCaptureBishopPromotion)  bb[WB] |= sqTo;
      else if (tag === TAG_WCaptureQueenPromotion)   bb[WQ] |= sqTo;
      else /* TAG_WCaptureRookPromotion */           bb[WR] |= sqTo;
      mb[from] = -1;
      mb[to] = tag === TAG_WCaptureKnightPromotion ? WN :
               tag === TAG_WCaptureBishopPromotion ? WB :
               tag === TAG_WCaptureQueenPromotion  ? WQ : WR;
      whiteFlip = sqFrom | sqTo; blackClear = sqTo;
      position.enPassantSquare = -1;
      break;
    }
    case TAG_BCaptureKnightPromotion: case TAG_BCaptureBishopPromotion:
    case TAG_BCaptureQueenPromotion:  case TAG_BCaptureRookPromotion: {
      bb[BP] &= ~sqFrom;
      const cap = mb[to];
      savedState.capturedPiece = cap;
      bb[cap] &= ~sqTo;
      if (tag === TAG_BCaptureKnightPromotion)      bb[BN] |= sqTo;
      else if (tag === TAG_BCaptureBishopPromotion)  bb[BB] |= sqTo;
      else if (tag === TAG_BCaptureQueenPromotion)   bb[BQ] |= sqTo;
      else /* TAG_BCaptureRookPromotion */           bb[BR] |= sqTo;
      mb[from] = -1;
      mb[to] = tag === TAG_BCaptureKnightPromotion ? BN :
               tag === TAG_BCaptureBishopPromotion ? BB :
               tag === TAG_BCaptureQueenPromotion  ? BQ : BR;
      blackFlip = sqFrom | sqTo; whiteClear = sqTo;
      position.enPassantSquare = -1;
      break;
    }

    // â”€â”€ double pawn push â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    case TAG_DoublePawnWhite:
      bb[WP] = (bb[WP] | sqTo) & ~sqFrom;
      mb[from] = -1; mb[to] = WP;
      whiteFlip = sqFrom | sqTo;
      position.enPassantSquare = to + 8; // one rank below landing
      break;

    case TAG_DoublePawnBlack:
      bb[BP] = (bb[BP] | sqTo) & ~sqFrom;
      mb[from] = -1; mb[to] = BP;
      blackFlip = sqFrom | sqTo;
      position.enPassantSquare = to - 8; // one rank above landing
      break;
  }

  // â”€â”€ update castling rights based on moving piece â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (piece === WK) {
    position.castlingRights &= ~3;
  } else if (piece === BK) {
    position.castlingRights &= ~12;
  } else if (piece === WR) {
    if (from === H1) position.castlingRights &= ~1;
    if (from === A1) position.castlingRights &= ~2;
  } else if (piece === BR) {
    if (from === H8) position.castlingRights &= ~4;
    if (from === A8) position.castlingRights &= ~8;
  }

  // â”€â”€ update castling rights when a rook is captured on home square â”€
  const cap = savedState.capturedPiece;
  if (cap === WR) {
    if (to === H1) position.castlingRights &= ~1;
    if (to === A1) position.castlingRights &= ~2;
  } else if (cap === BR) {
    if (to === H8) position.castlingRights &= ~4;
    if (to === A8) position.castlingRights &= ~8;
  }

  // â”€â”€ halfmove clock â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (piece === WP || piece === BP || cap !== -1) {
    position.halfmoveClock = 0;
  } else {
    position.halfmoveClock++;
  }

  // â”€â”€ fullmove number â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // sideToMove already flipped; if it's now 0, black just moved
  if (position.sideToMove === 0) {
    position.fullmoveNumber++;
  }

  // â”€â”€ incremental occupancy update (2â€“5 BigInt ops vs 13 for full rebuild) â”€â”€
  position.whiteOccupancy = (position.whiteOccupancy ^ whiteFlip) & ~whiteClear;
  position.blackOccupancy = (position.blackOccupancy ^ blackFlip) & ~blackClear;
  position.allOccupancy = position.whiteOccupancy | position.blackOccupancy;

  return savedState;
}

/**
 * Undo a v2 move, restoring the position to its exact prior state.
 *
 * @param {Position} position
 * @param {{ from:number, to:number, piece:number, tag:number }} move
 * @param {{ castlingRights:number, enPassantSquare:number,
 *           halfmoveClock:number, fullmoveNumber:number,
 *           capturedPiece:number }} savedState
 */
export function unmakeMove_v2(position, move, savedState) {
  const { from, to, piece, tag } = move;
  const bb  = position.bitboards;
  const mb  = position.mailbox;
  const sqFrom = SQUARE_BBS[from];
  const sqTo   = SQUARE_BBS[to];

  // Flip side back
  position.sideToMove ^= 1;

  // Track occupancy changes for incremental update
  let whiteFlip = 0n, blackFlip = 0n;
  let whiteRestore = 0n, blackRestore = 0n;

  switch (tag) {
    // â”€â”€ quiet / check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    case TAG_NONE:
    case TAG_CHECK:
      bb[piece] = (bb[piece] | sqFrom) & ~sqTo;
      mb[to] = -1; mb[from] = piece;
      if (piece <= WK) whiteFlip = sqFrom | sqTo;
      else blackFlip = sqFrom | sqTo;
      break;

    // â”€â”€ capture / check-capture â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    case TAG_CAPTURE:
    case TAG_CHECK_CAPTURE:
      bb[piece] = (bb[piece] | sqFrom) & ~sqTo;
      bb[savedState.capturedPiece] |= sqTo;
      mb[from] = piece; mb[to] = savedState.capturedPiece;
      if (piece <= WK) { whiteFlip = sqFrom | sqTo; blackRestore = sqTo; }
      else { blackFlip = sqFrom | sqTo; whiteRestore = sqTo; }
      break;

    // â”€â”€ en passant â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    case TAG_WHITEEP: {
      bb[WP] = (bb[WP] | sqFrom) & ~sqTo;
      const epCapSq = to + 8;
      bb[BP] |= SQUARE_BBS[epCapSq];
      mb[to] = -1; mb[from] = WP; mb[epCapSq] = BP;
      whiteFlip = sqFrom | sqTo;
      blackRestore = SQUARE_BBS[epCapSq];
      break;
    }
    case TAG_BLACKEP: {
      bb[BP] = (bb[BP] | sqFrom) & ~sqTo;
      const epCapSq = to - 8;
      bb[WP] |= SQUARE_BBS[epCapSq];
      mb[to] = -1; mb[from] = BP; mb[epCapSq] = WP;
      blackFlip = sqFrom | sqTo;
      whiteRestore = SQUARE_BBS[epCapSq];
      break;
    }

    // â”€â”€ castling â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    case TAG_WCASTLEKS:
      bb[WK] = (bb[WK] | SQUARE_BBS[E1]) & ~SQUARE_BBS[G1];
      bb[WR] = (bb[WR] | SQUARE_BBS[H1]) & ~SQUARE_BBS[F1];
      mb[G1] = -1; mb[E1] = WK; mb[F1] = -1; mb[H1] = WR;
      whiteFlip = SQUARE_BBS[E1] | SQUARE_BBS[G1] | SQUARE_BBS[H1] | SQUARE_BBS[F1];
      break;
    case TAG_WCASTLEQS:
      bb[WK] = (bb[WK] | SQUARE_BBS[E1]) & ~SQUARE_BBS[C1];
      bb[WR] = (bb[WR] | SQUARE_BBS[A1]) & ~SQUARE_BBS[D1];
      mb[C1] = -1; mb[E1] = WK; mb[D1] = -1; mb[A1] = WR;
      whiteFlip = SQUARE_BBS[E1] | SQUARE_BBS[C1] | SQUARE_BBS[A1] | SQUARE_BBS[D1];
      break;
    case TAG_BCASTLEKS:
      bb[BK] = (bb[BK] | SQUARE_BBS[E8]) & ~SQUARE_BBS[G8];
      bb[BR] = (bb[BR] | SQUARE_BBS[H8]) & ~SQUARE_BBS[F8];
      mb[G8] = -1; mb[E8] = BK; mb[F8] = -1; mb[H8] = BR;
      blackFlip = SQUARE_BBS[E8] | SQUARE_BBS[G8] | SQUARE_BBS[H8] | SQUARE_BBS[F8];
      break;
    case TAG_BCASTLEQS:
      bb[BK] = (bb[BK] | SQUARE_BBS[E8]) & ~SQUARE_BBS[C8];
      bb[BR] = (bb[BR] | SQUARE_BBS[A8]) & ~SQUARE_BBS[D8];
      mb[C8] = -1; mb[E8] = BK; mb[D8] = -1; mb[A8] = BR;
      blackFlip = SQUARE_BBS[E8] | SQUARE_BBS[C8] | SQUARE_BBS[A8] | SQUARE_BBS[D8];
      break;

    // â”€â”€ promotions (quiet) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    case TAG_WKnightPromotion: bb[WP] |= sqFrom; bb[WN] &= ~sqTo; mb[to] = -1; mb[from] = WP; whiteFlip = sqFrom | sqTo; break;
    case TAG_WBishopPromotion: bb[WP] |= sqFrom; bb[WB] &= ~sqTo; mb[to] = -1; mb[from] = WP; whiteFlip = sqFrom | sqTo; break;
    case TAG_WQueenPromotion:  bb[WP] |= sqFrom; bb[WQ] &= ~sqTo; mb[to] = -1; mb[from] = WP; whiteFlip = sqFrom | sqTo; break;
    case TAG_WRookPromotion:   bb[WP] |= sqFrom; bb[WR] &= ~sqTo; mb[to] = -1; mb[from] = WP; whiteFlip = sqFrom | sqTo; break;

    case TAG_BKnightPromotion: bb[BP] |= sqFrom; bb[BN] &= ~sqTo; mb[to] = -1; mb[from] = BP; blackFlip = sqFrom | sqTo; break;
    case TAG_BBishopPromotion: bb[BP] |= sqFrom; bb[BB] &= ~sqTo; mb[to] = -1; mb[from] = BP; blackFlip = sqFrom | sqTo; break;
    case TAG_BQueenPromotion:  bb[BP] |= sqFrom; bb[BQ] &= ~sqTo; mb[to] = -1; mb[from] = BP; blackFlip = sqFrom | sqTo; break;
    case TAG_BRookPromotion:   bb[BP] |= sqFrom; bb[BR] &= ~sqTo; mb[to] = -1; mb[from] = BP; blackFlip = sqFrom | sqTo; break;

    // â”€â”€ capture-promotions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    case TAG_WCaptureKnightPromotion: bb[WP] |= sqFrom; bb[WN] &= ~sqTo; bb[savedState.capturedPiece] |= sqTo; mb[from] = WP; mb[to] = savedState.capturedPiece; whiteFlip = sqFrom | sqTo; blackRestore = sqTo; break;
    case TAG_WCaptureBishopPromotion: bb[WP] |= sqFrom; bb[WB] &= ~sqTo; bb[savedState.capturedPiece] |= sqTo; mb[from] = WP; mb[to] = savedState.capturedPiece; whiteFlip = sqFrom | sqTo; blackRestore = sqTo; break;
    case TAG_WCaptureQueenPromotion:  bb[WP] |= sqFrom; bb[WQ] &= ~sqTo; bb[savedState.capturedPiece] |= sqTo; mb[from] = WP; mb[to] = savedState.capturedPiece; whiteFlip = sqFrom | sqTo; blackRestore = sqTo; break;
    case TAG_WCaptureRookPromotion:   bb[WP] |= sqFrom; bb[WR] &= ~sqTo; bb[savedState.capturedPiece] |= sqTo; mb[from] = WP; mb[to] = savedState.capturedPiece; whiteFlip = sqFrom | sqTo; blackRestore = sqTo; break;

    case TAG_BCaptureKnightPromotion: bb[BP] |= sqFrom; bb[BN] &= ~sqTo; bb[savedState.capturedPiece] |= sqTo; mb[from] = BP; mb[to] = savedState.capturedPiece; blackFlip = sqFrom | sqTo; whiteRestore = sqTo; break;
    case TAG_BCaptureBishopPromotion: bb[BP] |= sqFrom; bb[BB] &= ~sqTo; bb[savedState.capturedPiece] |= sqTo; mb[from] = BP; mb[to] = savedState.capturedPiece; blackFlip = sqFrom | sqTo; whiteRestore = sqTo; break;
    case TAG_BCaptureQueenPromotion:  bb[BP] |= sqFrom; bb[BQ] &= ~sqTo; bb[savedState.capturedPiece] |= sqTo; mb[from] = BP; mb[to] = savedState.capturedPiece; blackFlip = sqFrom | sqTo; whiteRestore = sqTo; break;
    case TAG_BCaptureRookPromotion:   bb[BP] |= sqFrom; bb[BR] &= ~sqTo; bb[savedState.capturedPiece] |= sqTo; mb[from] = BP; mb[to] = savedState.capturedPiece; blackFlip = sqFrom | sqTo; whiteRestore = sqTo; break;

    // â”€â”€ double pawn push â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    case TAG_DoublePawnWhite:
      bb[WP] = (bb[WP] | sqFrom) & ~sqTo;
      mb[to] = -1; mb[from] = WP;
      whiteFlip = sqFrom | sqTo;
      break;
    case TAG_DoublePawnBlack:
      bb[BP] = (bb[BP] | sqFrom) & ~sqTo;
      mb[to] = -1; mb[from] = BP;
      blackFlip = sqFrom | sqTo;
      break;
  }

  // â”€â”€ restore saved state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  position.castlingRights  = savedState.castlingRights;
  position.enPassantSquare = savedState.enPassantSquare;
  position.halfmoveClock   = savedState.halfmoveClock;
  position.fullmoveNumber  = savedState.fullmoveNumber;

  // â”€â”€ incremental occupancy update â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  position.whiteOccupancy = (position.whiteOccupancy ^ whiteFlip) | whiteRestore;
  position.blackOccupancy = (position.blackOccupancy ^ blackFlip) | blackRestore;
  position.allOccupancy = position.whiteOccupancy | position.blackOccupancy;
}

// â”€â”€ generateLegalMoves_v2 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Generate all strictly-legal moves for the current position using
 * pin detection, check masking, and a double-check shortcut.
 * Does NOT clone the position â€” no per-move clone overhead.
 *
 * @param {Position} position
 * @returns {{ from:number, to:number, piece:number, tag:number }[]}
 */
export function generateLegalMoves_v2(position) {
  const moves = [];
  const isWhite = position.sideToMove === 0;

  // Piece type aliases
  const PAWN   = isWhite ? WP : BP;
  const KNIGHT = isWhite ? WN : BN;
  const BISHOP = isWhite ? WB : BB;
  const ROOK   = isWhite ? WR : BR;
  const QUEEN  = isWhite ? WQ : BQ;
  const KING   = isWhite ? WK : BK;

  const friendlyOcc = isWhite ? position.whiteOccupancy : position.blackOccupancy;
  const enemyOcc    = isWhite ? position.blackOccupancy : position.whiteOccupancy;
  const allOcc      = position.allOccupancy;

  // â”€â”€ locate the king â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const kingSq = bitScanForward(position.bitboards[KING]);

  // â”€â”€ enemy piece indices â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const E_PAWN   = isWhite ? BP : WP;
  const E_KNIGHT = isWhite ? BN : WN;
  const E_BISHOP = isWhite ? BB : WB;
  const E_ROOK   = isWhite ? BR : WR;
  const E_QUEEN  = isWhite ? BQ : WQ;

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // PIN & CHECK DETECTION
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  let checkCount = 0;
  let checkBB = 0n;                     // squares that resolve a check
  const pinList = [];                   // { sq, mask }

  // â”€â”€ diagonal rays (bishop / queen) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    const diagSliders = position.bitboards[E_BISHOP] | position.bitboards[E_QUEEN];
    let attackers = diagSliders & getBishopAttacks(kingSq, enemyOcc);
    while (attackers !== 0n) {
      const aSq = bitScanForward(attackers);
      attackers &= attackers - 1n;
      const between = INBETWEEN_BITBOARDS[kingSq][aSq];
      const blockers = between & friendlyOcc;
      if (blockers === 0n) {
        checkBB |= between;            // includes attacker for capture
        checkCount++;
      } else if ((blockers & (blockers - 1n)) === 0n) {
        // exactly one friendly blocker â†’ pinned
        pinList.push({ sq: bitScanForward(blockers), mask: between });
      }
    }
  }

  // â”€â”€ straight rays (rook / queen) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    const straightSliders = position.bitboards[E_ROOK] | position.bitboards[E_QUEEN];
    let attackers = straightSliders & getRookAttacks(kingSq, enemyOcc);
    while (attackers !== 0n) {
      const aSq = bitScanForward(attackers);
      attackers &= attackers - 1n;
      const between = INBETWEEN_BITBOARDS[kingSq][aSq];
      const blockers = between & friendlyOcc;
      if (blockers === 0n) {
        checkBB |= between;
        checkCount++;
      } else if ((blockers & (blockers - 1n)) === 0n) {
        pinList.push({ sq: bitScanForward(blockers), mask: between });
      }
    }
  }

  // â”€â”€ knight checks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    let checkers = position.bitboards[E_KNIGHT] & KNIGHT_ATTACKS[kingSq];
    while (checkers !== 0n) {
      const cSq = bitScanForward(checkers);
      checkers &= checkers - 1n;
      checkBB |= SQUARE_BBS[cSq];
      checkCount++;
    }
  }

  // â”€â”€ pawn checks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    const pawnAtk = isWhite ? WHITE_PAWN_ATTACKS[kingSq] : BLACK_PAWN_ATTACKS[kingSq];
    let checkers = position.bitboards[E_PAWN] & pawnAtk;
    while (checkers !== 0n) {
      const cSq = bitScanForward(checkers);
      checkers &= checkers - 1n;
      checkBB |= SQUARE_BBS[cSq];
      checkCount++;
    }
  }

  // â”€â”€ helper: pin mask for a given square â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function pinMask(sq) {
    for (let i = 0; i < pinList.length; i++) {
      if (pinList[i].sq === sq) return pinList[i].mask;
    }
    return MAX_ULONG; // not pinned
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // KING MOVES (always generated)
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    const enemySide = isWhite ? 1 : 0;
    // Remove king from occupancy so slider x-rays are detected
    const occWithoutKing = allOcc & ~SQUARE_BBS[kingSq];

    let targets = KING_ATTACKS[kingSq] & ~friendlyOcc;
    while (targets !== 0n) {
      const to = bitScanForward(targets);
      targets &= targets - 1n;
      if (!isSquareAttackedWithOcc(position, to, enemySide, occWithoutKing)) {
        const isCapture = (enemyOcc & SQUARE_BBS[to]) !== 0n;
        moves.push({ from: kingSq, to, piece: KING, tag: isCapture ? TAG_CAPTURE : TAG_NONE });
      }
    }
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // DOUBLE CHECK â†’ only king moves
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  if (checkCount > 1) return moves;

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // SINGLE CHECK or NO CHECK
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  if (checkCount === 0) checkBB = MAX_ULONG;

  // â”€â”€ castling (only when not in check) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (checkCount === 0) {
    const enemySide = isWhite ? 1 : 0;
    if (isWhite) {
      if ((position.castlingRights & 1) && kingSq === E1 &&
          (position.bitboards[WR] & SQUARE_BBS[H1]) !== 0n &&
          (allOcc & WKS_EMPTY_BITBOARD) === 0n &&
          !isSquareAttackedWithOcc(position, F1, 1, allOcc) &&
          !isSquareAttackedWithOcc(position, G1, 1, allOcc)) {
        moves.push({ from: E1, to: G1, piece: WK, tag: TAG_WCASTLEKS });
      }
      if ((position.castlingRights & 2) && kingSq === E1 &&
          (position.bitboards[WR] & SQUARE_BBS[A1]) !== 0n &&
          (allOcc & WQS_EMPTY_BITBOARD) === 0n &&
          !isSquareAttackedWithOcc(position, D1, 1, allOcc) &&
          !isSquareAttackedWithOcc(position, C1, 1, allOcc)) {
        moves.push({ from: E1, to: C1, piece: WK, tag: TAG_WCASTLEQS });
      }
    } else {
      if ((position.castlingRights & 4) && kingSq === E8 &&
          (position.bitboards[BR] & SQUARE_BBS[H8]) !== 0n &&
          (allOcc & BKS_EMPTY_BITBOARD) === 0n &&
          !isSquareAttackedWithOcc(position, F8, 0, allOcc) &&
          !isSquareAttackedWithOcc(position, G8, 0, allOcc)) {
        moves.push({ from: E8, to: G8, piece: BK, tag: TAG_BCASTLEKS });
      }
      if ((position.castlingRights & 8) && kingSq === E8 &&
          (position.bitboards[BR] & SQUARE_BBS[A8]) !== 0n &&
          (allOcc & BQS_EMPTY_BITBOARD) === 0n &&
          !isSquareAttackedWithOcc(position, D8, 0, allOcc) &&
          !isSquareAttackedWithOcc(position, C8, 0, allOcc)) {
        moves.push({ from: E8, to: C8, piece: BK, tag: TAG_BCASTLEQS });
      }
    }
  }

  // â”€â”€ knights â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    let pieces = position.bitboards[KNIGHT];
    while (pieces !== 0n) {
      const sq = bitScanForward(pieces);
      pieces &= pieces - 1n;
      const pm = pinMask(sq);
      let atks = KNIGHT_ATTACKS[sq] & ~friendlyOcc & checkBB & pm;
      while (atks !== 0n) {
        const to = bitScanForward(atks);
        atks &= atks - 1n;
        moves.push({ from: sq, to, piece: KNIGHT,
                      tag: (enemyOcc & SQUARE_BBS[to]) !== 0n ? TAG_CAPTURE : TAG_NONE });
      }
    }
  }

  // â”€â”€ bishops â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    let pieces = position.bitboards[BISHOP];
    while (pieces !== 0n) {
      const sq = bitScanForward(pieces);
      pieces &= pieces - 1n;
      const pm = pinMask(sq);
      let atks = getBishopAttacks(sq, allOcc) & ~friendlyOcc & checkBB & pm;
      while (atks !== 0n) {
        const to = bitScanForward(atks);
        atks &= atks - 1n;
        moves.push({ from: sq, to, piece: BISHOP,
                      tag: (enemyOcc & SQUARE_BBS[to]) !== 0n ? TAG_CAPTURE : TAG_NONE });
      }
    }
  }

  // â”€â”€ rooks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    let pieces = position.bitboards[ROOK];
    while (pieces !== 0n) {
      const sq = bitScanForward(pieces);
      pieces &= pieces - 1n;
      const pm = pinMask(sq);
      let atks = getRookAttacks(sq, allOcc) & ~friendlyOcc & checkBB & pm;
      while (atks !== 0n) {
        const to = bitScanForward(atks);
        atks &= atks - 1n;
        moves.push({ from: sq, to, piece: ROOK,
                      tag: (enemyOcc & SQUARE_BBS[to]) !== 0n ? TAG_CAPTURE : TAG_NONE });
      }
    }
  }

  // â”€â”€ queens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    let pieces = position.bitboards[QUEEN];
    while (pieces !== 0n) {
      const sq = bitScanForward(pieces);
      pieces &= pieces - 1n;
      const pm = pinMask(sq);
      let atks = getQueenAttacks(sq, allOcc) & ~friendlyOcc & checkBB & pm;
      while (atks !== 0n) {
        const to = bitScanForward(atks);
        atks &= atks - 1n;
        moves.push({ from: sq, to, piece: QUEEN,
                      tag: (enemyOcc & SQUARE_BBS[to]) !== 0n ? TAG_CAPTURE : TAG_NONE });
      }
    }
  }

  // â”€â”€ pawns â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (isWhite) {
    _generateWhitePawnMoves(position, moves, friendlyOcc, enemyOcc, allOcc,
                            checkBB, checkCount, kingSq, pinMask);
  } else {
    _generateBlackPawnMoves(position, moves, friendlyOcc, enemyOcc, allOcc,
                            checkBB, checkCount, kingSq, pinMask);
  }

  return moves;
}

// â”€â”€ White pawn move generation (internal) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function _generateWhitePawnMoves(position, moves, friendlyOcc, enemyOcc, allOcc,
                                  checkBB, checkCount, kingSq, pinMask) {
  let pawns = position.bitboards[WP];

  while (pawns !== 0n) {
    const sq = bitScanForward(pawns);
    pawns &= pawns - 1n;
    const pm = pinMask(sq);
    const onRank7 = (SQUARE_BBS[sq] & RANK_7_BITBOARD) !== 0n;
    const onRank2 = (SQUARE_BBS[sq] & RANK_2_BITBOARD) !== 0n;

    // â”€â”€ forward push â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const fwd = sq - 8;
    if (fwd >= 0 && (SQUARE_BBS[fwd] & allOcc) === 0n) {
      if ((SQUARE_BBS[fwd] & checkBB & pm) !== 0n) {
        if (onRank7) {
          moves.push({ from: sq, to: fwd, piece: WP, tag: TAG_WQueenPromotion });
          moves.push({ from: sq, to: fwd, piece: WP, tag: TAG_WRookPromotion });
          moves.push({ from: sq, to: fwd, piece: WP, tag: TAG_WBishopPromotion });
          moves.push({ from: sq, to: fwd, piece: WP, tag: TAG_WKnightPromotion });
        } else {
          moves.push({ from: sq, to: fwd, piece: WP, tag: TAG_NONE });
        }
      }

      // â”€â”€ double push from rank 2 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      if (onRank2) {
        const dbl = sq - 16;
        if ((SQUARE_BBS[dbl] & allOcc) === 0n &&
            (SQUARE_BBS[dbl] & checkBB & pm) !== 0n) {
          moves.push({ from: sq, to: dbl, piece: WP, tag: TAG_DoublePawnWhite });
        }
      }
    }

    // â”€â”€ captures â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    let caps = WHITE_PAWN_ATTACKS[sq] & enemyOcc & checkBB & pm;
    while (caps !== 0n) {
      const to = bitScanForward(caps);
      caps &= caps - 1n;
      if (onRank7) {
        moves.push({ from: sq, to, piece: WP, tag: TAG_WCaptureQueenPromotion });
        moves.push({ from: sq, to, piece: WP, tag: TAG_WCaptureRookPromotion });
        moves.push({ from: sq, to, piece: WP, tag: TAG_WCaptureBishopPromotion });
        moves.push({ from: sq, to, piece: WP, tag: TAG_WCaptureKnightPromotion });
      } else {
        moves.push({ from: sq, to, piece: WP, tag: TAG_CAPTURE });
      }
    }

    // â”€â”€ en passant â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (position.enPassantSquare !== -1) {
      const epTarget = position.enPassantSquare;
      if ((WHITE_PAWN_ATTACKS[sq] & SQUARE_BBS[epTarget]) !== 0n) {
        const capturedSq = epTarget + 8; // black pawn sits one rank below target
        // Check masking: EP resolves check if the target square or the
        // captured-pawn square is in the check mask
        if (((SQUARE_BBS[epTarget] | SQUARE_BBS[capturedSq]) & checkBB) !== 0n) {
          // Pin mask: target must be on pin line (or pawn not pinned)
          if ((SQUARE_BBS[epTarget] & pm) !== 0n) {
            // Horizontal pin (phantom pin through both pawns on rank 5)
            if (!isEPHorizontallyPinned(position, sq, capturedSq, kingSq)) {
              moves.push({ from: sq, to: epTarget, piece: WP, tag: TAG_WHITEEP });
            }
          }
        }
      }
    }
  }
}

// â”€â”€ Black pawn move generation (internal) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function _generateBlackPawnMoves(position, moves, friendlyOcc, enemyOcc, allOcc,
                                  checkBB, checkCount, kingSq, pinMask) {
  let pawns = position.bitboards[BP];

  while (pawns !== 0n) {
    const sq = bitScanForward(pawns);
    pawns &= pawns - 1n;
    const pm = pinMask(sq);
    const onRank2 = (SQUARE_BBS[sq] & RANK_2_BITBOARD) !== 0n;
    const onRank7 = (SQUARE_BBS[sq] & RANK_7_BITBOARD) !== 0n;

    // â”€â”€ forward push â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const fwd = sq + 8;
    if (fwd <= 63 && (SQUARE_BBS[fwd] & allOcc) === 0n) {
      if ((SQUARE_BBS[fwd] & checkBB & pm) !== 0n) {
        if (onRank2) {
          // promoting
          moves.push({ from: sq, to: fwd, piece: BP, tag: TAG_BQueenPromotion });
          moves.push({ from: sq, to: fwd, piece: BP, tag: TAG_BRookPromotion });
          moves.push({ from: sq, to: fwd, piece: BP, tag: TAG_BBishopPromotion });
          moves.push({ from: sq, to: fwd, piece: BP, tag: TAG_BKnightPromotion });
        } else {
          moves.push({ from: sq, to: fwd, piece: BP, tag: TAG_NONE });
        }
      }

      // â”€â”€ double push from rank 7 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      if (onRank7) {
        const dbl = sq + 16;
        if ((SQUARE_BBS[dbl] & allOcc) === 0n &&
            (SQUARE_BBS[dbl] & checkBB & pm) !== 0n) {
          moves.push({ from: sq, to: dbl, piece: BP, tag: TAG_DoublePawnBlack });
        }
      }
    }

    // â”€â”€ captures â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    let caps = BLACK_PAWN_ATTACKS[sq] & enemyOcc & checkBB & pm;
    while (caps !== 0n) {
      const to = bitScanForward(caps);
      caps &= caps - 1n;
      if (onRank2) {
        moves.push({ from: sq, to, piece: BP, tag: TAG_BCaptureQueenPromotion });
        moves.push({ from: sq, to, piece: BP, tag: TAG_BCaptureRookPromotion });
        moves.push({ from: sq, to, piece: BP, tag: TAG_BCaptureBishopPromotion });
        moves.push({ from: sq, to, piece: BP, tag: TAG_BCaptureKnightPromotion });
      } else {
        moves.push({ from: sq, to, piece: BP, tag: TAG_CAPTURE });
      }
    }

    // â”€â”€ en passant â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (position.enPassantSquare !== -1) {
      const epTarget = position.enPassantSquare;
      if ((BLACK_PAWN_ATTACKS[sq] & SQUARE_BBS[epTarget]) !== 0n) {
        const capturedSq = epTarget - 8; // white pawn sits one rank above target
        if (((SQUARE_BBS[epTarget] | SQUARE_BBS[capturedSq]) & checkBB) !== 0n) {
          if ((SQUARE_BBS[epTarget] & pm) !== 0n) {
            if (!isEPHorizontallyPinned(position, sq, capturedSq, kingSq)) {
              moves.push({ from: sq, to: epTarget, piece: BP, tag: TAG_BLACKEP });
            }
          }
        }
      }
    }
  }
}
