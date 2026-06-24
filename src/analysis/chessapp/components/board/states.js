/**
 * @file analysis/chessapp/components/board/states.js
 *
 * Board-level Jotai atoms for the analysis app.
 *
 * `pieceSetAtom` and `boardHueAtom` now derive from the unified
 * `uiSettingsAtom` so that changing piece style or board theme in the
 * main app's Settings modal instantly applies to the analysis board too.
 *
 * The hue-rotation degree is mapped from the main app's named board theme:
 * we use the base 'classic-blue' theme as the reference colour and compute
 * the hue distance to each named theme's dark-square colour.
 */

import { pieceStyleAtom } from '@/state/themeState';

/**
 * The active chess piece set for the analysis board.
 * Derived from the unified UI settings so it stays in sync with main-app settings.
 */
export const pieceSetAtom = pieceStyleAtom;
