import { isWasmSupported } from './shared.js';
import { UciEngine } from './uciEngine.js';

export class Stockfish18 {
  static async create(lite = false) {
    const engine = new UciEngine({ engineProfile: lite ? 'stockfish-18-lite' : 'stockfish-18' });
    await engine.init();
    return engine;
  }

  static getPath(lite = false) {
    return `engines/stockfish-18/stockfish-18-${lite ? 'lite-single' : 'single-6563532'}.js`;
  }

  static getCandidates(lite = false) {
    const preferred = this.getPath(lite);
    const fallback = this.getPath(!lite);
    
    // SF18 directory only has single-threaded versions
    const singleLite = 'engines/stockfish-18/stockfish-18-lite-single.js';
    const singleFull = 'engines/stockfish-18/stockfish-18-single-6563532.js';

    const ordered = [preferred, fallback, singleLite, singleFull];
    return [...new Set(ordered)];
  }

  static isSupported() {
    return isWasmSupported();
  }
}
