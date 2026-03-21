import { useState, useEffect, useRef } from 'react';

export default function Sidebar({ onSelectGameMode, onOpenSettings }) {
  const [showPlayMenu, setShowPlayMenu] = useState(false);
  const menuTimeoutRef = useRef(null);

  const handleMouseEnter = () => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
    }
    setShowPlayMenu(true);
  };

  const handleMouseLeave = () => {
    menuTimeoutRef.current = setTimeout(() => {
      setShowPlayMenu(false);
    }, 200); // 200ms delay before hiding
  };

  return (
    <div className="h-screen w-[150px] bg-[#0a87b3] flex flex-col items-center py-4 px-3">
      {/* Logo */}
      <div className="mb-8">
        <div className="text-white font-black text-2xl flex items-center gap-1">
          <span className="text-3xl">♟️</span>
          <span className="text-sm">Chess.com</span>
        </div>
      </div>

      {/* Main Menu */}
      <div className="flex-1">
        <div 
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex items-center gap-3 text-white font-semibold py-3 px-4 rounded-lg bg-[#0e8db7] cursor-pointer">
            <span className="text-xl">♟️</span>
            <span>Play</span>
          </div>
          
          {/* Dropdown Menu */}
          {showPlayMenu && (
            <div 
              className="absolute left-full top-0 ml-1 bg-slate-800 rounded-lg shadow-2xl py-2 min-w-[180px] z-50 border border-slate-700"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                onClick={() => {
                  onSelectGameMode({ mode: 'human' });
                  setShowPlayMenu(false);
                }}
                className="w-full text-left px-4 py-2.5 text-white hover:bg-slate-700 transition-colors flex items-center gap-3"
              >
                <span className="text-lg">👥</span>
                <span className="font-medium">Play</span>
              </button>
              <button
                onClick={() => {
                  onSelectGameMode({ mode: 'computer' });
                  setShowPlayMenu(false);
                }}
                className="w-full text-left px-4 py-2.5 text-white hover:bg-slate-700 transition-colors flex items-center gap-3"
              >
                <span className="text-lg">🤖</span>
                <span className="font-medium">vs Computer</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Menu */}
      <div className="space-y-2 text-white opacity-90">
        <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[#0e8db7] cursor-pointer" onClick={onOpenSettings}>
          <span>⚙️</span>
          <span className="text-sm">Settings</span>
        </div>
        <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[#0e8db7] cursor-pointer">
          <span>❓</span>
          <span className="text-sm">Support</span>
        </div>
      </div>
    </div>
  );
}
