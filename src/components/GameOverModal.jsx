import React from 'react';

export default function GameOverModal({ 
  gameState, 
  currentTurn, 
  onNewGame, 
  onRematch,
  onReview,
  onClose 
}) {
  const getGameOverContent = () => {
    switch (gameState) {
      case 'checkmate':
        return {
          type: currentTurn === 'w' ? 'defeat' : 'victory',
          title: currentTurn === 'w' ? 'Defeat' : 'Victory',
          subtitle: 'by Checkmate',
          color: currentTurn === 'w' ? 'from-red-500 to-rose-700' : 'from-emerald-400 to-green-600',
          emoji: currentTurn === 'w' ? '💀' : '🏆'
        };
      case 'timeout':
        return {
          type: currentTurn === 'w' ? 'defeat' : 'victory',
          title: currentTurn === 'w' ? 'Time Up' : 'Victory',
          subtitle: 'on Time',
          color: currentTurn === 'w' ? 'from-red-500 to-rose-700' : 'from-emerald-400 to-green-600',
          emoji: '⏰'
        };
      case 'resigned':
        return {
          type: currentTurn === 'w' ? 'defeat' : 'victory',
          title: currentTurn === 'w' ? 'Resigned' : 'Victory',
          subtitle: 'by Resignation',
          color: currentTurn === 'w' ? 'from-red-500 to-rose-700' : 'from-emerald-400 to-green-600',
          emoji: '🏳️'
        };
      case 'stalemate':
      case 'draw':
        return {
          type: 'draw',
          title: 'Draw',
          subtitle: gameState === 'stalemate' ? 'by Stalemate' : 'by Agreement',
          color: 'from-slate-400 to-gray-600',
          emoji: '🤝'
        };
      case 'abandoned':
        return {
          type: 'draw',
          title: 'Abandoned',
          subtitle: 'Connection Lost',
          color: 'from-slate-400 to-gray-600',
          emoji: '📡'
        };
      default:
        return null;
    }
  };

  const content = getGameOverContent();
  if (!content) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Soft overlay instead of total blackout */}
      <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 animate-fade-in`} />
      
      {/* Small, elegant Modal Card */}
      <div className="relative w-full max-w-sm bg-[#1e2532] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-rise-in transform transition-all">
        
        {/* Subtle top border gradient */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${content.color}`} />

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/50 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 text-center">
          <div className="text-5xl mb-3 animate-bounce-slow">
            {content.emoji}
          </div>
          
          <h2 className={`text-3xl font-black bg-clip-text text-transparent bg-gradient-to-br ${content.color} mb-1 tracking-wide`}>
            {content.title}
          </h2>
          
          <p className="text-sm font-bold text-white/50 uppercase tracking-widest mb-6">
            {content.subtitle}
          </p>

          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <button
                onClick={onNewGame}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2.5 rounded-lg font-bold hover:from-blue-400 hover:to-blue-500 transition-all shadow-[0_3px_0_rgba(0,0,0,0.3)] hover:translate-y-[-1px] active:translate-y-[2px] active:shadow-none"
              >
                New Game
              </button>
              <button
                onClick={onRematch || onNewGame}
                className="flex-1 bg-[#252d3d] border border-white/10 text-white py-2.5 rounded-lg font-bold hover:bg-[#2c3547] transition-all shadow-[0_3px_0_rgba(0,0,0,0.3)] hover:translate-y-[-1px] active:translate-y-[2px] active:shadow-none"
              >
                Rematch
              </button>
            </div>
            <button
              onClick={onReview}
              className="w-full bg-transparent border border-white/5 text-white/70 py-2 rounded-lg font-semibold hover:bg-white/5 hover:text-white transition-all"
            >
              Review Board
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
