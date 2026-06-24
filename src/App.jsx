import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAtomValue } from 'jotai';

import PlayScreen from './screens/PlayScreen';
import AuthScreen from './components/AuthScreen';
import ModeSelectScreen from './components/ModeSelectScreen';
import MultiplayerModeSelectScreen from './components/MultiplayerModeSelectScreen';
import MultiplayerLobbyScreen from './components/MultiplayerLobbyScreen';
import TestScreen from './components/TestScreen';

import { useP2PGame } from './hooks/useP2PGame';
import { uiSettingsAtom } from './state/themeState';
import { BACKGROUND_PRESETS } from './constants/boardThemes';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('http://localhost:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setCurrentUser({
            id: data.data._id,
            name: data.data.username,
            email: data.data.email,
            rating: data.data.rating,
            isGuest: false
          });
        } else {
          localStorage.removeItem('token');
        }
      })
      .catch(err => console.error('Auth fetch error:', err));
    }
  }, []);

  const [isMultiplayerGame, setIsMultiplayerGame] = useState(false);
  const [multiplayerSide, setMultiplayerSide] = useState('w');
  const [isMultiplayerStarted, setIsMultiplayerStarted] = useState(false);
  const [multiplayerNotice, setMultiplayerNotice] = useState('');
  const [entryMode, setEntryMode] = useState(null);
  const [gameMode, setGameMode] = useState('human');

  const p2p = useP2PGame();
  
  const uiSettings = useAtomValue(uiSettingsAtom);
  const appBackgroundStyle = useMemo(() => {
    if (uiSettings.backgroundStyle === 'bg-custom-solid') {
      return { background: uiSettings.customBackgroundColor || '#17212c' };
    }
    return BACKGROUND_PRESETS[uiSettings.backgroundStyle]?.style || BACKGROUND_PRESETS['bg-classic'].style;
  }, [uiSettings.backgroundStyle, uiSettings.customBackgroundColor]);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isAuthRoute = ['/auth', '/login', '/signup'].includes(location.pathname);
    const isAdminRoute = location.pathname === '/admin';
    
    if (!currentUser && !isAuthRoute && !isAdminRoute) {
      navigate('/auth', { replace: true });
    } else if (currentUser && isAuthRoute) {
      navigate('/menu', { replace: true });
    } else if (location.pathname === '/') {
      navigate(currentUser ? '/menu' : '/auth', { replace: true });
    }
  }, [currentUser, location.pathname, navigate]);

  const startMultiplayerMatch = (side) => {
    setIsMultiplayerGame(true);
    setMultiplayerSide(side);
    setGameMode('human');
    setIsMultiplayerStarted(true);
    setMultiplayerNotice('');
  };

  return (
    <>
      <Routes>
        <Route path="/auth" element={
          <div className={`h-screen w-screen overflow-hidden bg-cover bg-center`} style={appBackgroundStyle}>
            <AuthScreen 
              onLogin={(user) => { setCurrentUser(user); navigate('/menu'); }} 
              onGuest={() => { setCurrentUser({ id: 'guest', name: 'Guest', isGuest: true }); navigate('/menu'); }} 
            />
          </div>
        } />
        <Route path="/login" element={<Navigate to="/auth" replace />} />
        <Route path="/signup" element={<Navigate to="/auth" replace />} />

        <Route path="/admin" element={
          <div className="min-h-screen flex items-center justify-center bg-[#0a0f18] text-white">
            <div className="bg-white/5 border border-white/10 p-8 rounded-2xl flex flex-col items-center">
              <span className="text-4xl mb-4">🔒</span>
              <h1 className="text-2xl font-bold tracking-wider text-cyan-400 mb-2">ADMIN PORTAL</h1>
              <p className="text-white/60 text-sm">Secure area placeholder. Backend integration required.</p>
              <button onClick={() => navigate('/')} className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-colors">Return to App</button>
            </div>
          </div>
        } />

        <Route path="/test" element={
          <TestScreen onBack={() => navigate('/menu')} />
        } />

        <Route path="/menu" element={
          <div className={`h-screen w-screen overflow-hidden bg-cover bg-center`} style={appBackgroundStyle}>
            <ModeSelectScreen
              onSelectLocal={() => {
                setIsMultiplayerGame(false);
                setMultiplayerSide('w');
                setIsMultiplayerStarted(false);
                setMultiplayerNotice('');
                p2p.disconnect();
                setEntryMode('local');
                navigate('/play');
              }}
              onSelectMultiplayer={() => {
                setEntryMode('multiplayer_select');
                setGameMode('human');
                setIsMultiplayerStarted(false);
                setMultiplayerNotice('');
                navigate('/multiplayer');
              }}
            />
          </div>
        } />

        <Route path="/multiplayer" element={
          <div className={`h-screen w-screen overflow-hidden bg-cover bg-center`} style={appBackgroundStyle}>
            <MultiplayerModeSelectScreen
              onBack={() => navigate('/menu')}
              onSelectOnline={() => { alert("Global Online matchmaking is coming soon!"); }}
              onSelectLan={() => {
                setEntryMode('multiplayer_lobby');
                navigate('/multiplayer/lobby');
              }}
            />
          </div>
        } />

        <Route path="/multiplayer/lobby" element={
          <div className={`h-screen w-screen overflow-hidden bg-cover bg-center`} style={appBackgroundStyle}>
            <MultiplayerLobbyScreen
              onBack={() => navigate('/multiplayer')}
              onContinueLocal={() => { setEntryMode('local'); navigate('/play'); }}
              p2p={p2p}
              onStartMultiplayer={(side) => { startMultiplayerMatch(side); navigate('/play'); }}
            />
          </div>
        } />

        <Route path="/play" element={
          <PlayScreen 
            currentUser={currentUser}
            isMultiplayerGame={isMultiplayerGame}
            setIsMultiplayerGame={setIsMultiplayerGame}
            multiplayerSide={multiplayerSide}
            setMultiplayerSide={setMultiplayerSide}
            isMultiplayerStarted={isMultiplayerStarted}
            setIsMultiplayerStarted={setIsMultiplayerStarted}
            multiplayerNotice={multiplayerNotice}
            setMultiplayerNotice={setMultiplayerNotice}
            entryMode={entryMode}
            setEntryMode={setEntryMode}
            gameMode={gameMode}
            setGameMode={setGameMode}
            p2p={p2p}
            appBackgroundStyle={appBackgroundStyle}
          />
        } />
        
        <Route path="*" element={<Navigate to={currentUser ? '/menu' : '/auth'} replace />} />
      </Routes>
    </>
  );
}

export default App;