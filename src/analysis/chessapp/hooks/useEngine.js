import { isWasmSupported } from "@/shared/chess/stockfish/shared";
import { Stockfish11 } from "@/shared/chess/stockfish/stockfish11";
import { Stockfish16 } from "@/shared/chess/stockfish/stockfish16";
import { Stockfish16_1 } from "@/shared/chess/stockfish/stockfish16_1";
import { Stockfish17 } from "@/shared/chess/stockfish/stockfish17";
import { Stockfish17_1 } from "@/shared/chess/stockfish/stockfish17_1";
import { Stockfish18 } from "@/shared/chess/stockfish/stockfish18";
import { EngineName } from "@analysis/types/enums";
import { useEffect, useState } from "react";
const useEngine = (engineName) => {
  const [engine, setEngine] = useState(null);
  useEffect(() => {
    if (!engineName) return;
    const resolvedEngineName = engineName !== EngineName.Stockfish11 && !isWasmSupported()
      ? EngineName.Stockfish11
      : engineName;

    pickEngine(resolvedEngineName).then((newEngine) => {
      setEngine((prev) => {
        prev?.shutdown();
        return newEngine;
      });
    });
  }, [engineName]);
  return engine;
};
const pickEngine = (engine) => {
  switch (engine) {
    case EngineName.Stockfish18:
      return Stockfish18.create(false);
    case EngineName.Stockfish18Lite:
      return Stockfish18.create(true);
    case EngineName.Stockfish17_1:
      return Stockfish17_1.create(false);
    case EngineName.Stockfish17_1Lite:
      return Stockfish17_1.create(true);
    case EngineName.Stockfish17:
      return Stockfish17.create(false);
    case EngineName.Stockfish17Lite:
      return Stockfish17.create(true);
    case EngineName.Stockfish16_1:
      return Stockfish16_1.create(false);
    case EngineName.Stockfish16_1Lite:
      return Stockfish16_1.create(true);
    case EngineName.Stockfish16:
      return Stockfish16.create(false);
    case EngineName.Stockfish16NNUE:
      return Stockfish16.create(true);
    case EngineName.Stockfish11:
      return Stockfish11.create();
  }
};
export {
  useEngine
};
