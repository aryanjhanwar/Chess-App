/**
 * STOCKFISH UTILITIES
 * Helper functions for Stockfish UCI integration
 */

/**
 * Get difficulty parameters for Stockfish
 * @param {number} level - Difficulty level (1-10)
 * @returns {Object} - {skill, depth, moveTime}
 */
export const getDifficultySettings = (level) => {
  const settings = {
    1: { skill: 0, depth: 1, moveTime: 40 },     // Beginner
    2: { skill: 1, depth: 2, moveTime: 80 },
    3: { skill: 3, depth: 3, moveTime: 140 },    // Easy
    4: { skill: 5, depth: 5, moveTime: 240 },
    5: { skill: 8, depth: 8, moveTime: 400 },    // Medium
    6: { skill: 11, depth: 10, moveTime: 650 },
    7: { skill: 14, depth: 12, moveTime: 950 },  // Hard
    8: { skill: 16, depth: 14, moveTime: 1400 },
    9: { skill: 18, depth: 17, moveTime: 2000 }, // Expert
    10: { skill: 20, depth: 20, moveTime: 2800 } // Master
  };
  
  return settings[level] || settings[5]; // Default to medium
};


