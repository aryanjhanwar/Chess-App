import { useEngine } from './useEngine.js';

export const useStockfish = (options = {}) => {
  const requestedEngineProfile = options?.engineProfile || 'auto';
  return useEngine(requestedEngineProfile);
};
