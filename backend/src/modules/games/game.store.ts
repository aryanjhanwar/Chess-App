import { GameState } from './game.types';
import logger from '../../shared/logger/logger';

/**
 * Active Game Store — in-memory Map for all active games.
 *
 * DESIGN INTENT:
 * This class is the ONLY place that directly accesses the game Map.
 * All game reads/writes go through this interface.
 * This abstraction allows future migration to Redis without changing game logic.
 *
 * MongoDB is NOT involved during active gameplay.
 * Games are persisted to MongoDB only when they finish.
 */
export class ActiveGameStore {
  private readonly games: Map<string, GameState> = new Map();

  create(state: GameState): void {
    if (this.games.has(state.roomId)) {
      logger.warn({ roomId: state.roomId }, 'Attempted to create duplicate game room');
      return;
    }
    this.games.set(state.roomId, state);
    logger.info({ roomId: state.roomId }, 'Game created in store');
  }

  get(roomId: string): GameState | undefined {
    return this.games.get(roomId);
  }

  update(roomId: string, partial: Partial<GameState>): GameState | undefined {
    const existing = this.games.get(roomId);
    if (!existing) return undefined;
    const updated = { ...existing, ...partial };
    this.games.set(roomId, updated);
    return updated;
  }

  remove(roomId: string): void {
    this.games.delete(roomId);
    logger.info({ roomId }, 'Game removed from store');
  }

  /** Find any active game that a given user is participating in */
  findByUserId(userId: string): GameState | undefined {
    for (const game of this.games.values()) {
      if (game.white.userId === userId || game.black.userId === userId) {
        return game;
      }
    }
    return undefined;
  }

  has(roomId: string): boolean {
    return this.games.has(roomId);
  }

  size(): number {
    return this.games.size;
  }
}

// Singleton — one shared in-memory store for the process lifetime
export const activeGameStore = new ActiveGameStore();
