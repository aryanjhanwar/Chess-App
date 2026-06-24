import { EngineName } from "@/types/enums";
import { UciEngine } from "./uciEngine";
import { isWasmSupported } from "./shared";
import { sendCommandsToWorker } from "./worker";
export class Stockfish16 {
  static async create(nnue) {
    if (!Stockfish16.isSupported()) {
      throw new Error("Stockfish 16 is not supported");
    }
    const enginePath = "engines/stockfish-16/stockfish-nnue-16-single.js";
    const customEngineInit = async (worker) => {
      await sendCommandsToWorker(
        worker,
        [`setoption name Use NNUE value ${!!nnue}`, "isready"],
        "readyok"
      );
    };
    const engineName = nnue ? EngineName.Stockfish16NNUE : EngineName.Stockfish16;
    return UciEngine.create(engineName, enginePath, customEngineInit);
  }
  static isSupported() {
    return isWasmSupported();
  }
}
