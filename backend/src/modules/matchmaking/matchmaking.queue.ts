import { QueueEntry, MatchResult } from './matchmaking.types';
import { generateRoomId } from '../../shared/utils/crypto.utils';
import logger from '../../shared/logger/logger';

/**
 * Matchmaking Queue — in-memory store for players waiting for a game.
 *
 * DESIGN INTENT:
 * This class is the ONLY place that directly accesses the queue Map.
 * Isolating this behind a class means future Redis migration only requires
 * changing the implementation here, not the matchmaking service.
 */
export class MatchmakingQueue {
  // Map<userId, QueueEntry> — userId is the key to prevent duplicates
  private readonly queue: Map<string, QueueEntry> = new Map();

  /**
   * Add a player to the queue.
   * Returns false if the player is already in the queue (duplicate prevention).
   */
  enqueue(entry: QueueEntry): boolean {
    if (this.queue.has(entry.userId)) {
      logger.warn({ userId: entry.userId }, 'Player tried to join queue twice');
      return false;
    }
    this.queue.set(entry.userId, entry);
    logger.info({ userId: entry.userId, queueSize: this.queue.size }, 'Player joined queue');
    return true;
  }

  /** Remove a player from the queue */
  dequeue(userId: string): void {
    const removed = this.queue.delete(userId);
    if (removed) {
      logger.info({ userId, queueSize: this.queue.size }, 'Player left queue');
    }
  }

  has(userId: string): boolean {
    return this.queue.has(userId);
  }

  size(): number {
    return this.queue.size;
  }

  /**
   * Attempt to match two players.
   * Returns a MatchResult if two players are available, otherwise null.
   *
   * Colors are assigned randomly to prevent bias.
   * The room ID is generated server-side using crypto.randomBytes.
   */
  tryMatch(): MatchResult | null {
    if (this.queue.size < 2) return null;

    const entries = Array.from(this.queue.values());
    const [player1, player2] = entries;

    // Remove both from queue
    this.queue.delete(player1.userId);
    this.queue.delete(player2.userId);

    // Randomly assign colors
    const [white, black] = Math.random() < 0.5 ? [player1, player2] : [player2, player1];

    const roomId = generateRoomId();

    logger.info(
      { roomId, whiteId: white.userId, blackId: black.userId },
      'Match found',
    );

    return { roomId, white, black };
  }
}

// Singleton
export const matchmakingQueue = new MatchmakingQueue();
