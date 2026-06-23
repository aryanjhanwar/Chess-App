import { useState } from 'react';
import { DEFAULT_UI_SETTINGS } from '../../constants/boardThemes';
import { THEME_PRESET_MAP } from '../../constants/uiPresets';
import {
  THEME_SCOPE_KEYS,
  sanitizeUiSettings,
  readStoredJson,
} from './storage';

export function useUiSettings(STORAGE_KEYS) {
  const [uiSettings, setUiSettings] = useState(() => {
    const stored = readStoredJson(
      STORAGE_KEYS.UI_SETTINGS,
      DEFAULT_UI_SETTINGS
    );

    return sanitizeUiSettings(stored);
  });

  const handleUiSettingsChange = (
    partial,
    options = {}
  ) => {
    const fromThemePreset =
      options.fromThemePreset === true;

    setUiSettings((prev) => {
      const next = sanitizeUiSettings({
        ...prev,
        ...partial,
      });

      if (!fromThemePreset) {
        const touchesThemeScope = Object.keys(
          partial || {}
        ).some((key) => THEME_SCOPE_KEYS.has(key));

        if (touchesThemeScope) {
          next.appThemePreset = 'custom';
        }
      }

      return next;
    });
  };

  const handleApplyThemePreset = (presetId) => {
    const preset = THEME_PRESET_MAP[presetId];

    if (!preset) return;

    handleUiSettingsChange(
      {
        appThemePreset: presetId,
        ...preset,
      },
      { fromThemePreset: true }
    );
  };

  const handleResetVisualSettings = () => {
    handleApplyThemePreset('classic');

    setUiSettings((prev) =>
      sanitizeUiSettings({
        ...prev,
        appThemePreset: 'classic',
        ...THEME_PRESET_MAP.classic,
        customLightSquare:
          DEFAULT_UI_SETTINGS.customLightSquare,
        customDarkSquare:
          DEFAULT_UI_SETTINGS.customDarkSquare,
      })
    );
  };

  return {
    uiSettings,
    setUiSettings,
    handleUiSettingsChange,
    handleApplyThemePreset,
    handleResetVisualSettings,
  };
}