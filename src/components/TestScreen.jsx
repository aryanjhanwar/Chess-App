import React from 'react';
import '../test.css';

export default function TestScreen({ onBack }) {
  return (
    <div className="test-container">
      
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 flex items-center gap-2 text-white hover:text-white transition-colors bg-[#1e1e24] hover:bg-[#333] px-4 py-2 rounded-sm text-md font-heading uppercase border-2 border-white/10 shadow-[0_4px_0_rgba(0,0,0,0.5)] active:translate-y-[4px] active:shadow-none"
      >
        <span className="font-sans">&larr;</span> Back
      </button>

      <div className="mb-10 text-center">
        <h1 className="text-5xl minecraft-text mb-4">Button Playground</h1>
        <p className="text-xl font-sans text-white/80">Testing different button feels and interactions.</p>
      </div>

      <div className="flex flex-col gap-12 w-full max-w-4xl">
        
        <div className="bg-white/5 border border-white/10 p-8 rounded-xl backdrop-blur-sm">
          <h2 className="text-2xl font-heading mb-6 text-yellow-300">1. Neobrutalist Button</h2>
          <p className="font-sans mb-6 text-white/70">Thick shadow offset behind the button. On hover, the button moves toward the shadow. Feels playful and game-like.</p>
          <div className="button-row">
            <button className="test-btn btn-neo">Play Game</button>
            <button className="test-btn btn-neo" style={{ backgroundColor: '#f43f5e', color: 'white' }}>Cancel</button>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-8 rounded-xl backdrop-blur-sm">
          <h2 className="text-2xl font-heading mb-6 text-emerald-400">2. Floating / Lift Button</h2>
          <p className="font-sans mb-6 text-white/70">The button rises when hovered smoothly.</p>
          <div className="button-row">
            <button className="test-btn btn-float">Join Lobby</button>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-8 rounded-xl backdrop-blur-sm">
          <h2 className="text-2xl font-heading mb-6 text-rose-400">3. Spring Button Animation</h2>
          <p className="font-sans mb-6 text-white/70">Bouncy cubic-bezier scaling like Kahoot.</p>
          <div className="button-row">
            <button className="test-btn btn-spring">Bounce Me</button>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-8 rounded-xl backdrop-blur-sm">
          <h2 className="text-2xl font-heading mb-6 text-purple-400">4. 3D Pressable Button</h2>
          <p className="font-sans mb-6 text-white/70">Hover causes lift. Click causes sink. Very common in gaming.</p>
          <div className="button-row">
            <button className="test-btn btn-3d">Press Me</button>
          </div>
        </div>

      </div>
    </div>
  );
}
