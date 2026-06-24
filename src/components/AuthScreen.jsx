import React, { useState } from 'react';
import DriftingPiecesBackground from './DriftingPiecesBackground';

export default function AuthScreen({ onLogin, onGuest }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !username)) return;
    
    setError(null);
    setLoading(true);

    try {
      const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login';
      const body = isSignUp ? { username, email, password } : { email, password };
      
      const res = await fetch(`http://localhost:5001${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('token', data.data.token);
        onLogin({
          id: data.data._id,
          name: data.data.username,
          email: data.data.email,
          rating: data.data.rating,
          isGuest: false
        });
      } else {
        // If the backend sent specific validation errors (which is an object mapping fields to messages), display the first one
        if (data.errors && Object.keys(data.errors).length > 0) {
          setError(Object.values(data.errors)[0]);
        } else {
          setError(data.message || 'Authentication failed');
        }
      }
    } catch (err) {
      setError('Network error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full relative overflow-hidden">
      
      {/* Background drifting pieces span the entire component but will be blurred on the right side */}
      <div className="absolute inset-0 z-0">
        <DriftingPiecesBackground />
      </div>

      {/* LEFT PANEL: Branding & Introduction */}
      <div className="relative z-10 hidden lg:flex flex-col justify-between w-[60%] p-14 bg-transparent pointer-events-none">
        
        {/* Logo and Brand */}
        <div className="flex flex-col items-start">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-xl shadow-cyan-500/30">
            <span className="text-4xl text-white drop-shadow-md">♞</span>
          </div>
          <h1 className="text-6xl font-black tracking-tighter text-white mt-6 premium-title">
            CHESS<span className="text-cyan-400">PRO</span>
          </h1>
          <p className="text-white/70 text-lg uppercase tracking-[0.2em] font-semibold mt-3">
            The Grandmaster Edition
          </p>
        </div>

        {/* Feature List */}
        <div className="my-auto">
          <h2 className="text-2xl font-bold text-white mb-8">What's new in this version?</h2>
          <ul className="space-y-8">
            <li className="flex items-start gap-5">
              <div className="w-12 h-12 shrink-0 rounded-full bg-white/5 flex items-center justify-center text-cyan-400 text-xl border border-white/10 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                🤖
              </div>
              <div>
                <h3 className="text-white font-bold text-xl mb-1">Advanced Engine</h3>
                <p className="text-white/60 text-sm leading-relaxed max-w-sm">
                  Play against state-of-the-art AI locally with configurable difficulty settings.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-5">
              <div className="w-12 h-12 shrink-0 rounded-full bg-white/5 flex items-center justify-center text-purple-400 text-xl border border-white/10 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                🌐
              </div>
              <div>
                <h3 className="text-white font-bold text-xl mb-1">Global Matchmaking</h3>
                <p className="text-white/60 text-sm leading-relaxed max-w-sm">
                  Compete with players worldwide or connect securely over your local network.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-5">
              <div className="w-12 h-12 shrink-0 rounded-full bg-white/5 flex items-center justify-center text-emerald-400 text-xl border border-white/10 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                📈
              </div>
              <div>
                <h3 className="text-white font-bold text-xl mb-1">Detailed Analysis</h3>
                <p className="text-white/60 text-sm leading-relaxed max-w-sm">
                  Review your boards post-match to improve your ELO and tactics.
                </p>
              </div>
            </li>
          </ul>
        </div>

        <div className="text-white/30 text-sm font-medium">
          © 2026 ChessPro Interactive. All rights reserved.
        </div>
      </div>

      {/* RIGHT PANEL: Auth Form Overlay */}
      <div className="relative z-20 flex-1 bg-[#0a0f18]/80 lg:bg-[#080c14]/95 backdrop-blur-2xl border-l border-white/10 shadow-[-30px_0_60px_rgba(0,0,0,0.6)] overflow-y-auto no-scrollbar">
        
        <div className="min-h-full flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-[360px] animate-rise-in py-8">
          
          {/* Mobile Logo Fallback */}
          <div className="lg:hidden flex flex-col items-center mb-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-xl shadow-cyan-500/30 mb-3">
              <span className="text-3xl text-white">♞</span>
            </div>
            <h1 className="text-3xl font-black text-white premium-title">CHESS<span className="text-cyan-400">PRO</span></h1>
          </div>

          <div className="mb-6 text-center lg:text-left">
            <h2 className="text-3xl lg:text-4xl font-black text-white mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-white/50 text-sm lg:text-base">
              {isSignUp ? 'Sign up to track your ELO and play online.' : 'Enter your details to sign in to your profile.'}
            </p>
          </div>

          {/* Social Logins */}
          <div className="flex flex-col gap-3 mb-6">
            <button className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-bold py-3 rounded-xl transition-all shadow-[0_4px_0_rgba(255,255,255,0.4)] hover:translate-y-[-1px] hover:shadow-[0_5px_0_rgba(255,255,255,0.4)] active:translate-y-[3px] active:shadow-none text-sm lg:text-base">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
            
            <button className="w-full flex items-center justify-center gap-3 bg-[#1e2532] border border-white/10 hover:bg-[#252d3d] text-white font-bold py-3 rounded-xl transition-all shadow-[0_4px_0_rgba(0,0,0,0.4)] hover:translate-y-[-1px] active:translate-y-[3px] active:shadow-none text-sm lg:text-base">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.78.78-.04 1.94-.84 3.34-.72 1.14.09 2.21.58 2.94 1.45-2.48 1.43-2.05 4.8.46 5.75-.58 1.54-1.32 3.16-2.82 4.71m-2.48-13.43c.53-2.02-1.12-3.83-3.15-3.79-.62 2.14 1.25 3.96 3.15 3.79"/>
              </svg>
              Continue with Apple
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="h-px bg-white/10 flex-1"></div>
            <span className="text-white/30 text-xs font-semibold uppercase tracking-widest">Or continue with email</span>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl mb-4 text-sm font-bold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#121926] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all font-medium text-sm lg:text-base"
                  placeholder="MagnusCarlsen"
                  required={isSignUp}
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#121926] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all font-medium text-sm lg:text-base"
                placeholder="grandmaster@chess.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#121926] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all font-medium text-sm lg:text-base pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors p-1"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input 
                    type="checkbox" 
                    className="peer sr-only"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                  />
                  <div className="w-4 h-4 rounded border-2 border-white/20 bg-[#121926] peer-checked:bg-cyan-500 peer-checked:border-cyan-500 transition-all"></div>
                  <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-xs lg:text-sm font-medium text-white/60 group-hover:text-white transition-colors">Remember me</span>
              </label>
              <button type="button" className="text-xs lg:text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
                Forgot password?
              </button>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className={`w-full bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_0_rgb(6,182,212)] hover:translate-y-[-1px] hover:shadow-[0_5px_0_rgb(6,182,212)] active:translate-y-[3px] active:shadow-none mt-2 text-base lg:text-lg ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div className="mt-6">
            <button 
              onClick={onGuest}
              type="button"
              className="w-full group relative overflow-hidden bg-transparent border border-white/20 text-white/80 font-bold py-3.5 rounded-xl transition-all hover:border-white/40 hover:text-white"
            >
              <div className="absolute inset-0 bg-white/5 translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-300 ease-out"></div>
              <span className="relative z-10 text-base lg:text-lg">Play as Guest &rarr;</span>
            </button>
          </div>

          <p className="text-center mt-6 text-xs lg:text-sm text-white/50 font-medium pb-4 lg:pb-0">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button 
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-white font-bold hover:text-cyan-400 transition-colors ml-1"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
        </div>
      </div>

    </div>
  );
}
