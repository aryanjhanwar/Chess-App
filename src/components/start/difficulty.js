export function getDifficultyLabel(level) {
  const labels = {
    1: 'Beginner',
    2: 'Novice',
    3: 'Intermediate',
    4: 'Advanced',
    5: 'Strong',
    6: 'Expert',
    7: 'Master',
    8: 'Grandmaster',
    9: 'Super GM',
    10: 'Stockfish Max',
  };

  return labels[level] || 'Medium';
}
