import { generatePGN, getPGNResult, formatPGNTimeControl } from '../../engine/pgn.js';

export function openGameAnalysis({
  currentPGN,
  playerNames,
  gameState,
  currentTurn,
  moveHistory,
  selectedTimeControl,
  isBoardFlipped,
  isReviewMode,
  reviewIndex,
  activeMoveHistory,
  analysisHandoffKey = 'chessapp_analysis_handoff_v1',
}) {
  const analysisTargetPly = isReviewMode ? Math.max(0, reviewIndex) : activeMoveHistory.length;

  const pgnToAnalyze = currentPGN && currentPGN.trim().length > 0
    ? currentPGN
    : generatePGN({
      whitePlayer: playerNames.white || 'White',
      blackPlayer: playerNames.black || 'Black',
      result: getPGNResult(gameState, currentTurn),
      moveHistory,
      gameState,
      timeControl: formatPGNTimeControl(selectedTimeControl.base, selectedTimeControl.increment),
    });

  try {
    window.localStorage.setItem(
      analysisHandoffKey,
      JSON.stringify({
        pgn: pgnToAnalyze,
        orientation: isBoardFlipped ? 'black' : 'white',
        targetPly: analysisTargetPly,
        source: 'play-review',
        ts: Date.now(),
      })
    );
  } catch (error) {
    console.error('Failed to store analysis handoff payload:', error);
  }

  const baseUrl = import.meta.env.BASE_URL || '/';
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const analysisUrl = new URL('analysis', new URL(normalizedBase, window.location.href));
  window.location.assign(analysisUrl.toString());
}
