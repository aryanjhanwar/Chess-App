export class Stockfish11 {
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
