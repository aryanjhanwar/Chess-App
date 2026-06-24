/**
 * src/components/CapturedPiecesList.jsx
 *
 * Shared, presentation-only component that displays captured chess pieces
 * and material advantage count.
 *
 * Accepts two input formats:
 *
 * 1. **Array format** (main play app / bitboard engine):
 *    Pass `capturedPieces` as a string array of piece codes, e.g.:
 *    ['bN', 'bp', 'bR', 'bN']
 *    This is what `useGameEngine` returns.
 *
 * 2. **FEN format** (analysis app / chess.js):
 *    Pass `fen` as a FEN string and `color` as 'w' | 'b'.
 *    The component will compute captures from the position.
 *
 * The `pieceStyle` prop controls the piece image set (default: 'staunty').
 */

import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { buildPieceImages } from '../constants/theme';
import { pieceStyleAtom } from '../state/themeState';

// ── Piece value map for material advantage calculation ─────────────────────
const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9 };

// ── Piece order for display (most to least valuable) ──────────────────────
const PIECE_DISPLAY_ORDER = ['q', 'r', 'b', 'n', 'p'];

/**
 * Group an array of piece codes by type and count duplicates.
 * Accepts codes like 'bN', 'bp', 'wR' (bitboard format) or
 * single-char piece symbols ('q','r','b','n','p') in FEN format.
 *
 * @param {string[]} pieces - Array of piece codes.
 * @returns {{ [type: string]: number }} - Map of piece type → count.
 */
function groupByType(pieces) {
  const groups = {};
  for (const code of pieces) {
    // Bitboard format: 'bN' → type 'n', 'wQ' → type 'q'
    const raw = code.length >= 2 ? code[1] : code;
    const type = raw.toLowerCase();
    if (PIECE_DISPLAY_ORDER.includes(type)) {
      groups[type] = (groups[type] || 0) + 1;
    }
  }
  return groups;
}

/**
 * Compute material advantage from two grouped-piece maps.
 * Returns a positive number if the player has the advantage.
 *
 * @param {{ [type: string]: number }} playerGroups
 * @param {{ [type: string]: number }} opponentGroups
 * @returns {number}
 */
function computeAdvantage(playerGroups, opponentGroups) {
  let advantage = 0;
  for (const type of PIECE_DISPLAY_ORDER) {
    const mine  = playerGroups[type]  || 0;
    const theirs = opponentGroups[type] || 0;
    advantage += (mine - theirs) * (PIECE_VALUES[type] || 0);
  }
  return advantage;
}

/**
 * Derive captured pieces from a FEN string using the starting material.
 * Returns { white: string[], black: string[] } — pieces captured by each side.
 */
function capturesFromFen(fen) {
  if (!fen) return { white: [], black: [] };

  // Starting material counts
  const start = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 };
  const current = { white: {}, black: {} };

  const rankSection = fen.split(' ')[0];
  for (const ch of rankSection) {
    if (ch === '/') continue;
    if (!isNaN(ch)) continue;
    const lower = ch.toLowerCase();
    if (!['p','n','b','r','q','k'].includes(lower)) continue;
    const side = ch === ch.toUpperCase() ? 'white' : 'black';
    current[side][lower] = (current[side][lower] || 0) + 1;
  }

  const whiteCaptured = [];
  const blackCaptured = [];

  for (const type of Object.keys(start)) {
    const startCount = start[type];
    const whiteRemain = current.white[type] || 0;
    const blackRemain = current.black[type] || 0;

    // Black captured white pieces
    const whiteLost = Math.max(0, startCount - whiteRemain);
    for (let i = 0; i < whiteLost; i++) blackCaptured.push(`w${type.toUpperCase()}`);

    // White captured black pieces
    const blackLost = Math.max(0, startCount - blackRemain);
    for (let i = 0; i < blackLost; i++) whiteCaptured.push(`b${type.toUpperCase()}`);
  }

  return { white: whiteCaptured, black: blackCaptured };
}

// ── Component ─────────────────────────────────────────────────────────────

export default function CapturedPiecesList({
  // Array format (main app)
  capturedPieces,
  opponentCapturedPieces,

  // FEN format (analysis app)
  fen,
  /** 'w' | 'b' — which side's captures to show (used with FEN format). */
  color,

  /** Piece image set name (optional, overrides global state). */
  pieceStyle,

  /** Visual scale factor (default matches the analysis app's 0.55rem scale). */
  scale = 0.55,
}) {
  // ── Resolve captured piece arrays ──────────────────────────────────────
  const { playerPieces, opponentPieces } = useMemo(() => {
    if (fen) {
      // FEN mode
      const { white, black } = capturesFromFen(fen);
      if (color === 'w' || color === 'white') {
        return { playerPieces: white, opponentPieces: black };
      }
      return { playerPieces: black, opponentPieces: white };
    }
    // Array mode
    return {
      playerPieces: Array.isArray(capturedPieces) ? capturedPieces : [],
      opponentPieces: Array.isArray(opponentCapturedPieces) ? opponentCapturedPieces : [],
    };
  }, [fen, color, capturedPieces, opponentCapturedPieces]);

  const playerGroups   = useMemo(() => groupByType(playerPieces),   [playerPieces]);
  const opponentGroups = useMemo(() => groupByType(opponentPieces), [opponentPieces]);
  const advantage      = useMemo(() => computeAdvantage(playerGroups, opponentGroups), [playerGroups, opponentGroups]);

  const rem = (n) => `${n * scale}rem`;

  const globalPieceStyle = useAtomValue(pieceStyleAtom);
  const activePieceStyle = pieceStyle || globalPieceStyle || 'staunty';
  const pieceImages = useMemo(() => buildPieceImages(activePieceStyle), [activePieceStyle]);

  const captureColorChar = useMemo(() => {
    if (color === 'b' || color === 'black') return 'w';
    if (color === 'w' || color === 'white') return 'b';
    if (playerPieces.length > 0 && playerPieces[0].length >= 2) return playerPieces[0][0];
    return 'b';
  }, [color, playerPieces]);

  const getImageSrc = (type) => {
    const typeChar = type.toLowerCase() === 'p' ? 'p' : type.toUpperCase();
    return pieceImages[`${captureColorChar}${typeChar}`];
  };

  const orderedEntries = PIECE_DISPLAY_ORDER
    .map((type) => ({ type, count: playerGroups[type] || 0 }))
    .filter(({ count }) => count > 0);

  if (orderedEntries.length === 0 && advantage <= 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        marginLeft: `-${0.3 * scale}rem`,
        flexWrap: 'nowrap',
        overflow: 'visible',
      }}
    >
      {orderedEntries.map(({ type, count }) => (
        <div
          key={type}
          style={{
            position: 'relative',
            display: 'inline-flex',
            marginRight: `0.05rem`,
          }}
        >
          <img
            src={getImageSrc(type)}
            alt=""
            style={{
              width: rem(2.6),
              height: rem(2.6),
              objectFit: 'contain',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
            draggable="false"
          />
          {count > 1 && (
            <div
              style={{
                position: 'absolute',
                bottom: rem(-0.2),
                right: rem(-0.2),
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                color: 'white',
                borderRadius: '50%',
                width: rem(1.35),
                height: rem(1.35),
                fontSize: rem(0.85),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                zIndex: 10,
              }}
            >
              {count}
            </div>
          )}
        </div>
      ))}

      {advantage > 0 && (
        <span
          style={{
            fontSize: rem(1.6),
            marginLeft: '0.2rem',
            color: 'rgba(255,255,255,0.75)',
            fontWeight: 600,
          }}
        >
          +{advantage}
        </span>
      )}
    </div>
  );
}
