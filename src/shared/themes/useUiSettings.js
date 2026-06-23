import { useState } from 'react';
import {
  DEFAULT_UI_SETTINGS,
  THEME_PRESET_MAP,
} from '../../constants/boardThemes';

function sanitizeUiSettings(input) {
  const merged = { ...DEFAULT_UI_SETTINGS, ...(input || {}) };

  const legacyPieceMap = {
    neo: 'staunty',
    classic: 'tatiana',
    alpha: 'alpha',
    minimal: 'pixel',
  };

  const mappedPieceStyle =
    legacyPieceMap[merged.pieceStyle] || merged.pieceStyle;

  return {
    ...merged,
    pieceStyle: mappedPieceStyle,
    appThemePreset: merged.appThemePreset || 'custom',
    boardTexture: merged.boardTexture || 'none',
    boardSurface: merged.boardSurface || 'none',
    useCustomBoardColors: Boolean(merged.useCustomBoardColors),
    volume: Math.max(
      0,
      Math.min(
        1,
        Number(merged.volume ?? DEFAULT_UI_SETTINGS.volume)
      )
    ),
  };
}

function readStoredJson(key, fallback) {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(key);

    if (!raw) return fallback;

    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

const THEME_SCOPE_KEYS = new Set([
  'boardTheme',
  'boardSurface',
  'boardTexture',
  'pieceStyle',
  'backgroundStyle',
  'customBackgroundColor',
  'customLightSquare',
  'customDarkSquare',
  'useCustomBoardColors',
]);

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
        const touchesThemeScope =
          Object.keys(partial || {}).some((key) =>
            THEME_SCOPE_KEYS.has(key)
          );

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
      {
        fromThemePreset: true,
      }
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