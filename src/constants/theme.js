// Theme constants for easy customization
export const theme = {
  // Main colors
  background: 'bg-gradient-to-br from-cyan-600 via-cyan-500 to-cyan-600',
  
  // Board colors
  boardLight: 'bg-slate-300',
  boardDark: 'bg-slate-500',
  boardBorder: 'border-gray-800',
  
  // Player card colors
  playerCard: 'bg-cyan-700 bg-opacity-60',
  playerCardBorder: 'border-cyan-700',
  
  // Timer colors
  timerBg: 'bg-gray-900 bg-opacity-80',
  timerActive: 'text-green-400',
  timerInactive: 'text-white',
  
  // Sidebar colors
  sidebarCard: 'bg-gray-800',
  sidebarButton: 'bg-cyan-700 bg-opacity-70 hover:bg-opacity-90',
  
  // Button colors
  primaryButton: 'bg-green-600 hover:bg-green-700',
  secondaryButton: 'bg-gray-700 hover:bg-gray-600',
  dangerButton: 'bg-red-600 hover:bg-red-700',
  infoButton: 'bg-blue-600 hover:bg-blue-700',
  
  // Text colors
  textPrimary: 'text-white',
  textSecondary: 'text-gray-400',
  textLabel: 'text-white',
  
  // Selection colors
  selectedSquare: 'ring-4 ring-yellow-400 ring-inset',
  validMoveSquare: 'bg-green-500',
  checkSquare: 'bg-red-500 animate-pulse',
};

// Piece images mapping
export const pieceImages = {
  'bR': '/assets/piecesSVG/Rook_Dark.svg',
  'bN': '/assets/piecesSVG/Knight_Dark.svg',
  'bB': '/assets/piecesSVG/Bishop_Dark.svg',
  'bQ': '/assets/piecesSVG/Queen_Dark.svg',
  'bK': '/assets/piecesSVG/King_Dark.svg',
  'bp': '/assets/piecesSVG/Pawn_Dark.svg',
  'wR': '/assets/piecesSVG/Rook_Light.svg',
  'wN': '/assets/piecesSVG/Knight_Light.svg',
  'wB': '/assets/piecesSVG/Bishop_Light.svg',
  'wQ': '/assets/piecesSVG/Queen_Light.svg',
  'wK': '/assets/piecesSVG/King_Light.svg',
  'wp': '/assets/piecesSVG/Pawn_Light.svg',
};

// Time control options
export const timeControlOptions = {
  bullet: [
    { base: 60, increment: 0, label: '1 min', category: 'bullet', icon: '🚀' },
    { base: 60, increment: 1, label: '1 | 1', category: 'bullet', icon: '🚀' },
    { base: 120, increment: 1, label: '2 | 1', category: 'bullet', icon: '🚀' }
  ],
  blitz: [
    { base: 180, increment: 0, label: '3 min', category: 'blitz', icon: '⚡' },
    { base: 180, increment: 2, label: '3 | 2', category: 'blitz', icon: '⚡' },
    { base: 300, increment: 0, label: '5 min', category: 'blitz', icon: '⚡' }
  ],
  rapid: [
    { base: 600, increment: 0, label: '10 min', category: 'rapid', icon: '🕐' },
    { base: 900, increment: 10, label: '15 | 10', category: 'rapid', icon: '🕐' },
    { base: 1800, increment: 0, label: '30 min', category: 'rapid', icon: '🕐' }
  ],
  daily: [
    { base: 86400, increment: 0, label: '1 day', category: 'daily', icon: '☀️' },
    { base: 259200, increment: 0, label: '3 days', category: 'daily', icon: '☀️' },
    { base: 604800, increment: 0, label: '7 days', category: 'daily', icon: '☀️' }
  ]
};
