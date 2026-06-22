import { toAssetPath } from '../utils/assetPath.js';
import { BOARD_IMAGE_MAP } from './boardThemes.js';

export const THEME_PRESETS = [
  {
    id: 'classic',
    label: 'Classic',
    boardTheme: 'classic-blue',
    boardSurface: 'none',
    useCustomBoardColors: false,
    pieceStyle: 'staunty',
    backgroundStyle: 'bg-classic',
    swatch: 'linear-gradient(135deg, #eaf2f6 0%, #a8c1cf 48%, #0bb0e5 100%)',
  },
  {
    id: 'modern-blue',
    label: 'Modern Blue',
    boardTheme: 'blue',
    boardSurface: 'none',
    useCustomBoardColors: false,
    pieceStyle: 'modern',
    backgroundStyle: 'bg-modern-blue',
    swatch: 'linear-gradient(135deg, #dbeaf4 0%, #7ea7c7 42%, #1b78b1 100%)',
  },
  {
    id: 'dark-pro',
    label: 'Dark Pro',
    boardTheme: 'dark-minimal',
    boardSurface: 'none',
    useCustomBoardColors: false,
    pieceStyle: 'neo',
    backgroundStyle: 'bg-dark-pro',
    swatch: 'linear-gradient(135deg, #111827 0%, #4b5563 46%, #0f172a 100%)',
  },
  {
    id: 'wooden-master',
    label: 'Wooden Master',
    boardTheme: 'wood',
    boardSurface: 'none',
    useCustomBoardColors: false,
    pieceStyle: 'wood',
    backgroundStyle: 'bg-wooden-master',
    swatch: 'linear-gradient(135deg, #f1dfc0 0%, #b38b6d 45%, #5c3b23 100%)',
  },
  {
    id: 'neon-cyber',
    label: 'Neon / Cyber',
    boardTheme: 'neon',
    boardSurface: 'none',
    useCustomBoardColors: false,
    pieceStyle: 'neon',
    backgroundStyle: 'bg-neon-cyber',
    swatch: 'linear-gradient(135deg, #1d0f3a 0%, #1f6d9f 46%, #3b82f6 100%)',
  },
];

export const THEME_PRESET_MAP = THEME_PRESETS.reduce((acc, preset) => {
  acc[preset.id] = {
    boardTheme: preset.boardTheme,
    boardSurface: preset.boardSurface,
    useCustomBoardColors: preset.useCustomBoardColors,
    pieceStyle: preset.pieceStyle,
    backgroundStyle: preset.backgroundStyle,
  };
  return acc;
}, {});

export const DEFAULT_BOARD_SURFACE_OPTIONS = [
  { id: 'none', label: 'Plain Board', image: null },
  ...Object.entries(BOARD_IMAGE_MAP)
    .filter(([id, image]) => id !== 'none' && Boolean(image))
    .map(([id, image]) => ({
      id,
      label: id.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
      image,
    })),
];

export const BOARD_COLOR_THEMES = [
  { id: 'classic-blue', label: 'Classic Blue' },
  { id: 'green', label: 'Green' },
  { id: 'wood', label: 'Wood' },
  { id: 'marble', label: 'Marble' },
  { id: 'blue', label: 'Blue' },
  { id: 'dark-minimal', label: 'Dark Minimal' },
  { id: 'neon', label: 'Neon' },
];

export const BACKGROUND_OPTIONS = [
  { id: 'bg-classic', label: 'Classic Gradient', type: 'gradient', swatch: 'linear-gradient(135deg, #0bb0e5 0%, #0483ad 100%)' },
  { id: 'bg-modern-blue', label: 'Modern Blue', type: 'gradient', swatch: 'linear-gradient(135deg, #153d67 0%, #1b78b1 100%)' },
  { id: 'bg-dark-pro', label: 'Dark Pro', type: 'solid', swatch: '#182232' },
  { id: 'bg-neon-cyber', label: 'Neon Cyber', type: 'gradient', swatch: 'linear-gradient(135deg, #1d0f3a 0%, #003f5c 100%)' },
  { id: 'bg-wooden-master', label: 'Wood Image', type: 'image', swatch: `linear-gradient(135deg, rgba(0,0,0,.35), rgba(0,0,0,.1)), url('${toAssetPath('boards/walnut.png')}')` },
  { id: 'bg-image-marble', label: 'Marble Image', type: 'image', swatch: `linear-gradient(135deg, rgba(0,0,0,.35), rgba(0,0,0,.1)), url('${toAssetPath('boards/marble.png')}')` },
  { id: 'bg-solid-slate', label: 'Solid Slate', type: 'solid', swatch: '#17212c' },
  { id: 'bg-gradient-forest', label: 'Forest Gradient', type: 'gradient', swatch: 'linear-gradient(130deg, #142b1f 0%, #306d57 100%)' },
];

export const PIECE_SET_OPTIONS = [
  '3d_chesskid', '3d_plastic', '3d_staunton', '3d_wood', '8_bit', 'alpha', 'anarcandy', 'bases',
  'blindfold', 'book', 'bubblegum', 'caliente', 'california', 'cardinal', 'cases', 'cburnett',
  'celtic', 'chess7', 'chessnut', 'chicago', 'classic', 'club', 'companion', 'condal', 'cooke',
  'dash', 'dubrovny', 'fantasy', 'firi', 'fresca', 'game_room', 'gioco', 'glass', 'gothic',
  'governor', 'graffiti', 'horsey', 'icpieces', 'icy_sea', 'iowa', 'kiwen-suwi', 'kosal',
  'leipzig', 'letter', 'light', 'lolz', 'maestro', 'marble', 'maya', 'merida', 'metal',
  'modern', 'monarchy', 'mpchess', 'nature', 'neo', 'neo_wood', 'neon', 'newspaper', 'ocean',
  'oslo', 'pirouetti', 'pixel', 'reillycraig', 'rhosgfx', 'riohacha', 'shapes', 'sky', 'space',
  'spatial', 'staunty', 'symmetric', 'tatiana', 'tigers', 'tournament', 'vintage', 'wood', 'xkcd',
];
