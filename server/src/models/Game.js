const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema(
  {
    whitePlayer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    blackPlayer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    result: {
      type: String,
      enum: ['1-0', '0-1', '1/2-1/2', '*'], // * is for ongoing/unfinished
      default: '*',
    },
    pgn: {
      type: String,
      default: '',
    },
    timeControl: {
      type: String, // e.g. '10|0'
      default: 'custom',
    },
    terminationReason: {
      type: String, // 'checkmate', 'resignation', 'timeout', 'draw'
    }
  },
  {
    timestamps: true,
  }
);

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;
