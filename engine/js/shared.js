import { EngineName } from "@/types/enums";
import { Stockfish11 } from "./stockfish11";
import { Stockfish16 } from "./stockfish16";
import { Stockfish16_1 } from "./stockfish16_1";
import { Stockfish17 } from "./stockfish17";
import { Stockfish18 } from "./stockfish18";
import { Stockfish17_1 } from "./stockfish17_1";
export const isWasmSupported = () => typeof WebAssembly === "object" && WebAssembly.validate(
  Uint8Array.of(0, 97, 115, 109, 1, 0, 0, 0)
);
export const isIosDevice = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);
export const isMobileDevice = () => isIosDevice() || /Android|Opera Mini/i.test(navigator.userAgent);
export const isEngineSupported = (name) => {
  switch (name) {
    case EngineName.Stockfish18:
    case EngineName.Stockfish18Lite:
      return Stockfish18.isSupported();
    case EngineName.Stockfish17_1:
    case EngineName.Stockfish17_1Lite:
      return Stockfish17_1.isSupported();
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
