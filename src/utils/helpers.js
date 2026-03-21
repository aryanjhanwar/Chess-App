// Utility functions
export const formatTime = (seconds) => {
  if (seconds >= 86400) {
    const days = Math.floor(seconds / 86400);
    return `${days}d`;
  }
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export const getPieceValue = (piece) => {
  const type = piece[1];
  const values = { 'p': 1, 'N': 3, 'B': 3, 'R': 5, 'Q': 9, 'K': 0 };
  return values[type] || 0;
};

export const calculateMaterialAdvantage = (capturedByPlayer, capturedByOpponent) => {
  const playerValue = capturedByPlayer.reduce((sum, piece) => sum + getPieceValue(piece), 0);
  const opponentValue = capturedByOpponent.reduce((sum, piece) => sum + getPieceValue(piece), 0);
  return playerValue - opponentValue;
};

export const groupCapturedPieces = (pieces) => {
  const grouped = {};
  pieces.forEach(piece => {
    const type = piece[1];
    grouped[type] = (grouped[type] || 0) + 1;
  });
  
  // Sort by piece value (most valuable first)
  const pieceOrder = ['Q', 'R', 'B', 'N', 'p'];
  const result = {};
  pieceOrder.forEach(type => {
    if (grouped[type]) {
      result[type] = grouped[type];
    }
  });
  return result;
};
