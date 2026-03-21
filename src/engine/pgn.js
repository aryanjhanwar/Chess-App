// PGN (Portable Game Notation) Generator

/**
 * Generates a complete PGN string from game data
 * @param {Object} gameData - Contains all game information
 * @returns {string} - Complete PGN formatted string
 */
export const generatePGN = (gameData) => {
  const {
    whitePlayer = 'Player 1',
    blackPlayer = 'Player 2',
    result = '*', // * = ongoing, 1-0 = white wins, 0-1 = black wins, 1/2-1/2 = draw
    event = 'Casual Game',
    site = 'Chess Clone',
    date = new Date().toISOString().split('T')[0].replace(/-/g, '.'),
    round = '1',
    moveHistory = [],
    gameState = 'playing',
    timeControl = '10+0',
  } = gameData;

  // Determine result from game state if not provided
  let finalResult = result;
  if (result === '*' && gameState !== 'playing') {
    if (gameState === 'checkmate') {
      // Fix #26: result should be passed correctly by the caller via getPGNResult
      // but as a safety net, keep result as-is since we don't know currentTurn here
      finalResult = result;
    } else if (gameState === 'stalemate' || gameState === 'draw') {
      finalResult = '1/2-1/2';
    } else if (gameState === 'timeout') {
      finalResult = result; // caller must provide correct result
    }
  }

  // PGN Headers
  const headers = [
    `[Event "${event}"]`,
    `[Site "${site}"]`,
    `[Date "${date}"]`,
    `[Round "${round}"]`,
    `[White "${whitePlayer}"]`,
    `[Black "${blackPlayer}"]`,
    `[Result "${finalResult}"]`,
    `[TimeControl "${timeControl}"]`,
  ].join('\n');

  // Format moves in PGN style (pairs with move numbers)
  let movesString = '';
  for (let i = 0; i < moveHistory.length; i += 2) {
    const moveNumber = Math.floor(i / 2) + 1;
    const whiteMove = moveHistory[i];
    const blackMove = moveHistory[i + 1] || '';
    
    movesString += `${moveNumber}. ${whiteMove}`;
    if (blackMove) {
      movesString += ` ${blackMove} `;
    }
  }

  // Add result at the end
  movesString = movesString.trim() + ' ' + finalResult;

  // Combine headers and moves
  return `${headers}\n\n${movesString}`;
};

/**
 * Updates PGN result based on game outcome
 * @param {string} gameState - Current game state
 * @param {string} currentTurn - Current player's turn (who is in checkmate/stalemate)
 * @returns {string} - PGN result string
 */
export const getPGNResult = (gameState, currentTurn) => {
  if (gameState === 'checkmate') {
    // If it's white's turn and checkmate, white is checkmated (black wins)
    return currentTurn === 'w' ? '0-1' : '1-0';
  } else if (gameState === 'stalemate' || gameState === 'draw') {
    return '1/2-1/2';
  }
  return '*'; // Game ongoing
};

/**
 * Formats time control for PGN
 * @param {number} base - Base time in seconds
 * @param {number} increment - Increment in seconds
 * @returns {string} - PGN time control format
 */
export const formatPGNTimeControl = (base, increment) => {
  return `${base}+${increment}`;
};
