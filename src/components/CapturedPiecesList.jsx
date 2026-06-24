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
import { toPublicPath } from '../utils/assetPath';

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

  /** Piece image set name (e.g. 'staunty', 'tatiana'). */
  pieceStyle = 'staunty',

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

  // Determine opposing color for display (player captured opponent's pieces)
  // In array format, piece codes already encode the captured piece's color.
  // In FEN format, playerPieces are already the correct color.
  const getImageSrc = (pieceCode) => {
    // pieceCode is like 'bN', 'wQ', 'bp', etc.
    const colorChar = pieceCode[0];
    const typeChar  = pieceCode[1]?.toUpperCase() ?? pieceCode[0].toUpperCase();
    return toPublicPath(`piece/${pieceStyle}/${colorChar}${typeChar}.svg`);
  };

  const orderedEntries = PIECE_DISPLAY_ORDER
    .map((type) => ({ type, count: playerGroups[type] || 0 }))
    .filter(({ count }) => count > 0);

  if (orderedEntries.length === 0 && advantage <= 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '0.15rem',
        marginLeft: `-${0.3 * scale}rem`,
        flexWrap: 'nowrap',
        overflow: 'visible',
      }}
    >
      {orderedEntries.map(({ type, count }) => (
        <div
          key={type}
          style={{
            display: 'flex',
            flexDirection: 'row',
            marginRight: `-${1.2 * scale}rem`,
          }}
        >
          {Array.from({ length: count }).map((_, i) => {
            // Reconstruct the piece code based on grouped type
            // For FEN mode: player captures opponent pieces → show opponent color
            const side = (color === 'b' || color === 'black') ? 'w' : 'b';
            const code = `${side}${type.toUpperCase()}`;
            return (
              <img
                key={`${type}-${i}`}
                src={getImageSrc(code)}
                alt={code}
                style={{
                  width: rem(2),
                  height: rem(2),
                  objectFit: 'contain',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
                draggable="false"
              />
            );
          })}
        </div>
      ))}

      {advantage > 0 && (
        <span
          style={{
            fontSize: rem(1.5),
            lineHeight: rem(1.5),
            marginLeft: `${0.3 + 1.2 * scale}rem`,
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
