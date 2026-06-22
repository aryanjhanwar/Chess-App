import { useEffect, useRef, useState } from 'react';
import { UciEngine } from '../lib/engine/uciEngine.js';

export const useEngine = (engineProfile = 'auto') => {
  const engineRef = useRef(null);
  const [state, setState] = useState({
    isEngineReady: false,
    isThinking: false,
    evaluation: null,
    bestMove: null,
    depth: 0,
    activeEnginePath: '',
  });

  useEffect(() => {
    let isDisposed = false;

    const engine = new UciEngine({
      engineProfile,
      onStateChange: (nextState) => {
        if (!isDisposed) {
          setState(nextState);
        }
      },
    });

    engineRef.current = engine;

    engine.init().catch((error) => {
      console.error('Failed to initialize UCI engine:', error);
    });

    return () => {
      isDisposed = true;
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, [engineProfile]);

  const getEngine = () => engineRef.current;

  return {
    ...state,
    setPosition: (fen) => getEngine()?.setPosition(fen) ?? Promise.resolve(false),
    getBestMove: (depth, moveTime) => getEngine()?.getBestMove(depth, moveTime) ?? Promise.resolve(null),
    setSkillLevel: (level) => getEngine()?.setSkillLevel(level),
    setSearchDepth: (depth) => getEngine()?.setSearchDepth(depth),
    stopAnalysis: () => getEngine()?.stopAnalysis(),
    newGame: () => getEngine()?.newGame(),
    evaluatePosition: (fen, depth, moveTime) => getEngine()?.evaluatePosition(fen, depth, moveTime),
    analyzePosition: (fen, depth, moveTime, options) =>
      getEngine()?.analyzePosition(fen, depth, moveTime, options) ?? Promise.resolve(null),
  };
};
