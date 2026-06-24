import { isWasmSupported } from './shared.js';
import { UciEngine } from './uciEngine.js';

export class Stockfish17_1 {
  static async create(lite = false) {
    const engine = new UciEngine({ engineProfile: lite ? 'stockfish-17_1-lite' : 'stockfish-17_1' });
    await engine.init();
    return engine;
  }

  static getPath(lite = false) {
    return `engines/stockfish-17.1/stockfish-17.1${lite ? '-lite' : ''}-single.js`;
  }

  static getCandidates(lite = false) {
    const preferred = this.getPath(lite);
    const fallback = this.getPath(!lite);
    
    // SF17.1 directory only has single-threaded versions
    const singleLite = 'engines/stockfish-17.1/stockfish-17.1-lite-single.js';
    const singleFull = 'engines/stockfish-17.1/stockfish-17.1-single.js';

    const ordered = [preferred, fallback, singleLite, singleFull];
    return [...new Set(ordered)];
  }

  static isSupported() {
    return isWasmSupported();
  }
}
