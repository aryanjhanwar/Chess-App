import { EngineName } from "@analysis/types/enums";
import { UciEngine } from "./uciEngine";
import { isMultiThreadSupported, isWasmSupported } from "./shared";
import { toPublicPath } from "@analysis/lib/publicPath";
class Stockfish16_1 {
  static async create(lite) {
    if (!Stockfish16_1.isSupported()) {
      throw new Error("Stockfish 16.1 is not supported");
    }
    const multiThreadIsSupported = isMultiThreadSupported();
    if (!multiThreadIsSupported) console.log("Single thread mode");
    const enginePath = toPublicPath(`engines/stockfish-16.1/stockfish-16.1${lite ? "-lite" : ""}${multiThreadIsSupported ? "" : "-single"}.js`);
    const engineName = lite ? EngineName.Stockfish16_1Lite : EngineName.Stockfish16_1;
    return UciEngine.create(engineName, enginePath);
  }
  static isSupported() {
    return isWasmSupported();
  }
}
export {
  Stockfish16_1
};
