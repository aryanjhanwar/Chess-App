/**
 * Matchmaking module type definitions.
 */

/** A player waiting in the queue */
export interface QueueEntry {
  userId: string;
  username: string;
  rating: number;
  socketId: string;
  joinedAt: Date;
}

/** Result of a successful match */
export interface MatchResult {
  roomId: string;
  white: QueueEntry;
  black: QueueEntry;
}
