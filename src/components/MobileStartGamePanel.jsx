import { useState, memo } from 'react';
import { DifficultyLevelGrid, TimeControlSections, getDifficultyLabel } from './start/StartPanelSections';
import { SURFACE_BG, createHoverBackgroundHandlers } from './start/styleHelpers';
import { PrimaryActionButton } from './start/ActionButtons';

function MobileStartGamePanel({
  selectedTimeControl,
  onSelectTimeControl,
  onStartGame,
  gameMode,
  onSelectGameMode,
  computerDifficulty,
  onComputerDifficultyChange
}) {
  const [showTimeOptions, setShowTimeOptions] = useState(false);
  const [showComputerOptions, setShowComputerOptions] = useState(false);

  const getModeButtonStyle = (mode) => ({
    background: gameMode === mode ? 'rgba(127, 191, 63, 0.55)' : 'rgba(255,255,255,0.12)',
    border: gameMode === mode ? '2px solid #7fbf3f' : '2px solid transparent'
  });

  const handleTimeSelect = (control) => {
    onSelectTimeControl(control);
    setShowTimeOptions(false);
  };

  return (
    <div className="lg:hidden w-full max-w-[min(560px,100vw)] mt-4 backdrop-blur-sm rounded-2xl p-4" style={{background: 'rgba(0, 150, 200, 0.55)', border: '1px solid rgba(255,255,255,0.12)'}}>
      {/* Selected Time Control with Dropdown */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={() => onSelectGameMode({ mode: 'human' })}
          className="py-2.5 rounded-lg font-semibold text-white transition-all"
          style={getModeButtonStyle('human')}
        >
          vs Human
        </button>
        <button
          onClick={() => onSelectGameMode({ mode: 'computer' })}
          className="py-2.5 rounded-lg font-semibold text-white transition-all"
          style={getModeButtonStyle('computer')}
        >
          vs Computer
        </button>
      </div>

      {/* Computer difficulty */}
      {gameMode === 'computer' && (
        <div className="mb-3">
          <button
            onClick={() => setShowComputerOptions(!showComputerOptions)}
            className="w-full flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all"
            style={{ background: 'rgba(255,255,255,0.15)' }}
            {...createHoverBackgroundHandlers('rgba(255,255,255,0.15)', 'rgba(255,255,255,0.2)')}
          >
            <span className="font-bold text-white">Difficulty: {computerDifficulty} · {getDifficultyLabel(computerDifficulty)}</span>
            <svg
              className={`w-5 h-5 text-white transition-transform ${showComputerOptions ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showComputerOptions && (
            <div className="mt-2">
              <DifficultyLevelGrid
                computerDifficulty={computerDifficulty}
                onComputerDifficultyChange={onComputerDifficultyChange}
                buttonClassName="py-2 rounded-lg font-bold text-white transition-all"
                getButtonStyle={(level) => ({
                  background: computerDifficulty === level ? 'rgba(127, 191, 63, 0.75)' : 'rgba(255,255,255,0.12)',
                  border: computerDifficulty === level ? '2px solid #7fbf3f' : '2px solid transparent'
                })}
              />
            </div>
          )}
        </div>
      )}

      <div 
        onClick={() => setShowTimeOptions(!showTimeOptions)}
        className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all mb-3"
        style={{background: 'rgba(255,255,255,0.15)'}}
        {...createHoverBackgroundHandlers('rgba(255,255,255,0.15)', 'rgba(255,255,255,0.2)')}
      >
        <span className="font-bold text-white">
          {selectedTimeControl.icon || '🚀'} {selectedTimeControl.label}
        </span>
        <svg 
          className={`w-5 h-5 text-white transition-transform ${showTimeOptions ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expandable Time Options */}
      {showTimeOptions && (
        <div className="space-y-3 mb-3 max-h-64 overflow-y-auto">
          <TimeControlSections
            selectedTimeControl={selectedTimeControl}
            onSelectTimeControl={handleTimeSelect}
            buttonClassName="py-2 rounded-lg font-semibold text-white transition-all"
            getButtonStyle={(control) => ({
              background: selectedTimeControl.label === control.label
                ? 'rgba(127, 191, 63, 0.5)'
                : SURFACE_BG,
              border: selectedTimeControl.label === control.label
                ? '2px solid #7fbf3f'
                : '2px solid transparent'
            })}
          />
        </div>
      )}

      {/* Start Game Button */}
      <PrimaryActionButton
        onClick={onStartGame}
        className="w-full py-3 rounded-lg font-bold text-white text-lg transition-all"
        style={{background: 'linear-gradient(135deg, #7fbf3f 0%, #5a9e2a 100%)', boxShadow: '0 4px 12px rgba(127, 191, 63, 0.4)'}}
      >
        ▶ Start Game
      </PrimaryActionButton>
    </div>
  );
}

MobileStartGamePanel.displayName = 'MobileStartGamePanel';

export default memo(MobileStartGamePanel);
