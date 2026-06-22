import { toAssetPath } from '../utils/assetPath';

export const BACKGROUND_PRESETS = {
  'bg-classic': {
    style: {
      background: 'linear-gradient(135deg, #0bb0e5 0%, #0483ad 52%, #0bb0e5 100%)',
    },
  },
  'bg-modern-blue': {
    style: {
      background: 'linear-gradient(135deg, #0b1d2a 0%, #153d67 45%, #1b78b1 100%)',
    },
  },
  'bg-dark-pro': {
    style: {
      background: 'linear-gradient(135deg, #0f141d 0%, #182232 55%, #111827 100%)',
    },
  },
  'bg-wooden-master': {
    style: {
      backgroundImage: `linear-gradient(135deg, rgba(12, 20, 26, 0.75), rgba(35, 24, 14, 0.76)), url('${toAssetPath('boards/walnut.png')}')`,
      backgroundSize: 'cover, 220px 220px',
      backgroundPosition: 'center, center',
    },
  },
  'bg-neon-cyber': {
    style: {
      background: 'linear-gradient(145deg, #07111f 0%, #1d0f3a 45%, #003f5c 100%)',
    },
  },
  'bg-solid-slate': {
    style: {
      background: '#17212c',
    },
  },
  'bg-gradient-forest': {
    style: {
      background: 'linear-gradient(130deg, #142b1f 0%, #205040 48%, #306d57 100%)',
    },
  },
  'bg-image-marble': {
    style: {
      backgroundImage: `linear-gradient(135deg, rgba(8, 20, 28, 0.72), rgba(22, 25, 31, 0.75)), url('${toAssetPath('boards/marble.png')}')`,
      backgroundSize: 'cover, 240px 240px',
      backgroundPosition: 'center, center',
    },
  },
  'bg-custom-solid': {
    style: {
      background: '#17212c',
    },
  },
};

export const DEFAULT_UI_SETTINGS = {
  appThemePreset: 'classic',
  boardTheme: 'classic-blue',
  boardSurface: 'none',
  boardTexture: 'none',
  useCustomBoardColors: false,
  customLightSquare: '#eaf2f6',
  customDarkSquare: '#a8c1cf',
  orientation: 'white',
  showCoordinates: true,
  highlightLastMove: true,
  showLegalMoveDots: true,
  pieceStyle: 'staunty',
  pieceAnimation: true,
  dragAnimation: true,
  pieceMovement: 'smooth',
  engineSuggestions: true,
  autoAnalyzeAfterGame: true,
  soundEffects: true,
  moveSound: true,
  captureSound: true,
  checkSound: true,
  volume: 0.75,
  backgroundStyle: 'bg-classic',
  customBackgroundColor: '#17212c',
  enableAnimations: true,
  reduceMotion: false,
  compactMode: false,
  showClassificationIcons: true,
  showBestMoveSuggestions: true,
  showEvaluationGraph: true,
  autoReviewAfterGame: false,
};

export const BOARD_THEME_MAP = {
  blue: { light: '#dbeaf4', dark: '#7ea7c7', lastMoveLight: '#c5dfef', lastMoveDark: '#5d88a7' },
  'classic-blue': { light: '#eaf2f6', dark: '#a8c1cf', lastMoveLight: '#bce4f0', lastMoveDark: '#7ba7bd' },
  green: { light: '#eaf0df', dark: '#7aa172', lastMoveLight: '#d1e6bc', lastMoveDark: '#5c7f56' },
  wood: { light: '#f1dfc0', dark: '#b38b6d', lastMoveLight: '#f0d4aa', lastMoveDark: '#9a7358' },
  marble: { light: '#ebe8e2', dark: '#9ca4ab', lastMoveLight: '#d7d4ce', lastMoveDark: '#808a93' },
  neon: { light: '#7ecff9', dark: '#1f6d9f', lastMoveLight: '#9be3ff', lastMoveDark: '#145174' },
  'dark-minimal': { light: '#c0c7d1', dark: '#5f6b7a', lastMoveLight: '#aeb8c7', lastMoveDark: '#4b5563' },
};

export const BOARD_TEXTURE_MAP = {
  none: null,
  walnut: toAssetPath('boards/walnut.png'),
  marble: toAssetPath('boards/marble.png'),
  glass: toAssetPath('boards/glass.png'),
  neon: toAssetPath('boards/neon.png'),
  tournament: toAssetPath('boards/tournament.png'),
};

export const BOARD_IMAGE_MAP = {
  none: null,
  '8_bit': toAssetPath('boards/8_bit.png'),
  bases: toAssetPath('boards/bases.png'),
  blue: toAssetPath('boards/blue.png'),
  brown: toAssetPath('boards/brown.png'),
  bubblegum: toAssetPath('boards/bubblegum.png'),
  burled_wood: toAssetPath('boards/burled_wood.png'),
  dark_wood: toAssetPath('boards/dark_wood.png'),
  dash: toAssetPath('boards/dash.png'),
  glass: toAssetPath('boards/glass.png'),
  graffiti: toAssetPath('boards/graffiti.png'),
  green: toAssetPath('boards/green.png'),
  icy_sea: toAssetPath('boards/icy_sea.png'),
  light: toAssetPath('boards/light.png'),
  lolz: toAssetPath('boards/lolz.png'),
  marble: toAssetPath('boards/marble.png'),
  metal: toAssetPath('boards/metal.png'),
  neon: toAssetPath('boards/neon.png'),
  newspaper: toAssetPath('boards/newspaper.png'),
  orange: toAssetPath('boards/orange.png'),
  overlay: toAssetPath('boards/overlay.png'),
  parchment: toAssetPath('boards/parchment.png'),
  purple: toAssetPath('boards/purple.png'),
  red: toAssetPath('boards/red.png'),
  sand: toAssetPath('boards/sand.png'),
  sky: toAssetPath('boards/sky.png'),
  stone: toAssetPath('boards/stone.png'),
  tan: toAssetPath('boards/tan.png'),
  tournament: toAssetPath('boards/tournament.png'),
  translucent: toAssetPath('boards/translucent.png'),
  walnut: toAssetPath('boards/walnut.png'),
};
