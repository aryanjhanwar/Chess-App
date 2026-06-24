import { useState, useRef, useEffect } from 'react';

export default function Sidebar({ currentUser, onSelectGameMode, onOpenSettings, onRefresh, onPlaySelect, onOpenTest }) {
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
    }, 250);
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
      className="hidden lg:flex h-screen w-[220px] shrink-0 flex-col py-6 px-4 shadow-2xl relative z-40 bg-black/20 backdrop-blur-xl border-r border-white/10"
    >
      {/* Logo */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 cursor-pointer">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-xl text-white">♞</span>
          </div>
          <span className="text-lg font-black text-white tracking-tight">
            CHESS<span className="text-blue-400">PRO</span>
          </span>
        </div>
      </div>

      {/* User Profile */}
      {currentUser && (
        <div className="mb-6 p-2 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5">
          <div className="w-9 h-9 shrink-0 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white uppercase text-base shadow-inner">
            {currentUser.name ? currentUser.name.charAt(0) : '?'}
          </div>
          <div className="flex-1 overflow-hidden">
            <h3 className="text-xs font-bold text-white truncate">{currentUser.name}</h3>
            <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">{currentUser.isGuest ? 'Guest' : 'Grandmaster'}</p>
          </div>
        </div>
      )}

      {/* Main Menu */}
      <div className="flex-1 space-y-1.5">
        <div className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] pl-2 mb-3">Menu</div>
        
        <div 
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex items-center gap-2.5 text-white font-medium py-2.5 px-3 rounded-xl cursor-pointer transition-all duration-300 hover:bg-white/10 group" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-lg group-hover:scale-110 transition-transform">🎯</span>
            <span className="text-sm">Play Game</span>
            <span className="ml-auto text-white/40 text-[10px]">▼</span>
          </div>
          
          {/* Dropdown Menu */}
          <div 
            className={`absolute left-full top-0 ml-4 bg-[#141b26]/95 backdrop-blur-xl rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/10 py-2 min-w-[180px] z-50 transition-all duration-300 origin-left ${showPlayMenu ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="px-3 pb-2 mb-2 border-b border-white/5 text-[10px] font-semibold text-white/40 uppercase tracking-wider">
              Select Mode
            </div>
            <button
              onClick={() => {
                if (onPlaySelect) onPlaySelect('human');
                else onSelectGameMode({ mode: 'human' });
                setShowPlayMenu(false);
              }}
              className="w-full text-left px-3 py-2 text-white/90 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2.5 mx-1 w-[calc(100%-8px)] rounded-lg"
            >
              <span className="text-base bg-white/5 w-7 h-7 rounded-lg flex items-center justify-center">🤝</span>
              <span className="font-medium text-sm">vs Human</span>
            </button>
            <button
              onClick={() => {
                if (onPlaySelect) onPlaySelect('computer');
                else onSelectGameMode({ mode: 'computer' });
                setShowPlayMenu(false);
              }}
              className="w-full text-left px-3 py-2 text-white/90 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2.5 mx-1 mt-1 w-[calc(100%-8px)] rounded-lg"
            >
              <span className="text-base bg-white/5 w-7 h-7 rounded-lg flex items-center justify-center">🤖</span>
              <span className="font-medium text-sm">vs Computer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Menu */}
      <div className="space-y-0.5">
        <div className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] pl-2 mb-2">System</div>
        <div className="flex items-center gap-2.5 py-2 px-3 rounded-xl hover:bg-white/10 text-white/80 hover:text-white cursor-pointer transition-all group" onClick={onRefresh}>
          <span className="text-base group-hover:rotate-180 transition-transform duration-500">🔄</span>
          <span className="font-medium text-xs">Refresh Board</span>
        </div>
        <div className="flex items-center gap-2.5 py-2 px-3 rounded-xl hover:bg-white/10 text-white/80 hover:text-white cursor-pointer transition-all group" onClick={onOpenSettings}>
          <span className="text-base group-hover:rotate-90 transition-transform duration-500">⚙️</span>
          <span className="font-medium text-xs">Settings</span>
        </div>
        <div className="flex items-center gap-2.5 py-2 px-3 rounded-xl hover:bg-white/10 text-white/80 hover:text-white cursor-pointer transition-all group" onClick={onOpenTest}>
          <span className="text-base group-hover:scale-110 transition-transform duration-300">🧪</span>
          <span className="font-medium text-xs">Test Sandbox</span>
        </div>
        <div className="flex items-center gap-2.5 py-2 px-3 rounded-xl hover:bg-white/10 text-white/80 hover:text-white cursor-pointer transition-all group">
          <span className="text-base group-hover:scale-110 transition-transform duration-300">🎧</span>
          <span className="font-medium text-xs">Support</span>
        </div>
      </div>
    </div>
  );
}
