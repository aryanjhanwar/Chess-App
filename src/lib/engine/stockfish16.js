import { isMultiThreadSupported, isWasmSupported } from './shared.js';

export class Stockfish16 {
  static getPath() {
    const multiThread = isMultiThreadSupported();
    return multiThread
      ? 'engines/stockfish-16/stockfish-nnue-16.js'
      : 'engines/stockfish-16/stockfish-nnue-16-single.js';
  }

  static getCandidates() {
    const preferred = this.getPath();
    const fallback = preferred.includes('-single.js')
      ? 'engines/stockfish-16/stockfish-nnue-16.js'
      : 'engines/stockfish-16/stockfish-nnue-16-single.js';

    return [preferred, fallback];
  }

  static getInitCommands(useNnue = true) {
    return [
      `setoption name Use NNUE value ${useNnue ? 'true' : 'false'}`,
      'isready',
    ];
  }

  static isSupported() {
    return isWasmSupported();
  }
}
