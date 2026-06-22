import { EngineName } from "@analysis/types/enums";
import { UciEngine } from "./uciEngine";
import { isMultiThreadSupported, isWasmSupported } from "./shared";
import { toPublicPath } from "@analysis/lib/publicPath";
class Stockfish17 {
  static async create(lite) {
    if (!Stockfish17.isSupported()) {
      throw new Error("Stockfish 17 is not supported");
    }
    const multiThreadIsSupported = isMultiThreadSupported();
    if (!multiThreadIsSupported) console.log("Single thread mode");
    const enginePath = toPublicPath(`engines/stockfish-17/stockfish-17${lite ? "-lite" : ""}${multiThreadIsSupported ? "" : "-single"}.js`);
    const engineName = lite ? EngineName.Stockfish17Lite : EngineName.Stockfish17;
    return UciEngine.create(engineName, enginePath);
  }
  static isSupported() {
    return isWasmSupported();
  }
}
export {
  Stockfish17
};
