export const isWasmSupported = () =>
  typeof WebAssembly === 'object' &&
  WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));

export const isIosDevice = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);

export const isMobileDevice = () =>
  isIosDevice() || /Android|Opera Mini/i.test(navigator.userAgent);

export const isMultiThreadSupported = () => {
  try {
    return typeof SharedArrayBuffer !== 'undefined' && !isIosDevice();
  } catch {
    return false;
  }
};

export const canUseWorkers = () => typeof Worker !== 'undefined';

export const isEngineSupported = (engineProfile) => {
  if (!canUseWorkers()) return false;

  switch (engineProfile) {
    case 'stockfish-11':
      return true;
    case 'stockfish-16':
    case 'stockfish-16-nnue':
    case 'stockfish-16_1':
    case 'stockfish-16_1-lite':
    case 'stockfish-17':
    case 'stockfish-17-lite':
    case 'auto':
    default:
      return isWasmSupported();
  }
};
