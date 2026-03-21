import { useEffect, useState } from 'react';

function generatePin() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export default function MultiplayerLobbyScreen({
  onBack,
  onContinueLocal,
  p2p,
  onStartMultiplayer,
}) {
  const [mode, setMode] = useState('host'); // 'host' | 'join'
  const [hostPin, setHostPin] = useState(generatePin());
  const [joinPin, setJoinPin] = useState('');
  const [hostSide, setHostSide] = useState('w');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (p2p.isConnected && p2p.role === 'guest') {
      setMessage('Connected. Waiting for host to start the match...');
    }
  }, [p2p.isConnected, p2p.role]);

  useEffect(() => {
    if (p2p.status === 'pin-in-use') {
      setMessage('This PIN is already in use. Try another 6-digit PIN.');
    }
  }, [p2p.status]);

  const copyText = async (value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setMessage('Copied to clipboard.');
    } catch {
      setMessage('Copy failed. Copy manually from the box.');
    }
  };

  const handleHostCreate = async () => {
    setMessage('');
    if (!/^\d{6}$/.test(hostPin)) {
      setMessage('Host PIN must be 6 digits.');
      return;
    }

    try {
      await p2p.hostStartWithPin(hostPin);
      setMode('host');
      setMessage('Host is ready. Share this 6-digit PIN with your friend.');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleGuestJoin = async () => {
    setMessage('');
    if (!/^\d{6}$/.test(joinPin.trim())) {
      setMessage('Enter a valid 6-digit host PIN.');
      return;
    }

    try {
      await p2p.guestJoinWithPin(joinPin.trim());
      setMode('join');
      setMessage('Connecting to host...');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleStartMatch = () => {
    if (!p2p.isConnected || p2p.role !== 'host') {
      setMessage('Connect with guest first.');
      return;
    }

    p2p.sendMessage({ type: 'start_game', hostSide });
    onStartMultiplayer(hostSide);
  };

  const handleReset = () => {
    p2p.disconnect();
    setHostPin(generatePin());
    setJoinPin('');
    setMode('host');
    setMessage('Session reset.');
  };

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-[#0bb0e5] via-[#0483ad] to-[#0bb0e5] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl rounded-3xl border border-white/25 bg-white/10 backdrop-blur-md shadow-2xl p-5 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-2xl sm:text-3xl font-black">Multiplayer Lobby</h2>
          <button
            onClick={onBack}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-white bg-white/15 hover:bg-white/25 transition-all"
          >
            Back
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-white/20 bg-black/10 p-1 grid grid-cols-2 gap-1">
            <button
              onClick={() => setMode('host')}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${mode === 'host' ? 'bg-emerald-600/90 text-white' : 'bg-white/10 text-white/85 hover:bg-white/20'}`}
            >
              I Am Host
            </button>
            <button
              onClick={() => setMode('join')}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${mode === 'join' ? 'bg-cyan-700/90 text-white' : 'bg-white/10 text-white/85 hover:bg-white/20'}`}
            >
              I Am Joining
            </button>
          </div>

          {mode === 'host' ? (
            <div className="rounded-xl border border-white/20 bg-black/10 p-3 sm:p-4">
              <p className="text-white font-semibold mb-3">Host in 2 steps</p>
              <div className="mb-3">
                <p className="text-sm text-white/80 mb-2">Choose your color</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setHostSide('w')}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${hostSide === 'w' ? 'bg-amber-500/90 text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  >
                    Host: White
                  </button>
                  <button
                    onClick={() => setHostSide('b')}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${hostSide === 'b' ? 'bg-slate-800/95 text-white border border-white/30' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  >
                    Host: Black
                  </button>
                </div>
                <p className="mt-2 text-xs text-white/70">Joiner will get {hostSide === 'w' ? 'Black' : 'White'} automatically.</p>
              </div>

              <label className="block text-sm text-white/80 mb-1">Host PIN (6 digits)</label>
              <input
                value={hostPin}
                onChange={(e) => setHostPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full rounded-lg border border-white/25 bg-white/10 text-white text-center tracking-[0.3em] font-bold text-lg px-3 py-2"
              />
              <button
                onClick={handleHostCreate}
                className="w-full rounded-lg px-4 py-2.5 font-semibold text-white bg-emerald-600/85 hover:bg-emerald-500/90 transition-all"
              >
                Step 1: Start Hosting
              </button>

              <button
                onClick={() => copyText(hostPin)}
                className="mt-2 rounded-lg px-3 py-2 text-sm font-semibold text-white bg-white/15 hover:bg-white/25 transition-all"
              >
                Copy Host PIN
              </button>

              <button
                onClick={handleStartMatch}
                disabled={!(p2p.isConnected && p2p.role === 'host')}
                className="mt-3 w-full rounded-lg px-4 py-2.5 font-semibold text-white bg-amber-600/90 hover:bg-amber-500/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Step 2: Start Match (Host)
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-white/20 bg-black/10 p-3 sm:p-4">
              <p className="text-white font-semibold mb-3">Join in 2 steps</p>
              <label className="block text-sm text-white/80 mb-1">Enter Host PIN</label>
              <input
                value={joinPin}
                onChange={(e) => setJoinPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full rounded-lg border border-white/25 bg-white/10 text-white text-center tracking-[0.3em] font-bold text-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
              />

              <button
                onClick={handleGuestJoin}
                className="mt-2 w-full rounded-lg px-4 py-2.5 font-semibold text-white bg-emerald-600/85 hover:bg-emerald-500/90 transition-all"
              >
                Step 1: Connect to Host
              </button>

              <p className="mt-3 text-xs text-white/70">Step 2: Wait for host to press Start Match.</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleReset}
              className="rounded-xl px-4 py-3 font-semibold text-white bg-white/15 hover:bg-white/25 transition-all"
            >
              Reset Session
            </button>
            <button
              onClick={onContinueLocal}
              className="rounded-xl px-4 py-3 font-semibold text-white bg-white/15 hover:bg-white/25 transition-all"
            >
              Continue In Local App
            </button>
          </div>

          <div className="rounded-xl border border-white/20 bg-black/10 p-3 sm:p-4 text-sm text-white/85">
            <p>Status: <span className="font-semibold text-white">{p2p.status}</span></p>
            {message ? <p className="mt-1">{message}</p> : null}
            <p className="mt-2 text-xs text-white/70">Host is White, Joiner is Black.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
