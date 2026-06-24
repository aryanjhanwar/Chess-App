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

import { atom } from 'jotai';
import { pieceStyleAtom, boardThemeAtom } from '@/state/themeState';
import { BOARD_THEME_MAP } from '@/constants/boardThemes';
import tinycolor from 'tinycolor2';

// Reference colour for hue-rotation (the default classic-blue dark square)
const REFERENCE_COLOR = '#a8c1cf';

/**
 * Map a named board theme key (e.g. 'classic-blue', 'green', 'wood') to
 * the hue-rotation degree used by the analysis board renderer.
 *
 * Returns 0 for the default 'classic-blue' theme (no rotation needed).
 */
function themeKeyToHue(themeKey) {
  const theme = BOARD_THEME_MAP[themeKey];
  if (!theme) return 0;

  const refHue  = tinycolor(REFERENCE_COLOR).toHsl().h;
  const themeHue = tinycolor(theme.dark).toHsl().h;

  let delta = themeHue - refHue;
  // Normalise to [-180, 180] range
  if (delta > 180)  delta -= 360;
  if (delta < -180) delta += 360;

  return Math.round(delta);
}

/**
 * The active chess piece set for the analysis board.
 * Derived from the unified UI settings so it stays in sync with main-app settings.
 */
export const pieceSetAtom = pieceStyleAtom;

/**
 * Hue-rotation degrees for the analysis board squares.
 * Derived from the named board theme in the unified UI settings.
 * Reading this atom does NOT cause a write to localStorage — it is computed.
 */
export const boardHueAtom = atom((get) => {
  const themeKey = get(boardThemeAtom);
  return themeKeyToHue(themeKey);
});
