import { Server } from 'socket.io';
import { activeGameStore } from './game.store';
import { gameValidator } from './game.validator';
import { userRepository } from '../users/user.repository';
import {
  GameState,
  GameStatus,
  GameUpdatePayload,
  GameOverPayload,
  MoveRequest,
} from './game.types';
import { SOCKET_EVENTS } from '../../sockets/events/socket.events';
import { AppError } from '../../shared/errors/app.error';
import logger from '../../shared/logger/logger';

/** Standard ELO K-factor for rating calculations */
const ELO_K_FACTOR = 32;

/**
 * Game Service — manages all active game logic.
 *
 * Responsibilities:
 * - Processing and validating player moves
 * - Updating in-memory game state
 * - Detecting game-over conditions
 * - Persisting final results to MongoDB (one write per game)
 * - Broadcasting updated state to players
 *
 * NEVER accesses req/res. Pure socket + in-memory + DB logic.
 */
export class GameService {
  /**
   * Process a move request from an authenticated player.
   *
   * Validation order:
   * 1. Room exists
   * 2. Player is in this game
   * 3. It is this player's turn
   * 4. Move is legally valid (chess rules)
   */
  async processMove(io: Server, userId: string, moveRequest: MoveRequest): Promise<void> {
    const game = activeGameStore.get(moveRequest.roomId);

    // 1. Room must exist
    if (!game) {
      throw AppError.notFound('Game not found');
    }

    // 2. Player must be a participant
    const playerColor = this.getPlayerColor(game, userId);
    if (!playerColor) {
      throw AppError.forbidden('You are not a player in this game');
    }

    // 3. Must be this player's turn
    if (game.turn !== playerColor) {
      throw AppError.badRequest("It is not your turn");
    }

    // 4. Validate move via server-side chess engine
    const { newFen, san, isCheckmate, isDraw } = gameValidator.validateAndApplyMove(
      game.fen,
      moveRequest,
    );

    // Determine new game status
    let newStatus: GameStatus = 'active';
    if (isCheckmate) newStatus = 'checkmate';
    else if (isDraw) newStatus = 'draw';

    const newTurn = game.turn === 'w' ? 'b' : 'w';

    // Update in-memory state
    const updatedGame = activeGameStore.update(moveRequest.roomId, {
      fen: newFen,
      moves: [...game.moves, san],
      status: newStatus,
      turn: newTurn,
      lastMoveAt: new Date(),
    });

    if (!updatedGame) return;

    // Broadcast updated state to both players
    const updatePayload: GameUpdatePayload = {
      roomId: game.roomId,
      fen: newFen,
      moves: updatedGame.moves,
      turn: newTurn,
      status: newStatus,
      lastMove: { from: moveRequest.from, to: moveRequest.to, san },
    };

    io.to(game.roomId).emit(SOCKET_EVENTS.GAME_UPDATE, updatePayload);

    // Handle game over
    if (newStatus !== 'active') {
      await this.handleGameOver(io, updatedGame);
    }
  }

  /**
   * Handle game-over — calculate ratings, persist to DB, notify players.
   * This is the ONLY point where MongoDB is written to during a game.
   */
  async handleGameOver(io: Server, game: GameState): Promise<void> {
    const winner = this.determineWinner(game);

    const { whiteNewRating, blackNewRating, whiteDelta, blackDelta } =
      this.calculateEloRatings(game.white.rating, game.black.rating, winner);

    // Persist results to MongoDB — one write per player
    try {
      await Promise.all([
        userRepository.updateStats(game.white.userId, {
          result: winner === 'white' ? 'win' : winner === 'black' ? 'loss' : 'draw',
          newRating: whiteDelta,
        }),
        userRepository.updateStats(game.black.userId, {
          result: winner === 'black' ? 'win' : winner === 'white' ? 'loss' : 'draw',
          newRating: blackDelta,
        }),
      ]);
    } catch (err) {
      logger.error({ err, roomId: game.roomId }, 'Failed to persist game results to DB');
    }

    const payload: GameOverPayload = {
      roomId: game.roomId,
      status: game.status,
      winner,
      ratingChanges: {
        white: {
          userId: game.white.userId,
          ratingDelta: whiteDelta,
          newRating: whiteNewRating,
        },
        black: {
          userId: game.black.userId,
          ratingDelta: blackDelta,
          newRating: blackNewRating,
        },
      },
    };

    io.to(game.roomId).emit(SOCKET_EVENTS.GAME_OVER, payload);

    // Remove from active store
    activeGameStore.remove(game.roomId);

    logger.info({ roomId: game.roomId, winner, status: game.status }, 'Game over');
  }

  /**
   * Handle reconnect — find active game and send current state to rejoining player.
   */
  rejoinGame(socketId: string, userId: string, io: Server): void {
    const game = activeGameStore.findByUserId(userId);
    if (!game) return;

    // Update socket ID in game state for the reconnected player
    if (game.white.userId === userId) {
      activeGameStore.update(game.roomId, {
        white: { ...game.white, socketId },
      });
    } else {
      activeGameStore.update(game.roomId, {
        black: { ...game.black, socketId },
      });
    }

    // Rejoin the socket room
    io.sockets.sockets.get(socketId)?.join(game.roomId);

    // Send current game state
    io.to(socketId).emit(SOCKET_EVENTS.GAME_STATE, game);

    logger.info({ userId, roomId: game.roomId }, 'Player rejoined active game');
  }

  private getPlayerColor(game: GameState, userId: string): 'w' | 'b' | null {
    if (game.white.userId === userId) return 'w';
    if (game.black.userId === userId) return 'b';
    return null;
  }

  private determineWinner(game: GameState): 'white' | 'black' | 'draw' | null {
    if (game.status === 'checkmate') {
      // The player who just moved won (turn has already been flipped)
      return game.turn === 'w' ? 'black' : 'white';
    }
    if (game.status === 'draw' || game.status === 'stalemate') {
      return 'draw';
    }
    return null;
  }

  private calculateEloRatings(
    whiteRating: number,
    blackRating: number,
    winner: 'white' | 'black' | 'draw' | null,
  ): {
    whiteNewRating: number;
    blackNewRating: number;
    whiteDelta: number;
    blackDelta: number;
  } {
    const expectedWhite = 1 / (1 + Math.pow(10, (blackRating - whiteRating) / 400));
    const expectedBlack = 1 - expectedWhite;

    const whiteScore = winner === 'white' ? 1 : winner === 'black' ? 0 : 0.5;
    const blackScore = 1 - whiteScore;

    const whiteDelta = Math.round(ELO_K_FACTOR * (whiteScore - expectedWhite));
    const blackDelta = Math.round(ELO_K_FACTOR * (blackScore - expectedBlack));

    return {
      whiteDelta,
      blackDelta,
      whiteNewRating: Math.max(100, whiteRating + whiteDelta),
      blackNewRating: Math.max(100, blackRating + blackDelta),
    };
  }
}

export const gameService = new GameService();
