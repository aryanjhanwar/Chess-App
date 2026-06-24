/**
 * Game module type definitions.
 *
 * All game state lives in memory during active gameplay.
 * MongoDB is only written to when a game finishes.
 */

export type Color = 'w' | 'b';
export type GameStatus = 'active' | 'checkmate' | 'stalemate' | 'draw' | 'abandoned' | 'resigned';

/** Minimal player information stored in-memory with a game */
export interface PlayerInfo {
  userId: string;
  username: string;
  rating: number;
  socketId: string; // Updated on reconnect
}

/** Complete in-memory game state */
export interface GameState {
  roomId: string;
  white: PlayerInfo;
  black: PlayerInfo;
  fen: string;         // Current board position (FEN notation)
  moves: string[];     // SAN move history
  status: GameStatus;
  turn: Color;
  startedAt: Date;
  lastMoveAt: Date;
}

/** What the server sends to clients after each move */
export interface GameUpdatePayload {
  roomId: string;
  fen: string;
  moves: string[];
  turn: Color;
  status: GameStatus;
  lastMove: {
    from: string;
    to: string;
    san: string;
  };
}

/** Client sends this when requesting a move */
export interface MoveRequest {
  roomId: string;
  from: string;       // e.g. "e2"
  to: string;         // e.g. "e4"
  promotion?: 'q' | 'r' | 'b' | 'n'; // only for pawn promotion
}

/** Server sends this when a game ends */
export interface GameOverPayload {
  roomId: string;
  status: GameStatus;
  winner: 'white' | 'black' | 'draw' | null;
  ratingChanges: {
    white: { userId: string; ratingDelta: number; newRating: number };
    black: { userId: string; ratingDelta: number; newRating: number };
  };
}
