import { UciEngine } from './uciEngine.js';

export class Stockfish11 {
  static async create() {
    const engine = new UciEngine({ engineProfile: 'stockfish-11' });
    await engine.init();
    return engine;
  }

  static getPath() {
    return 'engines/stockfish-11.js';
  }

  static getCandidates() {
    return [this.getPath()];
  }

  static isSupported() {
    return true;
  }
}
