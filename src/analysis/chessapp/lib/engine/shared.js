import { EngineName } from "@analysis/types/enums";
import { Stockfish11 } from "./stockfish11";
import { Stockfish16 } from "./stockfish16";
import { Stockfish16_1 } from "./stockfish16_1";
import { Stockfish17 } from "./stockfish17";
const isWasmSupported = () => typeof WebAssembly === "object" && WebAssembly.validate(
  Uint8Array.of(0, 97, 115, 109, 1, 0, 0, 0)
);
const isMultiThreadSupported = () => {
  try {
    return SharedArrayBuffer !== void 0 && !isIosDevice();
  } catch {
    return false;
  }
};
const isIosDevice = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);
const isMobileDevice = () => isIosDevice() || /Android|Opera Mini/i.test(navigator.userAgent);
const isEngineSupported = (name) => {
  switch (name) {
    case EngineName.Stockfish17:
    case EngineName.Stockfish17Lite:
      return Stockfish17.isSupported();
    case EngineName.Stockfish16_1:
    case EngineName.Stockfish16_1Lite:
      return Stockfish16_1.isSupported();
    case EngineName.Stockfish16:
    case EngineName.Stockfish16NNUE:
      return Stockfish16.isSupported();
    case EngineName.Stockfish11:
      return Stockfish11.isSupported();
  }
};
export {
  isEngineSupported,
  isIosDevice,
  isMobileDevice,
  isMultiThreadSupported,
  isWasmSupported
};
