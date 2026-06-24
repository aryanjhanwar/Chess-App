/**
 * src/state/appState.js
 *
 * Jotai atoms for top-level application routing state.
 * This replaces the `entryMode` useState in App.jsx, making the active screen
 * readable by any component without prop-drilling.
 */

import { atom } from 'jotai';

// ── Navigation / Screen mode ──────────────────────────────────────────────────

/**
 * The currently active top-level screen.
 *
 * Valid values:
 *  - 'mode_select'       — Home / mode selection screen
 *  - 'multiplayer_lobby' — PeerJS lobby for remote games
 *  - 'local_game'        — Active chess game (local / vs AI / vs remote)
 *  - 'game_over'         — Post-game result overlay state
 *  - 'review'            — Move-by-move game review / analysis
 */
export const entryModeAtom = atom('mode_select');

// ── Board interaction state ───────────────────────────────────────────────────

/**
 * Whether the board is in "flipped" orientation (Black on bottom).
 * Shared between the board view and the evaluation bar.
 */
export const isBoardFlippedAtom = atom(false);

/**
 * The currently selected square on the board (for click-to-move UI).
 * Stored as a grid coordinate: { row: number, col: number } | null
 */
export const selectedSquareAtom = atom(null);

// ── Game settings (runtime) ───────────────────────────────────────────────────

/**
 * The currently active game mode within a local_game session.
 * 'local' | 'computer' | 'multiplayer'
 */
export const gameModeAtom = atom('local');

/**
 * The current player colour when playing vs computer.
 * 'w' | 'b'
 */
export const playerColorAtom = atom('w');

/**
 * Computer difficulty level (0–20 Stockfish skill level).
 */
export const computerDifficultyAtom = atom(10);
