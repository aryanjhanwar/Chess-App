/**
 * src/features/settings/useUiSettings.js
 *
 * Drop-in replacement for the previous useState-based settings hook.
 * Now backed by `uiSettingsAtom` from the unified Jotai state layer so that
 * any settings change is immediately visible on all screens (play, review,
 * analysis) without a page reload or manual localStorage.setItem call.
 *
 * The public API surface is intentionally identical to the previous version
 * so that App.jsx call-sites require zero changes.
 */

import { useAtom, useSetAtom } from 'jotai';
import {
  uiSettingsAtom,
  applyUiSettingsAtom,
  applyThemePresetAtom,
  resetVisualSettingsAtom,
} from '@/state/themeState';

/**
 * @param {object} _STORAGE_KEYS - Legacy parameter, kept for backward-compat.
 *   The storage key is now managed by the atom itself.
 */
export function useUiSettings(_STORAGE_KEYS) {
  const [uiSettings, setUiSettings] = useAtom(uiSettingsAtom);
  const applySettings   = useSetAtom(applyUiSettingsAtom);
  const applyPreset     = useSetAtom(applyThemePresetAtom);
  const resetVisual     = useSetAtom(resetVisualSettingsAtom);

  /**
   * Apply a partial settings update.
   * Pass `{ fromThemePreset: true }` as the second argument when applying a
   * full preset so that `appThemePreset` is not automatically reset to 'custom'.
   *
   * @param {Partial<UiSettings>} partial
   * @param {{ fromThemePreset?: boolean }} [options]
   */
  const handleUiSettingsChange = (partial, options = {}) => {
    applySettings(partial, options);
  };

  /**
   * Apply a named theme preset, overriding all theme-scope settings at once.
   * @param {string} presetId - Key from THEME_PRESET_MAP (e.g. 'classic', 'dark-forest').
   */
  const handleApplyThemePreset = (presetId) => {
    applyPreset(presetId);
  };

  /**
   * Reset all visual settings back to the 'classic' preset defaults.
   */
  const handleResetVisualSettings = () => {
    resetVisual();
  };

  return {
    uiSettings,
    /** Direct atom setter — prefer handleUiSettingsChange for normal usage. */
    setUiSettings,
    handleUiSettingsChange,
    handleApplyThemePreset,
    handleResetVisualSettings,
  };
}