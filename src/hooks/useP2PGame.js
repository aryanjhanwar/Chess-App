import { useCallback, useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';

const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  // Public relay fallback (best-effort) to improve connectivity on strict NAT.
  { urls: 'stun:openrelay.metered.ca:80' },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turns:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

function getPeerIdFromPin(pin) {
  return `online-chess-app-${pin}`;
}

function getPeerOptions(customId) {
  return {
    ...(customId ? { id: customId } : {}),
    secure: true,
    debug: 1,
    config: {
      iceServers: DEFAULT_ICE_SERVERS,
    },
  };
}

export function useP2PGame() {
  const peerRef = useRef(null);
  const connRef = useRef(null);
  const connectRetryTimerRef = useRef(null);

  const [status, setStatus] = useState('idle');
  const [role, setRole] = useState(null); // 'host' | 'guest' | null
  const [lastMessage, setLastMessage] = useState(null);

  const closeAll = useCallback(() => {
    if (connectRetryTimerRef.current) {
      clearTimeout(connectRetryTimerRef.current);
      connectRetryTimerRef.current = null;
    }

    if (connRef.current) {
      try {
        connRef.current.close();
      } catch {
        // no-op
      }
      connRef.current = null;
    }

    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch {
        // no-op
      }
      peerRef.current = null;
    }
  }, []);

  const clearLastMessage = useCallback(() => {
    setLastMessage(null);
  }, []);

  const attachConnection = useCallback((conn) => {
    connRef.current = conn;

    conn.on('open', () => {
      setStatus('connected');
    });

    conn.on('close', () => {
      setStatus('disconnected');
    });

    conn.on('error', () => {
      setStatus('error');
    });

    conn.on('data', (payload) => {
      try {
        const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
        setLastMessage(data);
      } catch {
        // ignore malformed payloads
      }
    });
  }, []);

  const hostStartWithPin = useCallback(async (pin) => {
    try {
      closeAll();
      setRole('host');
      setStatus('hosting');

      const peerId = getPeerIdFromPin(pin);
      const peer = new Peer(peerId, getPeerOptions());
      peerRef.current = peer;

      peer.on('open', () => {
        setStatus('waiting-for-joiner');
      });

      peer.on('connection', (conn) => {
        attachConnection(conn);
      });

      peer.on('error', (error) => {
        console.error('Peer host error:', error);
        if (error?.type === 'unavailable-id') {
          setStatus('pin-in-use');
          return;
        }
        setStatus('error');
      });
    } catch (error) {
      console.error('Host start failed:', error);
      setStatus('error');
      throw new Error('Failed to host with this PIN. Try another PIN.');
    }
  }, [attachConnection, closeAll]);

  const guestJoinWithPin = useCallback(async (pin) => {
    try {
      closeAll();
      setRole('guest');
      setStatus('connecting');

      const peer = new Peer(undefined, getPeerOptions());
      peerRef.current = peer;

      peer.on('open', () => {
        const targetId = getPeerIdFromPin(pin);
        let attempts = 0;

        const tryConnect = () => {
          attempts += 1;
          const conn = peer.connect(targetId, { reliable: true });
          attachConnection(conn);

          conn.on('error', (error) => {
            const isUnavailable = error?.type === 'peer-unavailable' || /Could not connect to peer/i.test(error?.message || '');
            if (isUnavailable && attempts < 5) {
              setStatus('connecting');
              connectRetryTimerRef.current = setTimeout(tryConnect, 1200);
            }
          });
        };

        tryConnect();
      });

      peer.on('error', (error) => {
        console.error('Peer guest error:', error);
        setStatus('error');
      });
    } catch (error) {
      console.error('Guest join failed:', error);
      setStatus('error');
      throw new Error('Failed to connect to host PIN.');
    }
  }, [attachConnection, closeAll]);

  const sendMessage = useCallback((message) => {
    const conn = connRef.current;
    if (!conn || !conn.open) return false;
    try {
      conn.send(message);
      return true;
    } catch {
      return false;
    }
  }, []);

  const disconnect = useCallback(() => {
    closeAll();
    setRole(null);
    setStatus('idle');
    setLastMessage(null);
  }, [closeAll]);

  useEffect(() => {
    return () => {
      closeAll();
    };
  }, [closeAll]);

  return {
    status,
    role,
    isConnected: status === 'connected',
    lastMessage,
    clearLastMessage,
    hostStartWithPin,
    guestJoinWithPin,
    sendMessage,
    disconnect,
  };
}
