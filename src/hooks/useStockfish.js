

import { useState, useEffect, useRef } from 'react';

export const useStockfish = () => {
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [bestMove, setBestMove] = useState(null);
  const [depth, setDepth] = useState(0);

  const engineRef = useRef(null);
  const workerUrlRef = useRef(null);
  const currentFenRef = useRef('');
  const searchModeRef = useRef('idle');
  const requestSeqRef = useRef(0);
  const pendingMoveRef = useRef(null);

  const clearPendingMove = (result = null) => {
    if (!pendingMoveRef.current) return;

    const { resolve, timeoutId } = pendingMoveRef.current;
    if (timeoutId) clearTimeout(timeoutId);
    pendingMoveRef.current = null;

    if (resolve) resolve(result);
  };

  const isCurrentMoveRequest = (requestId) => {
    return pendingMoveRef.current && pendingMoveRef.current.requestId === requestId;
  };

  // Initialize Stockfish engine
  useEffect(() => {
    let engine = null;

    const initEngine = () => {
      try {
        console.log('Initializing Stockfish engine...');

        // Prefer bundled local worker for reliability; fallback to CDN only if needed.
        try {
          engine = new Worker('/stockfish.js');
          console.log('Stockfish worker created from local asset: /stockfish.js');
        } catch (localError) {
          console.warn('Local Stockfish worker failed, falling back to CDN:', localError);

          const workerCode = `importScripts('https://unpkg.com/stockfish.js@10.0.2/stockfish.js');`;
          const blob = new Blob([workerCode], { type: 'application/javascript' });
          const workerUrl = URL.createObjectURL(blob);
          workerUrlRef.current = workerUrl;
          engine = new Worker(workerUrl);
          console.log('Stockfish worker created from CDN fallback');
        }

        engineRef.current = engine;

        // Handle messages from engine
        engine.onmessage = (event) => {
          const line = event.data || event;
          handleEngineMessage(line);
        };

        engine.onerror = (error) => {
          console.error('Stockfish worker error:', error);
          setIsEngineReady(false);
        };

        // Initialize UCI mode
        sendCommand('uci');

      } catch (error) {
        console.error('Failed to initialize Stockfish:', error);
        setIsEngineReady(false);
      }
    };

    initEngine();

    return () => {
      if (engine && engine.terminate) {
        engine.terminate();
      }
      if (workerUrlRef.current) {
        URL.revokeObjectURL(workerUrlRef.current);
        workerUrlRef.current = null;
      }
      clearPendingMove(null);
      searchModeRef.current = 'idle';
    };
  }, []);

  // Handle messages from Stockfish
  const handleEngineMessage = (line) => {
    if (!line || typeof line !== 'string') return;
    console.log('Stockfish:', line);

    // Engine ready
    if (line === 'uciok') {
      sendCommand('isready');
    } else if (line === 'readyok') {
      setIsEngineReady(true);
      sendCommand('setoption name UCI_Variant value chess');
      console.log('✅ Stockfish engine ready');
    }

    // Best move
    else if (line.startsWith('bestmove')) {
      const parts = line.split(' ');
      const move = parts[1];

      setBestMove(move);
      setIsThinking(false);
      searchModeRef.current = 'idle';

      console.log('Best move:', move);

      if (pendingMoveRef.current) {
        const safeMove = move === '(none)' ? null : move;
        clearPendingMove(safeMove);
      } else {
        // Analysis bestmove or stale response from a timed-out request.
        console.log('Ignoring bestmove without pending move request');
      }
    }

    // Evaluation info
    else if (line.startsWith('info') && line.includes('score')) {
      try {
        // Extract depth
        const depthMatch = line.match(/depth (\d+)/);
        if (depthMatch) {
          setDepth(parseInt(depthMatch[1]));
        }

        // Extract score
        const scoreMatch = line.match(/score (cp|mate) (-?\d+)/);
        if (scoreMatch) {
          const [, type, value] = scoreMatch;
          if (type === 'cp') {
            setEvaluation({ type: 'cp', value: parseInt(value) / 100 });
          } else {
            setEvaluation({ type: 'mate', value: parseInt(value) });
          }
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
  };
  // Evaluate position only (no move)
  const evaluatePosition = async (fen, depth = 12, moveTime = 500) => {
    if (!isEngineReady) return;

    // Never interrupt an active move search.
    if (pendingMoveRef.current) return;

    currentFenRef.current = fen;
    searchModeRef.current = 'eval';
    setIsThinking(true);

    sendCommand('stop');
    sendCommand(`position fen ${fen}`);
    sendCommand(`go depth ${depth} movetime ${moveTime}`);
    // Evaluation will be updated via info score in handleEngineMessage
  };

  // Send command to engine
  const sendCommand = (cmd) => {
    if (engineRef.current && engineRef.current.postMessage) {
      console.log('Sending command:', cmd);
      engineRef.current.postMessage(cmd);
    }
  };

  // Set board position
  const setPosition = async (fen) => {
    if (!isEngineReady) {
      console.warn('Engine not ready');
      return false;
    }

    currentFenRef.current = fen;
    searchModeRef.current = 'idle';
    sendCommand('stop');
    sendCommand(`position fen ${fen}`);
    return true;
  };

  // Get best move
  const getBestMove = (depth = 10, moveTime = 1000) => {
    return new Promise((resolve) => {
      if (!isEngineReady) {
        console.warn('Engine not ready for move request');
        resolve(null);
        return;
      }

      // Cancel any older unresolved request before starting a fresh one.
      if (pendingMoveRef.current) {
        clearPendingMove(null);
      }

      const requestId = ++requestSeqRef.current;

      setIsThinking(true);
      searchModeRef.current = 'move';
      sendCommand('stop');

      const timeoutId = setTimeout(() => {
        if (isCurrentMoveRequest(requestId)) {
          console.warn('Move request timed out');
          setIsThinking(false);
          searchModeRef.current = 'idle';
          clearPendingMove(null);
        }
      }, moveTime + 5000);

      pendingMoveRef.current = {
        requestId,
        resolve,
        timeoutId,
      };

      // Request best move with time limit
      sendCommand(`go depth ${depth} movetime ${moveTime}`);
    });
  };

  // Set engine difficulty
  const setSkillLevel = (level) => {
    if (!isEngineReady) return;

    // Stockfish skill level: 0-20
    const skillLevel = Math.max(0, Math.min(20, level));
    sendCommand(`setoption name Skill Level value ${skillLevel}`);
    console.log(`Set skill level to ${skillLevel}`);
  };

  // Set search depth limit
  const setSearchDepth = (searchDepth) => {
    if (!isEngineReady) return;
    sendCommand(`setoption name Depth value ${searchDepth}`);
  };

  // Stop analysis
  const stopAnalysis = () => {
    sendCommand('stop');
    searchModeRef.current = 'idle';
    clearPendingMove(null);
    setIsThinking(false);
  };

  // Start new game
  const newGame = () => {
    stopAnalysis();
    sendCommand('ucinewgame');
    sendCommand('isready');
  };

  return {
    isEngineReady,
    isThinking,
    evaluation,
    bestMove,
    depth,
    setPosition,
    getBestMove,
    setSkillLevel,
    setSearchDepth,
    stopAnalysis,
    newGame,
    evaluatePosition
  };
};
