import { EngineName } from "@/types/enums";
import { UciEngine } from "./uciEngine";
import { isWasmSupported } from "./shared";
export class Stockfish16_1 {
  static async create(lite) {
    if (!Stockfish16_1.isSupported()) {
      throw new Error("Stockfish 16.1 is not supported");
    }
    const enginePath = `engines/stockfish-16.1/stockfish-16.1${lite ? "-lite" : ""}-single.js`;
    const engineName = lite ? EngineName.Stockfish16_1Lite : EngineName.Stockfish16_1;
    return UciEngine.create(engineName, enginePath);
  }
  static isSupported() {
    return isWasmSupported();
  }
}
