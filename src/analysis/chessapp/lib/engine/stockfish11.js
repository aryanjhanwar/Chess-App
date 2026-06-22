import { EngineName } from "@analysis/types/enums";
import { UciEngine } from "./uciEngine";
import { toPublicPath } from "@analysis/lib/publicPath";
class Stockfish11 {
  static async create() {
    const enginePath = toPublicPath("engines/stockfish-11.js");
    return UciEngine.create(EngineName.Stockfish11, enginePath);
  }
  static isSupported() {
    return true;
  }
}
export {
  Stockfish11
};
