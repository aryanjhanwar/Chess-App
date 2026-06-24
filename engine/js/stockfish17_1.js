import { EngineName } from "@/types/enums";
import { UciEngine } from "./uciEngine";
import { isWasmSupported } from "./shared";
export class Stockfish17_1 {
  static async create(lite) {
    if (!Stockfish17_1.isSupported()) {
      throw new Error("Stockfish 17_1 is not supported");
    }
    const enginePath = `engines/stockfish-17.1/stockfish-17.1${lite ? "-lite" : ""}-single.js`;
    const engineName = lite ? EngineName.Stockfish17_1Lite : EngineName.Stockfish17_1;
    return UciEngine.create(engineName, enginePath);
  }
  static isSupported() {
    return isWasmSupported();
  }
}
