/**
 * src/state/themeState.js
 *
 * Unified Jotai atom for UI appearance settings (board theme, piece style,
 * volume, background, etc.). Uses `atomWithStorage` so that changes made on
 * any screen are immediately persisted and visible to all other screens on
 * the next read — no manual localStorage.setItem calls required.
 *
 * Import `uiSettingsAtom` anywhere in the app to read or write settings.
 * Derived atoms (pieceStyleAtom, boardThemeAtom, volumeAtom) are available
 * as lightweight subscriptions that only re-render the component when their
 * specific slice of settings changes.
 */

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { DEFAULT_UI_SETTINGS } from '@/constants/boardThemes';
import { sanitizeUiSettings, THEME_SCOPE_KEYS } from '@/features/settings/storage';
import { THEME_PRESET_MAP } from '@/constants/uiPresets';

// ── Storage key (must match what App.jsx uses to preserve existing preferences) ─
const STORAGE_KEY = 'chess_ui_settings_v1';

// ── Custom storage adapter with sanitization ──────────────────────────────────
const uiSettingsStorage = {
  getItem(key, initialValue) {
    if (typeof window === 'undefined') return initialValue;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return initialValue;
      return sanitizeUiSettings(JSON.parse(raw));
    } catch {
      return initialValue;
    }
  },
  setItem(key, value) {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch { /* storage quota exceeded — silently ignore */ }
  },
  removeItem(key) {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  },
};

// ── Primary persisted atom ────────────────────────────────────────────────────
/**
 * The single source of truth for all visual/audio preferences.
 * Reading this atom gives the sanitized settings object.
 * Writing to it automatically persists to localStorage.
 */
export const uiSettingsAtom = atomWithStorage(
  STORAGE_KEY,
  sanitizeUiSettings(DEFAULT_UI_SETTINGS),
  uiSettingsStorage,
  { getOnInit: true }
);

// ── Derived read-only atoms ───────────────────────────────────────────────────
// Use these in components that only care about one slice of settings to
// avoid unnecessary re-renders when unrelated settings change.

/** The active chess piece graphics set (e.g. 'staunty', 'tatiana', 'alpha'). */
export const pieceStyleAtom = atom((get) => get(uiSettingsAtom).pieceStyle);

/** The active board colour theme key (e.g. 'classic-blue', 'emerald-green'). */
export const boardThemeAtom = atom((get) => get(uiSettingsAtom).boardTheme);

/** The active board surface/texture key. */
export const boardSurfaceAtom = atom((get) => get(uiSettingsAtom).boardSurface);

/** The active board texture overlay key. */
export const boardTextureAtom = atom((get) => get(uiSettingsAtom).boardTexture);

/** The master sound volume, 0–1. */
export const volumeAtom = atom((get) => get(uiSettingsAtom).volume);

/** Whether custom board square colours are in use. */
export const useCustomBoardColorsAtom = atom((get) => get(uiSettingsAtom).useCustomBoardColors);

/** Current light-square color (custom or from theme). */
export const lightSquareAtom = atom((get) => {
  const s = get(uiSettingsAtom);
  return s.useCustomBoardColors ? s.customLightSquare : null;
});

/** Current dark-square color (custom or from theme). */
export const darkSquareAtom = atom((get) => {
  const s = get(uiSettingsAtom);
  return s.useCustomBoardColors ? s.customDarkSquare : null;
});

// ── Write helpers ─────────────────────────────────────────────────────────────

/**
 * Atom action that applies a partial settings update.
 * Automatically marks `appThemePreset` as 'custom' when any theme-scope key
 * changes, unless `fromThemePreset: true` is passed in the options.
 *
 * Usage in a component:
 *   const applySettings = useSetAtom(applyUiSettingsAtom);
 *   applySettings({ pieceStyle: 'alpha' });
 */
export const applyUiSettingsAtom = atom(
  null,
  (get, set, partial, options = {}) => {
    const prev = get(uiSettingsAtom);
    const fromThemePreset = options?.fromThemePreset === true;

    const next = sanitizeUiSettings({ ...prev, ...partial });

    if (!fromThemePreset) {
      const touchesThemeScope = Object.keys(partial || {}).some(
        (key) => THEME_SCOPE_KEYS.has(key)
      );
      if (touchesThemeScope) {
        next.appThemePreset = 'custom';
      }
    }

    set(uiSettingsAtom, next);
  }
);

/**
 * Atom action that applies a named theme preset (e.g. 'classic', 'dark-forest').
 *
 * Usage:
 *   const applyPreset = useSetAtom(applyThemePresetAtom);
 *   applyPreset('dark-forest');
 */
export const applyThemePresetAtom = atom(
  null,
  (get, set, presetId) => {
    const preset = THEME_PRESET_MAP[presetId];
    if (!preset) return;

    const prev = get(uiSettingsAtom);
    const next = sanitizeUiSettings({
      ...prev,
      appThemePreset: presetId,
      ...preset,
    });
    set(uiSettingsAtom, next);
  }
);

/**
 * Atom action that resets all visual settings to the 'classic' preset.
 */
export const resetVisualSettingsAtom = atom(null, (get, set) => {
  const prev = get(uiSettingsAtom);
  const preset = THEME_PRESET_MAP['classic'] || {};
  const next = sanitizeUiSettings({
    ...prev,
    appThemePreset: 'classic',
    ...preset,
    customLightSquare: DEFAULT_UI_SETTINGS.customLightSquare,
    customDarkSquare: DEFAULT_UI_SETTINGS.customDarkSquare,
  });
  set(uiSettingsAtom, next);
});
