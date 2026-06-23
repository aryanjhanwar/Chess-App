import { useState, useRef, useEffect } from 'react';

export default function Sidebar({ onSelectGameMode, onOpenSettings, onRefresh, onPlaySelect }) {
  const [showPlayMenu, setShowPlayMenu] = useState(false);
  const menuTimeoutRef = useRef(null);

  const handleMouseEnter = () => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
      menuTimeoutRef.current = null;
    }
    setShowPlayMenu(true);
  };

  const handleMouseLeave = () => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
    }
    menuTimeoutRef.current = setTimeout(() => {
      setShowPlayMenu(false);
      menuTimeoutRef.current = null;
    }, 200); // 200ms delay before hiding
  };

  useEffect(() => {
    return () => {
      if (menuTimeoutRef.current) {
        clearTimeout(menuTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className="hidden lg:flex h-screen w-[150px] shrink-0 flex-col items-center py-4 px-3"
      style={{
        background: 'rgba(8, 16, 26, 0.34)',
        backdropFilter: 'blur(10px)',
        borderRight: '1px solid rgba(255,255,255,0.10)',
      }}
    >
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
          <div className="flex items-center gap-3 text-white font-semibold py-3 px-4 rounded-lg cursor-pointer" style={{ background: 'rgba(255,255,255,0.14)' }}>
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
                  if (onPlaySelect) onPlaySelect('human');
                  else onSelectGameMode({ mode: 'human' });
                  setShowPlayMenu(false);
                }}
                className="w-full text-left px-4 py-2.5 text-white hover:bg-slate-700 transition-colors flex items-center gap-3"
              >
                <span className="text-lg">👥</span>
                <span className="font-medium">vs Human</span>
              </button>
              <button
                onClick={() => {
                  if (onPlaySelect) onPlaySelect('computer');
                  else onSelectGameMode({ mode: 'computer' });
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
        <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/20 cursor-pointer" onClick={onRefresh}>
          <span>🔄</span>
          <span className="text-sm">Refresh</span>
        </div>
        <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/20 cursor-pointer" onClick={onOpenSettings}>
          <span>⚙️</span>
          <span className="text-sm">Settings</span>
        </div>
        <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/20 cursor-pointer">
          <span>❓</span>
          <span className="text-sm">Support</span>
        </div>
      </div>
    </div>
  );
}
