import { isMultiThreadSupported, isWasmSupported } from './shared.js';

export class Stockfish16_1 {
  static getPath(lite = false) {
    const multiThread = isMultiThreadSupported();
    return `engines/stockfish-16.1/stockfish-16.1${lite ? '-lite' : ''}${multiThread ? '' : '-single'}.js`;
  }

  static getCandidates(lite = false) {
    const preferred = this.getPath(lite);
    const fallback = this.getPath(!lite);
    const singleLite = 'engines/stockfish-16.1/stockfish-16.1-lite-single.js';
    const singleFull = 'engines/stockfish-16.1/stockfish-16.1-single.js';
    const fullLite = 'engines/stockfish-16.1/stockfish-16.1-lite.js';
    const fullMain = 'engines/stockfish-16.1/stockfish-16.1.js';

    const ordered = [preferred, fallback, fullLite, fullMain, singleLite, singleFull];
    return [...new Set(ordered)];
  }

  static isSupported() {
    return isWasmSupported();
  }
}
