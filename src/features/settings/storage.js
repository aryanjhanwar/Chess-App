import { DEFAULT_UI_SETTINGS } from '../../constants/boardThemes';

export const THEME_SCOPE_KEYS = new Set([
  'boardTheme',
  'boardSurface',
  'boardTexture',
  'useCustomBoardColors',
  'customLightSquare',
  'customDarkSquare',
  'pieceStyle',
  'backgroundStyle',
  'customBackgroundColor',
]);

export function sanitizeUiSettings(input) {
  const merged = { ...DEFAULT_UI_SETTINGS, ...(input || {}) };
  const legacyPieceMap = {
    neo: 'staunty',
    classic: 'tatiana',
    alpha: 'alpha',
    minimal: 'pixel',
  };
  const mappedPieceStyle = legacyPieceMap[merged.pieceStyle] || merged.pieceStyle;
  return {
    ...merged,
    pieceStyle: mappedPieceStyle,
    appThemePreset: merged.appThemePreset || 'custom',
    boardTexture: merged.boardTexture || 'none',
    boardSurface: merged.boardSurface || 'none',
    useCustomBoardColors: Boolean(merged.useCustomBoardColors),
    volume: Math.max(0, Math.min(1, Number(merged.volume ?? DEFAULT_UI_SETTINGS.volume))),
  };
}

export function readStoredJson(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
