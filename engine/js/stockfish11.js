import { EngineName } from "@/types/enums";
import { UciEngine } from "./uciEngine";
export class Stockfish11 {
  static async create() {
    const enginePath = "engines/stockfish-11.js";
    return UciEngine.create(EngineName.Stockfish11, enginePath);
  }
  static isSupported() {
    return true;
  }
}
