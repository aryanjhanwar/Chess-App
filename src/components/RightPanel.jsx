import { useState } from 'react';
import GamePanel from './GamePanel';
import ReviewModeControls from './ReviewModeControls';
import { DifficultyLevelGrid, TimeControlSections, getDifficultyLabel } from './start/StartPanelSections';
import { SURFACE_BG, SURFACE_BG_HOVER, createHoverBackgroundHandlers, getTabButtonStyle } from './start/styleHelpers';
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
  onPlayFriend,
  onSelectGameMode,
  canGoBack,
  canGoForward,
  gameMode,
  computerDifficulty,
  onComputerDifficultyChange,
  playerColor,
  onPlayerColorChange,
  highlightResign = false
}) {
  const [activeTab, setActiveTab] = useState('newGame');
  const [showTimeOptions, setShowTimeOptions] = useState(false);
  const [showComputerSettings, setShowComputerSettings] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const tabs = [
    { key: 'newGame', label: 'New Game' },
    { key: 'games', label: 'Games' },
    { key: 'players', label: 'Players' }
  ];

  const handleTimeSelect = (control) => {
    onSelectTimeControl(control);
    setShowTimeOptions(false);
  };

  const handleStartGame = () => {
    setIsStarting(true);
    setTimeout(() => {
      onStartGame();
      setIsStarting(false);
    }, 300);
  };

  return (
    <div 
      className="h-screen p-4 flex flex-col text-white w-full lg:w-[420px]" 
      style={{ 
        background: 'rgba(0, 150, 200, 0.55)', 
        backdropFilter: 'blur(14px)', 
        border: '1px solid rgba(255,255,255,0.12)', 
        borderRadius: '14px'
      }}
    >
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 py-2.5 rounded-lg font-semibold transition-all"
              style={getTabButtonStyle(isActive)}
              {...createHoverBackgroundHandlers(SURFACE_BG, SURFACE_BG_HOVER, !isActive)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* New Game Tab */}
      {activeTab === 'newGame' && (
        <div className="flex-1 overflow-y-auto flex flex-col gap-3">
          {gameStarted ? (
            <>
              <GamePanel 
                moveHistory={moveHistory} 
                currentTurn={currentTurn}
                onResign={onResign}
                onOfferDraw={onOfferDraw}
                gameState={gameState}
                isReviewMode={isReviewMode}
                showReviewControls={false}
                highlightResign={highlightResign}
              />
              {isReviewMode && (
                <ReviewModeControls
                  reviewIndex={reviewIndex}
                  reviewHistoryLength={reviewHistoryLength}
                  isPlaying={isPlaying}
                  canGoBack={canGoBack}
                  canGoForward={canGoForward}
                  onPrevious={onReviewPrevious}
                  onNext={onReviewNext}
                  onGoToStart={onReviewStart}
                  onGoToEnd={onReviewEnd}
                  onTogglePlay={onReviewTogglePlay}
                  onExit={onExitReview}
                />
              )}
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
                    disabled={isStarting}
                    style={{
                      background: 'linear-gradient(#8ec85c, #6fae3c)',
                      transform: isStarting ? 'scale(0.95)' : 'scale(1)',
                      opacity: isStarting ? 0.8 : 1
                    }}
                  >
                    {isStarting ? 'Starting...' : 'Start Game'}
                  </PrimaryActionButton>
                  <SurfaceActionButton
                    onClick={onPlayFriend}
                  >
                    Play a Friend
                  </SurfaceActionButton>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Games Tab */}
      {activeTab === 'games' && (
        <div className="flex-1 space-y-3">
          <div 
            className="p-4 rounded-xl font-semibold cursor-pointer"
            style={{background: SURFACE_BG}}
            {...createHoverBackgroundHandlers(SURFACE_BG, SURFACE_BG_HOVER)}
          >
            Previous Game #1
          </div>
          <div 
            className="p-4 rounded-xl font-semibold cursor-pointer"
            style={{background: SURFACE_BG}}
            {...createHoverBackgroundHandlers(SURFACE_BG, SURFACE_BG_HOVER)}
          >
            Previous Game #2
          </div>
        </div>
      )}

      {/* Players Tab */}
      {activeTab === 'players' && (
        <div className="flex-1">
          <div className="p-4 rounded-xl" style={{background: SURFACE_BG}}>
            <div className="text-center font-semibold">Player 1</div>
          </div>
          <div className="p-4 rounded-xl mt-3" style={{background: SURFACE_BG}}>
            <div className="text-center font-semibold">Player 2</div>
          </div>
        </div>
      )}
    </div>
  );
}
