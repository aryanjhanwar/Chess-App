import { Server, Socket } from 'socket.io';
import { matchmakingQueue } from './matchmaking.queue';
import { activeGameStore } from '../games/game.store';
import { GameState } from '../games/game.types';
import { QueueEntry, MatchResult } from './matchmaking.types';
import { SOCKET_EVENTS } from '../../sockets/events/socket.events';
import { Chess } from 'chess.js';
import logger from '../../shared/logger/logger';

/**
 * Matchmaking Service — orchestrates queue management and game creation.
 *
 * Responsibilities:
 * - Adding/removing players from the queue
 * - Attempting to match players
 * - Creating the initial GameState
 * - Notifying matched players via Socket.IO
 *
 * This service has NO HTTP concerns — only socket and in-memory operations.
 */
export class MatchmakingService {
  /**
   * Add an authenticated player to the matchmaking queue.
   * Prevents duplicate entries and triggers match attempt.
   */
  joinQueue(io: Server, socket: Socket): void {
    const user = socket.data.user as { _id: string; username: string; rating: number };

    // Prevent joining if already in an active game
    const activeGame = activeGameStore.findByUserId(user._id);
    if (activeGame) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'You are already in an active game' });
      return;
    }

    const entry: QueueEntry = {
      userId: user._id,
      username: user.username,
      rating: user.rating,
      socketId: socket.id,
      joinedAt: new Date(),
    };

    const added = matchmakingQueue.enqueue(entry);
    if (!added) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'You are already in the queue' });
      return;
    }

    socket.emit(SOCKET_EVENTS.QUEUE_JOINED, { queueSize: matchmakingQueue.size() });

    // Try to find a match immediately
    this.tryMatch(io);
  }

  /** Remove a player from the queue */
  leaveQueue(socket: Socket): void {
    const user = socket.data.user as { _id: string };
    matchmakingQueue.dequeue(user._id);
    socket.emit(SOCKET_EVENTS.QUEUE_LEFT);
  }

  /** Called on disconnect — cleans up queue entry if player disconnects while waiting */
  cleanupOnDisconnect(userId: string): void {
    matchmakingQueue.dequeue(userId);
  }

  /**
   * Attempt to create a match from the queue.
   * Called after every queue:join to immediately pair if possible.
   */
  private tryMatch(io: Server): void {
    const match = matchmakingQueue.tryMatch();
    if (!match) return;

    this.createGame(io, match);
  }

  /** Create a GameState and notify both players */
  private createGame(io: Server, match: MatchResult): void {
    const chess = new Chess();

    const gameState: GameState = {
      roomId: match.roomId,
      white: {
        userId: match.white.userId,
        username: match.white.username,
        rating: match.white.rating,
        socketId: match.white.socketId,
      },
      black: {
        userId: match.black.userId,
        username: match.black.username,
        rating: match.black.rating,
        socketId: match.black.socketId,
      },
      fen: chess.fen(),
      moves: [],
      status: 'active',
      turn: 'w',
      startedAt: new Date(),
      lastMoveAt: new Date(),
    };

    activeGameStore.create(gameState);

    // Join both sockets to the shared room
    io.sockets.sockets.get(match.white.socketId)?.join(match.roomId);
    io.sockets.sockets.get(match.black.socketId)?.join(match.roomId);

    // Notify white player
    io.to(match.white.socketId).emit(SOCKET_EVENTS.MATCH_FOUND, {
      roomId: match.roomId,
      color: 'white',
      opponent: { username: match.black.username, rating: match.black.rating },
      fen: gameState.fen,
    });

    // Notify black player
    io.to(match.black.socketId).emit(SOCKET_EVENTS.MATCH_FOUND, {
      roomId: match.roomId,
      color: 'black',
      opponent: { username: match.white.username, rating: match.white.rating },
      fen: gameState.fen,
    });

    logger.info({ roomId: match.roomId }, 'Game started, both players notified');
  }
}

export const matchmakingService = new MatchmakingService();
