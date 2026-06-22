import { timeControlOptions } from '../../constants/theme';

const TIME_CONTROL_SECTIONS = [
  { key: 'bullet', title: '🚀 Bullet' },
  { key: 'blitz', title: '⚡ Blitz' },
  { key: 'rapid', title: '🕐 Rapid' },
  { key: 'daily', title: '☀️ Daily' }
];

const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const getDifficultyLabel = (level) => {
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
    10: 'Stockfish Max'
  };

  return labels[level] || 'Medium';
};

export function TimeControlSections({
  onSelectTimeControl,
  sectionClassName = 'font-bold text-sm mb-2 text-white',
  buttonClassName,
  getButtonStyle
}) {
  return (
    <>
      {TIME_CONTROL_SECTIONS.map(({ key, title }) => (
        <div key={key}>
          <div className={sectionClassName}>{title}</div>
          <div className="grid grid-cols-3 gap-2">
            {timeControlOptions[key].map((control) => (
              <button
                key={control.label}
                onClick={() => onSelectTimeControl(control)}
                className={buttonClassName}
                style={getButtonStyle(control)}
              >
                {control.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

export function DifficultyLevelGrid({
  computerDifficulty,
  onComputerDifficultyChange,
  buttonClassName,
  getButtonStyle,
  showLabel = false,
  labelClassName = 'text-xs text-white/70 mt-2 text-center'
}) {
  return (
    <>
      <div className="grid grid-cols-5 gap-2">
        {DIFFICULTY_LEVELS.map((level) => (
          <button
            key={level}
            onClick={() => onComputerDifficultyChange(level)}
            className={buttonClassName}
            style={getButtonStyle(level)}
          >
            {level}
          </button>
        ))}
      </div>
      {showLabel && (
        <div className={labelClassName}>
          {getDifficultyLabel(computerDifficulty)}
        </div>
      )}
    </>
  );
}
