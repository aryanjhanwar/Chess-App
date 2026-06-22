import { EngineName } from "@analysis/types/enums";
import { UciEngine } from "./uciEngine";
import { isMultiThreadSupported, isWasmSupported } from "./shared";
import { sendCommandsToWorker } from "./worker";
import { toPublicPath } from "@analysis/lib/publicPath";
class Stockfish16 {
  static async create(nnue) {
    if (!Stockfish16.isSupported()) {
      throw new Error("Stockfish 16 is not supported");
    }
    const multiThreadIsSupported = isMultiThreadSupported();
    if (!multiThreadIsSupported) console.log("Single thread mode");
    const enginePath = multiThreadIsSupported
      ? toPublicPath("engines/stockfish-16/stockfish-nnue-16.js")
      : toPublicPath("engines/stockfish-16/stockfish-nnue-16-single.js");
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
export {
  Stockfish16
};
