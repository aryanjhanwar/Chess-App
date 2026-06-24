import React from 'react';
import DriftingPiecesBackground from './DriftingPiecesBackground';

export default function MultiplayerModeSelectScreen({ onSelectOnline, onSelectLan, onBack }) {
  return (
    <section className="relative min-h-screen w-full overflow-hidden">
      {/* Drifting Background Pieces */}
      <DriftingPiecesBackground />

      <div className="relative mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center p-6">
        
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 flex items-center gap-2 text-white hover:text-white transition-colors bg-[#1e2532] hover:bg-[#252d3d] px-4 py-2 rounded-xl text-sm font-semibold border border-white/10 z-10 shadow-lg"
        >
          <span className="font-sans">&larr;</span> Back
        </button>

        {/* Header */}
        <div className="mb-10 text-center animate-rise-in mt-8 sm:mt-0">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-purple-400 mb-2">Network Protocol</p>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2 premium-title">Multiplayer</h1>
          <p className="text-white/60 font-medium">Connect globally or locally</p>
        </div>

        {/* Systematic Menu Buttons */}
        <div className="w-full flex flex-col gap-4 animate-rise-in" style={{ animationDelay: '100ms' }}>
          
          <button 
            onClick={onSelectOnline}
            className="w-full relative group overflow-hidden bg-[#1e2532] border border-white/10 rounded-2xl p-5 flex items-center gap-5 hover:bg-[#252d3d] transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              🌍
            </div>
            <div className="text-left flex-1">
              <h2 className="text-xl font-bold text-white mb-0.5">Online Matchmaking</h2>
              <p className="text-sm text-white/50">Play against players worldwide</p>
            </div>
            <span className="text-white/20 group-hover:translate-x-1 transition-transform">▶</span>
          </button>

          <button 
            onClick={onSelectLan}
            className="w-full relative group overflow-hidden bg-[#1e2532] border border-white/10 rounded-2xl p-5 flex items-center gap-5 hover:bg-[#252d3d] transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              🖧
            </div>
            <div className="text-left flex-1">
              <h2 className="text-xl font-bold text-white mb-0.5">LAN Network</h2>
              <p className="text-sm text-white/50">Connect via local IP address</p>
            </div>
            <span className="text-white/20 group-hover:translate-x-1 transition-transform">▶</span>
          </button>

        </div>
      </div>
    </section>
  );
}
