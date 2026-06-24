import { EngineName } from "@/types/enums";
import { UciEngine } from "./uciEngine";
import { isWasmSupported } from "./shared";
export class Stockfish18 {
  static async create(lite) {
    if (!Stockfish18.isSupported()) {
      throw new Error("Stockfish 18 is not supported");
    }
    const enginePath = `engines/stockfish-18/stockfish-18${lite ? "-lite" : ""}-single${lite ? "" : "-6563532"}.js`;
    const engineName = lite ? EngineName.Stockfish18Lite : EngineName.Stockfish18;
    return UciEngine.create(engineName, enginePath);
  }
  static isSupported() {
    return isWasmSupported();
  }
}
