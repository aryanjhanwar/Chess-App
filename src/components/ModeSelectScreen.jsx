import React from 'react';
import DriftingPiecesBackground from './DriftingPiecesBackground';
import ShowcaseBoard from './ShowcaseBoard';

export default function ModeSelectScreen({ onSelectLocal, onSelectMultiplayer }) {
  return (
    <section className="relative min-h-screen w-full overflow-hidden">
      {/* Drifting Background Pieces */}
      <DriftingPiecesBackground />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center p-6 gap-12 flex-col lg:flex-row">
        
        {/* LEFT COLUMN: Menu Cards */}
        <div className="flex-1 w-full flex flex-col justify-center max-w-lg z-10 animate-fade-in-up">
          
          {/* App Branding */}
          <div className="mb-10 text-left">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-xl shadow-cyan-500/30">
                <span className="text-3xl text-white drop-shadow-md">♞</span>
              </div>
              <h1 className="text-5xl font-black text-white tracking-tight">CHESS<span className="text-cyan-400">PRO</span></h1>
            </div>
            <p className="text-white/60 font-medium uppercase tracking-[0.2em] text-sm ml-2">Grandmaster Edition</p>
          </div>

          <div className="space-y-4">
            {/* Play Menu Card */}
            <button 
              onClick={onSelectLocal}
              className="w-full relative group overflow-hidden bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-6 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/20"
            >
              {/* Mini Board Icon Graphic */}
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#1e2532] to-[#0a0f18] border border-white/20 grid grid-cols-2 grid-rows-2 p-1.5 shadow-inner relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                <div className="bg-white/20 rounded-tl-md"></div>
                <div className="bg-transparent rounded-tr-md"></div>
                <div className="bg-transparent rounded-bl-md text-white/80 text-3xl flex items-center justify-center drop-shadow-lg">♞</div>
                <div className="bg-white/20 rounded-br-md"></div>
              </div>

              <div className="text-left flex-1">
                <h2 className="text-2xl font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">Play Local</h2>
                <p className="text-sm text-white/50 leading-relaxed">Play a pass-and-play game or challenge the integrated engine.</p>
              </div>
              <span className="text-white/20 text-2xl group-hover:translate-x-2 group-hover:text-cyan-400 transition-all">→</span>
            </button>

            {/* Analyse Menu Card */}
            <button 
              onClick={onSelectMultiplayer}
              className="w-full relative group overflow-hidden bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-6 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/20"
            >
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#1e2532] to-[#0a0f18] border border-white/20 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                 {/* Mini Board Background */}
                 <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20">
                    <div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div>
                    <div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div>
                    <div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div>
                 </div>
                 {/* Animated Best Move Arrow */}
                 <svg className="w-12 h-12 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] z-10 -rotate-45 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                 </svg>
              </div>

              <div className="text-left flex-1">
                <h2 className="text-2xl font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">Multiplayer</h2>
                <p className="text-sm text-white/50 leading-relaxed">Connect over LAN or globally to battle other real players.</p>
              </div>
              <span className="text-white/20 text-2xl group-hover:translate-x-2 group-hover:text-purple-400 transition-all">→</span>
            </button>

            {/* Review Menu Card */}
            <button 
              className="w-full relative group overflow-hidden bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-6 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/20"
            >
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#1e2532] to-[#0a0f18] border border-white/20 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                 {/* Brilliant Badge */}
                 <div className="absolute font-black text-2xl text-[#10b981] bg-[#064e3b] border-2 border-[#10b981] rounded-full w-12 h-12 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)] z-10 rotate-12 group-hover:rotate-0 transition-transform">
                   !!
                 </div>
              </div>

              <div className="text-left flex-1">
                <h2 className="text-2xl font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">Review</h2>
                <p className="text-sm text-white/50 leading-relaxed">Review your past games with grandmaster-level classification.</p>
              </div>
              <span className="text-white/20 text-2xl group-hover:translate-x-2 group-hover:text-emerald-400 transition-all">→</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Showcase Board */}
        <div className="flex-1 w-full max-w-[600px] flex justify-center lg:justify-end items-center z-10">
           <div 
             className="w-full flex justify-center transition-transform duration-700 hover:!transform-none"
             style={{ transform: 'perspective(1000px) rotateY(-10deg) rotateX(5deg)' }}
           >
             <ShowcaseBoard />
           </div>
        </div>

      </div>
    </section>
  );
}
