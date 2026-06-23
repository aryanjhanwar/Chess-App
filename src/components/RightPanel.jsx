import { useEffect, useRef, useState } from 'react';
import GamePanel from './GamePanel';
import { DifficultyLevelGrid, TimeControlSections } from './start/StartPanelSections';
import { getDifficultyLabel } from './start/difficulty';
import { SURFACE_BG, SURFACE_BG_HOVER, createHoverBackgroundHandlers } from './start/styleHelpers';
import { PrimaryActionButton, SurfaceActionButton } from './start/ActionButtons';

export default function RightPanel({ 
  selectedTimeControl, 
  onSelectTimeControl, 
  gameStarted, 
  onStartGame, 
  moveHistory, 
  currentTurn, 
  onNewGame, 
  onResign, 
  onOfferDraw, 
  gameState,
  isReviewMode,
  reviewIndex,
  reviewHistoryLength,
  isPlaying,
  onReviewPrevious,
  onReviewNext,
  onReviewStart,
  onReviewEnd,
  onReviewTogglePlay,
  onExitReview,
  onGameAnalysis,
  isMultiplayerGame = false,
  canUseInGameActions = true,
  canStartGame = true,
  canPlayFriend = true,
  onPlayFriend,
  onSelectGameMode,
  gameMode,
  computerDifficulty,
  onComputerDifficultyChange,
  playerColor,
  onPlayerColorChange,
  highlightResign = false,
  onActiveTopOptionChange,
  isEngineReady = true,
}) {
  const [showTimeOptions, setShowTimeOptions] = useState(false);
  const [showComputerSettings, setShowComputerSettings] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [activeTopOption, setActiveTopOption] = useState(gameStarted ? 'moves' : 'setup');
  const startTimeoutRef = useRef(null);

  const effectiveTopOption = gameStarted ? 'moves' : activeTopOption;

  const handleTopOptionChange = (nextOption) => {
    setActiveTopOption(nextOption);
    if (typeof onActiveTopOptionChange === 'function') {
      onActiveTopOptionChange(nextOption);
    }
  };

  const topOptionItems = [
    { key: 'setup', label: 'Setup', enabled: !gameStarted },
    { key: 'moves', label: 'Moves', enabled: true },
    { key: 'chat', label: 'Chat', enabled: false },
  ];

  const handleTimeSelect = (control) => {
    onSelectTimeControl(control);
    setShowTimeOptions(false);
  };

  const handleStartGame = () => {
    if (startTimeoutRef.current) {
      clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }
    setIsStarting(true);
    startTimeoutRef.current = setTimeout(() => {
      onStartGame();
      setIsStarting(false);
      startTimeoutRef.current = null;
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      className="hidden lg:flex h-screen p-4 flex-col text-white shrink-0 w-[420px]" 
      style={{ 
        background: 'rgba(8, 16, 26, 0.34)', 
        backdropFilter: 'blur(14px)', 
        border: '1px solid rgba(255,255,255,0.12)', 
        borderRadius: '14px'
      }}
    >
      {/* Future top slot for setup/moves/piece options. */}
      <div data-panel-slot="future-options-top" className="shrink-0 mb-3">
        <div className="grid grid-cols-3 gap-2">
          {topOptionItems.map((item) => {
            const isActive = item.key === effectiveTopOption;
            const isEnabled = item.enabled;
            const isComingSoon = item.key === 'chat';
            const isLockedDuringGame = item.key === 'setup' && gameStarted;

            return (
              <button
                key={item.key}
                type="button"
                disabled={!isEnabled}
                onClick={() => {
                  if (isEnabled) handleTopOptionChange(item.key);
                }}
                className="py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: isActive ? 'rgba(127,191,63,0.45)' : 'rgba(255,255,255,0.12)',
                  border: isActive ? '1px solid #7fbf3f' : '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  opacity: isEnabled ? 1 : 0.5,
                  cursor: isEnabled ? 'pointer' : 'not-allowed',
                }}
                title={
                  isComingSoon
                    ? (isMultiplayerGame && item.key === 'chat'
                      ? 'Chat (coming soon)'
                      : `${item.label} (coming soon)`)
                    : (isLockedDuringGame ? 'Setup is available after clicking New Game' : item.label)
                }
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-3">
          {effectiveTopOption === 'moves' ? (
            <>
              <GamePanel 
                moveHistory={moveHistory} 
                currentTurn={currentTurn}
                onResign={onResign}
                onOfferDraw={onOfferDraw}
                gameState={gameState}
                isReviewMode={isReviewMode}
                canUseInGameActions={canUseInGameActions}
                showReviewControls={true}
                reviewIndex={reviewIndex}
                reviewHistoryLength={reviewHistoryLength}
                isPlaying={isPlaying}
                onReviewPrevious={onReviewPrevious}
                onReviewNext={onReviewNext}
                onReviewStart={onReviewStart}
                onReviewEnd={onReviewEnd}
                onReviewTogglePlay={onReviewTogglePlay}
                onExitReview={onExitReview}
                onGameAnalysis={onGameAnalysis}
                highlightResign={highlightResign}
              />
              {/* Fix #25: always-visible New Game button when game is in progress */}
              {!isReviewMode && (
                <SurfaceActionButton
                  onClick={onNewGame}
                  className="w-full py-2.5 rounded-xl font-semibold transition-all"
                >
                  ↺ New Game
                </SurfaceActionButton>
              )}
            </>
          ) : (
            <>
              {gameStarted && (
                <div
                  className="rounded-xl p-3 text-sm text-white/90"
                  style={{ background: 'rgba(255,255,255,0.10)' }}
                >
                  Setup is locked during an active game. Click New Game in Moves tab to return to setup.
                </div>
              )}

              {/* Selected Time Control */}
              <div 
                onClick={() => setShowTimeOptions(!showTimeOptions)}
                className="flex items-center justify-center p-4 rounded-xl cursor-pointer transition-all relative"
                style={{background: SURFACE_BG}}
                {...createHoverBackgroundHandlers(SURFACE_BG, SURFACE_BG_HOVER)}
              >
                <span className="font-bold text-white">
                  {selectedTimeControl.icon || '🚀'} {selectedTimeControl.label} ({selectedTimeControl.category ? selectedTimeControl.category.charAt(0).toUpperCase() + selectedTimeControl.category.slice(1) : 'Bullet'})
                </span>
                <span className="text-xl absolute right-4">{showTimeOptions ? '⌃' : '⌄'}</span>
              </div>

              {/* Time Categories */}
              {showTimeOptions ? (
                <div className="space-y-3">
                  <TimeControlSections
                    selectedTimeControl={selectedTimeControl}
                    onSelectTimeControl={handleTimeSelect}
                    sectionClassName="font-bold text-sm mb-2"
                    buttonClassName="py-2.5 rounded-lg font-semibold transition-all"
                    getButtonStyle={(control) => ({
                      background: selectedTimeControl.label === control.label
                        ? 'rgba(127,191,63,0.35)'
                        : 'rgba(255,255,255,0.12)',
                      border: selectedTimeControl.label === control.label
                        ? '2px solid #7fbf3f'
                        : '2px solid transparent'
                    })}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Game Mode Selector */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onSelectGameMode({ mode: 'human' })}
                      className="py-2.5 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2"
                      style={{
                        background: gameMode === 'human' ? 'rgba(127,191,63,0.5)' : 'rgba(255,255,255,0.12)',
                        border: gameMode === 'human' ? '2px solid #7fbf3f' : '2px solid transparent'
                      }}
                    >
                      <span className="text-base">👥</span>
                      <span>vs Human</span>
                    </button>
                    <button
                      onClick={() => onSelectGameMode({ mode: 'computer' })}
                      className="py-2.5 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2"
                      style={{
                        background: gameMode === 'computer' ? 'rgba(127,191,63,0.5)' : 'rgba(255,255,255,0.12)',
                        border: gameMode === 'computer' ? '2px solid #7fbf3f' : '2px solid transparent'
                      }}
                    >
                      <span className="text-base">🤖</span>
                      <span>vs Computer</span>
                    </button>
                  </div>

                  {/* Computer Settings - Only show if vs Computer mode */}
                  {gameMode === 'computer' && (
                    <>
                      {/* Computer Difficulty */}
                      <div 
                        onClick={() => setShowComputerSettings(!showComputerSettings)}
                        className="relative flex items-center justify-center p-4 rounded-xl cursor-pointer transition-all"
                        style={{background: SURFACE_BG}}
                        {...createHoverBackgroundHandlers(SURFACE_BG, SURFACE_BG_HOVER)}
                      >
                        <span className="font-bold text-white text-center">
                          🤖 {getDifficultyLabel(computerDifficulty)} (Level {computerDifficulty})
                        </span>
                        <span className="text-xl absolute right-4">{showComputerSettings ? '⌃' : '⌄'}</span>
                      </div>

                      {showComputerSettings && (
                        <div className="space-y-3 p-4 rounded-xl" style={{background: 'rgba(255,255,255,0.08)'}}>
                          {/* Difficulty Levels */}
                          <div>
                            <div className="font-bold text-sm mb-3 text-white">Difficulty Level</div>
                            <DifficultyLevelGrid
                              computerDifficulty={computerDifficulty}
                              onComputerDifficultyChange={onComputerDifficultyChange}
                              buttonClassName="py-2 rounded-lg font-bold transition-all text-white"
                              getButtonStyle={(level) => ({
                                background: computerDifficulty === level
                                  ? 'rgba(127, 191, 63, 0.8)'
                                  : 'rgba(255,255,255,0.15)',
                                border: computerDifficulty === level
                                  ? '2px solid #7fbf3f'
                                  : 'none'
                              })}
                              showLabel={true}
                            />
                          </div>

                          {/* Color Selection */}
                          <div>
                            <div className="font-bold text-sm mb-3 text-white">Play As</div>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => onPlayerColorChange('white')}
                                className="py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                                style={{
                                  background: playerColor === 'white' 
                                    ? 'rgba(255,255,255,0.25)' 
                                    : 'rgba(255,255,255,0.12)',
                                  border: playerColor === 'white' 
                                    ? '2px solid #7fbf3f' 
                                    : 'none',
                                  color: 'white'
                                }}
                              >
                                <span className="text-2xl">♔</span>
                                <span>White</span>
                              </button>
                              <button
                                onClick={() => onPlayerColorChange('black')}
                                className="py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                                style={{
                                  background: playerColor === 'black' 
                                    ? 'rgba(255,255,255,0.25)' 
                                    : 'rgba(255,255,255,0.12)',
                                  border: playerColor === 'black' 
                                    ? '2px solid #7fbf3f' 
                                    : 'none',
                                  color: 'white'
                                }}
                              >
                                <span className="text-2xl">♚</span>
                                <span>Black</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <PrimaryActionButton
                    onClick={handleStartGame}
                    disabled={isStarting || !canStartGame || (gameMode === 'computer' && !isEngineReady)}
                    style={{
                      background: 'linear-gradient(#8ec85c, #6fae3c)',
                      transform: isStarting ? 'scale(0.95)' : 'scale(1)',
                      opacity: (isStarting || !canStartGame || (gameMode === 'computer' && !isEngineReady)) ? 0.8 : 1,
                      cursor: (canStartGame && (gameMode !== 'computer' || isEngineReady)) ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {isStarting ? 'Starting...' : (gameMode === 'computer' && !isEngineReady) ? 'Loading Engine...' : 'Start Game'}
                  </PrimaryActionButton>
                  <SurfaceActionButton
                    onClick={onPlayFriend}
                    disabled={!canPlayFriend}
                    style={{
                      opacity: canPlayFriend ? 1 : 0.6,
                      cursor: canPlayFriend ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Play a Friend
                  </SurfaceActionButton>
                </div>
              )}
            </>
          )}
        </div>
    </div>
  );
}
