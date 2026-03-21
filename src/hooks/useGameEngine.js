/**
 * useGameEngine — Persistent Position + useRef + renderTick
 *
 * The bitboard Position object is the single source of truth.
 * React only re-renders when renderTick bumps (once per user / computer move).
 */

import { useRef, useState, useMemo, useCallback } from 'react';
import { createStartingPosition } from '../engine/bitboard/position.js';
import {
  generateLegalMoves_v2,
  makeMove_v2,
  unmakeMove_v2,
  isInCheck
} from '../engine/bitboard/moveGen.js';
import {
  WP, WN, WB, WR, WQ, WK,
  BP, BN, BB, BR, BQ, BK,
  TAG_WHITEEP, TAG_BLACKEP,
  TAG_WCASTLEKS, TAG_WCASTLEQS, TAG_BCASTLEKS, TAG_BCASTLEQS,
  TAG_BKnightPromotion, TAG_BBishopPromotion, TAG_BQueenPromotion, TAG_BRookPromotion,
  TAG_WKnightPromotion, TAG_WBishopPromotion, TAG_WQueenPromotion, TAG_WRookPromotion,
  TAG_BCaptureKnightPromotion, TAG_BCaptureBishopPromotion,
  TAG_BCaptureQueenPromotion, TAG_BCaptureRookPromotion,
  TAG_WCaptureKnightPromotion, TAG_WCaptureBishopPromotion,
  TAG_WCaptureQueenPromotion, TAG_WCaptureRookPromotion,
  TAG_DoublePawnWhite, TAG_DoublePawnBlack,
} from '../engine/bitboard/constants.js';
import { bitScanForward } from '../engine/bitboard/utils.js';
import { getNotationV2 } from '../engine/notation.js';

// ========================================
// PIECE STRING MAPPING (bitboard index → React piece code)
// ========================================
const PIECE_CHARS = [
  'wp', 'wN', 'wB', 'wR', 'wQ', 'wK',
  'bp', 'bN', 'bB', 'bR', 'bQ', 'bK'
];

// ========================================
// TAG HELPER SETS
// ========================================
const QUEEN_PROMO_TAGS = new Set([
  TAG_WQueenPromotion, TAG_BQueenPromotion,
  TAG_WCaptureQueenPromotion, TAG_BCaptureQueenPromotion
]);
const ROOK_PROMO_TAGS = new Set([
  TAG_WRookPromotion, TAG_BRookPromotion,
  TAG_WCaptureRookPromotion, TAG_BCaptureRookPromotion
]);
const BISHOP_PROMO_TAGS = new Set([
  TAG_WBishopPromotion, TAG_BBishopPromotion,
  TAG_WCaptureBishopPromotion, TAG_BCaptureBishopPromotion
]);
const KNIGHT_PROMO_TAGS = new Set([
  TAG_WKnightPromotion, TAG_BKnightPromotion,
  TAG_WCaptureKnightPromotion, TAG_BCaptureKnightPromotion
]);
const ALL_PROMO_TAGS = new Set([
  ...QUEEN_PROMO_TAGS, ...ROOK_PROMO_TAGS,
  ...BISHOP_PROMO_TAGS, ...KNIGHT_PROMO_TAGS
]);
const CASTLING_TAGS = new Set([
  TAG_WCASTLEKS, TAG_WCASTLEQS, TAG_BCASTLEKS, TAG_BCASTLEQS
]);
const EP_TAGS = new Set([TAG_WHITEEP, TAG_BLACKEP]);

// ========================================
// EXPORTED TAG HELPERS
// ========================================
export function isPromotionTag(tag) { return ALL_PROMO_TAGS.has(tag); }
export function isCastlingTag(tag) { return CASTLING_TAGS.has(tag); }
export function isEPTag(tag) { return EP_TAGS.has(tag); }

export function getPromotionPieceType(tag) {
  if (QUEEN_PROMO_TAGS.has(tag)) return 'Q';
  if (ROOK_PROMO_TAGS.has(tag)) return 'R';
  if (BISHOP_PROMO_TAGS.has(tag)) return 'B';
  if (KNIGHT_PROMO_TAGS.has(tag)) return 'N';
  return null;
}

// ========================================
// PURE FUNCTIONS
// ========================================

/**
 * Derive an 8×8 string array from a bitboard Position.
 * Same format as the old React `board` state — ChessBoardView compatible.
 */
function positionToDisplayPieces(position) {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let piece = 0; piece < 12; piece++) {
    let bb = position.bitboards[piece];
    while (bb !== 0n) {
      const sq = bitScanForward(bb);
      bb &= bb - 1n;
      board[sq >> 3][sq & 7] = PIECE_CHARS[piece];
    }
  }
  return board;
}

/**
 * Generate a Map<fromSquare, Move[]> of all legal moves.
 */
function buildLegalMovesMap(position) {
  const moves = generateLegalMoves_v2(position);
  const map = new Map();
  for (const move of moves) {
    if (!map.has(move.from)) map.set(move.from, []);
    map.get(move.from).push(move);
  }
  return map;
}

/**
 * Convert a UCI string (e.g. "e2e4", "e7e8q") to a v2 move object
 * by looking up the matching entry in the legalMovesMap.
 */
export function uciToV2Move(uciStr, legalMovesMap) {
  if (!uciStr || uciStr.length < 4) return null;
  const fromCol = uciStr.charCodeAt(0) - 97;
  const fromRow = 8 - parseInt(uciStr[1]);
  const toCol   = uciStr.charCodeAt(2) - 97;
  const toRow   = 8 - parseInt(uciStr[3]);
  const promo   = uciStr.length === 5 ? uciStr[4].toLowerCase() : null;

  const fromSq = fromRow * 8 + fromCol;
  const toSq   = toRow * 8 + toCol;

  const moves = legalMovesMap.get(fromSq) || [];

  if (promo) {
    let promoSet;
    switch (promo) {
      case 'q': promoSet = QUEEN_PROMO_TAGS; break;
      case 'r': promoSet = ROOK_PROMO_TAGS; break;
      case 'b': promoSet = BISHOP_PROMO_TAGS; break;
      case 'n': promoSet = KNIGHT_PROMO_TAGS; break;
      default: return null;
    }
    return moves.find(m => m.to === toSq && promoSet.has(m.tag)) || null;
  }

  // Non-promotion: prefer exact non-promo match, but fall back to any
  return moves.find(m => m.to === toSq && !ALL_PROMO_TAGS.has(m.tag)) || null;
}

// ========================================
// HOOK
// ========================================

export function useGameEngine() {
  // ── Engine state (invisible to React) ──────────────────────────────
  const positionRef = useRef(createStartingPosition());
  const historyRef  = useRef([]);   // { move, savedState, notation, ... }
  const capturedRef = useRef({ w: [], b: [] });

  // ── React trigger ──────────────────────────────────────────────────
  const [renderTick, setRenderTick] = useState(0);
  const bumpRender = useCallback(() => setRenderTick(t => t + 1), []);

  // ── Derived state (recomputed on renderTick only) ──────────────────

  const displayPieces = useMemo(
    () => positionToDisplayPieces(positionRef.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [renderTick]
  );

  const legalMovesMap = useMemo(
    () => buildLegalMovesMap(positionRef.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [renderTick]
  );

  const fen = useMemo(
    () => positionRef.current.toFEN(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [renderTick]
  );

  const checkInfo = useMemo(() => {
    const pos = positionRef.current;
    const inCheck = isInCheck(pos);
    let kingSquare = null;
    if (inCheck) {
      const kingSq = bitScanForward(
        pos.bitboards[pos.sideToMove === 0 ? WK : BK]
      );
      kingSquare = { row: kingSq >> 3, col: kingSq & 7 };
    }
    return { inCheck, kingSquare };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderTick]);

  const gameStatus = useMemo(() => {
    if (legalMovesMap.size === 0) {
      return checkInfo.inCheck ? 'checkmate' : 'stalemate';
    }
    return 'playing';
  }, [legalMovesMap, checkInfo]);

  const sideToMove = useMemo(
    () => positionRef.current.sideToMove === 0 ? 'w' : 'b',
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [renderTick]
  );

  const moveHistory = useMemo(
    () => historyRef.current.map(e => e.notation),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [renderTick]
  );

  const capturedPieces = useMemo(
    () => capturedRef.current,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [renderTick]
  );

  const lastMoveInfo = useMemo(() => {
    const h = historyRef.current;
    return h.length > 0 ? h[h.length - 1].lastMoveInfo : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderTick]);

  // ── Actions ────────────────────────────────────────────────────────

  /**
   * Execute a v2 move on the persistent position.
   *
   * @param {{ from:number, to:number, piece:number, tag:number }} move
   * @param {string} [notationBase] - optional override; if omitted, auto-generated via getNotationV2
   * @returns {{ inCheck:boolean, gameStatus:string, notation:string,
   *             wasCapture:boolean, isCastling:boolean, isEnPassant:boolean }}
   */
  const executeMove = useCallback((move, notationBase) => {
    const pos = positionRef.current;

    // Generate notation from bitboard Position BEFORE the move (if not overridden)
    const baseNotation = notationBase ?? getNotationV2(pos, move);

    // Apply the move → returns saved state (includes capturedPiece)
    const savedState = makeMove_v2(pos, move);

    // Track captured pieces for UI
    const cap = savedState.capturedPiece;
    if (cap !== -1) {
      const capColor = cap <= WK ? 'w' : 'b';
      capturedRef.current = {
        ...capturedRef.current,
        [capColor]: [...capturedRef.current[capColor], PIECE_CHARS[cap]]
      };
    }

    // Determine post-move position state
    const newInCheck   = isInCheck(pos);
    const newLegalMoves = generateLegalMoves_v2(pos);
    const newGameStatus =
      newLegalMoves.length === 0
        ? (newInCheck ? 'checkmate' : 'stalemate')
        : 'playing';

    // Finalize notation with check / checkmate symbol
    let notation = baseNotation;
    if (newGameStatus === 'checkmate') notation += '#';
    else if (newInCheck) notation += '+';

    // Build last-move info for board highlighting
    const lastMove = {
      from: { row: move.from >> 3, col: move.from & 7 },
      to:   { row: move.to >> 3,   col: move.to & 7 },
      piece: PIECE_CHARS[move.piece],
      wasCapture:      cap !== -1 || EP_TAGS.has(move.tag),
      isCastling:      CASTLING_TAGS.has(move.tag),
      isDoublePawnPush: move.tag === TAG_DoublePawnWhite || move.tag === TAG_DoublePawnBlack,
      isEnPassant:     EP_TAGS.has(move.tag),
    };

    // King-in-check square for the side-to-move AFTER the move
    let newKingInCheckPos = null;
    if (newInCheck) {
      const kingSq = bitScanForward(
        pos.bitboards[pos.sideToMove === 0 ? WK : BK]
      );
      newKingInCheckPos = { row: kingSq >> 3, col: kingSq & 7 };
    }

    // Accumulative move history (notation strings)
    const prevNotations = historyRef.current.map(e => e.notation);

    // Push to history
    historyRef.current = [...historyRef.current, {
      move,
      savedState,
      notation,
      fen: pos.toFEN(),
      displayPieces: positionToDisplayPieces(pos),
      capturedPieces: {
        w: [...capturedRef.current.w],
        b: [...capturedRef.current.b]
      },
      inCheck: newInCheck,
      kingInCheckPos: newKingInCheckPos,
      lastMoveInfo: lastMove,
      sideToMove: pos.sideToMove === 0 ? 'w' : 'b',
      moveHistory: [...prevNotations, notation],
    }];

    // ONE React re-render
    bumpRender();

    return {
      inCheck: newInCheck,
      gameStatus: newGameStatus,
      notation,
      wasCapture: cap !== -1 || EP_TAGS.has(move.tag),
      isCastling: CASTLING_TAGS.has(move.tag),
      isEnPassant: EP_TAGS.has(move.tag),
    };
  }, [bumpRender]);

  /**
   * Reset game to starting position.
   */
  const resetGame = useCallback(() => {
    positionRef.current = createStartingPosition();
    historyRef.current  = [];
    capturedRef.current = { w: [], b: [] };
    bumpRender();
  }, [bumpRender]);

  /**
   * Build review-mode snapshots.
   * Index 0 = initial position, index N = state after move N.
   */
  const getReviewSnapshots = useCallback(() => {
    const initial = {
      displayPieces: positionToDisplayPieces(createStartingPosition()),
      capturedPieces: { w: [], b: [] },
      inCheck: false,
      kingInCheckPos: null,
      lastMoveInfo: null,
      moveHistory: [],
      sideToMove: 'w',
    };
    const snapshots = [initial];
    for (const entry of historyRef.current) {
      snapshots.push({
        displayPieces: entry.displayPieces,
        capturedPieces: entry.capturedPieces,
        inCheck: entry.inCheck,
        kingInCheckPos: entry.kingInCheckPos,
        lastMoveInfo: entry.lastMoveInfo,
        moveHistory: entry.moveHistory,
        sideToMove: entry.sideToMove,
      });
    }
    return snapshots;
  }, []);

  return {
    // Derived state
    displayPieces,
    legalMovesMap,
    fen,
    checkInfo,
    gameStatus,
    sideToMove,
    moveHistory,
    capturedPieces,
    lastMoveInfo,
    renderTick,

    // Actions
    executeMove,
    resetGame,
    getReviewSnapshots,

    // Refs (escape hatch for Stockfish / review)
    positionRef,
    historyRef,
  };
}
