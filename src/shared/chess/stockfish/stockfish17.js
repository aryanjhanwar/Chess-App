import { isMultiThreadSupported, isWasmSupported } from './shared.js';
import { UciEngine } from './uciEngine.js';

export class Stockfish17 {
  static async create(lite = false) {
    const engine = new UciEngine({ engineProfile: lite ? 'stockfish-17-lite' : 'stockfish-17' });
    await engine.init();
    return engine;
  }

  static getPath(lite = false) {
    const multiThread = isMultiThreadSupported();
    return `engines/stockfish-17/stockfish-17${lite ? '-lite' : ''}${multiThread ? '' : '-single'}.js`;
  }

  static getCandidates(lite = false) {
    const preferred = this.getPath(lite);
    const fallback = this.getPath(!lite);
    const singleLite = 'engines/stockfish-17/stockfish-17-lite-single.js';
    const singleFull = 'engines/stockfish-17/stockfish-17-single.js';
    const fullLite = 'engines/stockfish-17/stockfish-17-lite.js';
    const fullMain = 'engines/stockfish-17/stockfish-17.js';

    const ordered = [preferred, fallback, fullLite, fullMain, singleLite, singleFull];
    return [...new Set(ordered)];
  }

  static isSupported() {
    return isWasmSupported();
  }
}
