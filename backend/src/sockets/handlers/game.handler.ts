import { Server, Socket } from 'socket.io';
import { gameService } from '../../modules/games/game.service';
import { activeGameStore } from '../../modules/games/game.store';
import { MoveRequest } from '../../modules/games/game.types';
import { SOCKET_EVENTS } from '../events/socket.events';
import { AppError } from '../../shared/errors/app.error';
import logger from '../../shared/logger/logger';

/**
 * Game Handler — registers socket event listeners for live gameplay.
 *
 * SECURITY:
 * - userId is ALWAYS from socket.data.user (verified JWT), never from client payload
 * - roomId from client payload is validated in gameService
 * - Move legality is validated in gameValidator before any state update
 */
export function registerGameHandlers(io: Server, socket: Socket): void {
  const userId = socket.data.user?._id as string;

  // On connect — automatically rejoin any active game (handles page refresh)
  gameService.rejoinGame(socket.id, userId, io);

  // game:move — player submits a move
  socket.on(SOCKET_EVENTS.GAME_MOVE, async (payload: unknown) => {
    try {
      // Validate payload shape before passing to service
      const moveRequest = parseMoveRequest(payload);
      await gameService.processMove(io, userId, moveRequest);
    } catch (err) {
      if (err instanceof AppError) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: err.message });
      } else {
        logger.error({ err, userId }, 'Unhandled game:move error');
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Move failed' });
      }
    }
  });

  // game:resign — player forfeits
  socket.on(SOCKET_EVENTS.GAME_RESIGN, async () => {
    try {
      const game = activeGameStore.findByUserId(userId);
      if (!game) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'No active game found' });
        return;
      }

      // Mark as abandoned and trigger game over
      const isWhite = game.white.userId === userId;
      activeGameStore.update(game.roomId, {
        status: 'resigned',
        // Flip turn so determineWinner correctly assigns the other player as winner
        turn: isWhite ? 'b' : 'w',
      });

      const updatedGame = activeGameStore.get(game.roomId);
      if (updatedGame) {
        await gameService.handleGameOver(io, { ...updatedGame, status: 'resigned' });
      }
    } catch (err) {
      logger.error({ err, userId }, 'game:resign error');
    }
  });
}

/** Type-safe extraction of MoveRequest from raw socket payload */
function parseMoveRequest(payload: unknown): MoveRequest {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    typeof (payload as Record<string, unknown>).roomId !== 'string' ||
    typeof (payload as Record<string, unknown>).from !== 'string' ||
    typeof (payload as Record<string, unknown>).to !== 'string'
  ) {
    throw AppError.badRequest('Invalid move payload');
  }

  const p = payload as Record<string, unknown>;
  const promotion = p.promotion;

  if (
    promotion !== undefined &&
    promotion !== 'q' &&
    promotion !== 'r' &&
    promotion !== 'b' &&
    promotion !== 'n'
  ) {
    throw AppError.badRequest('Invalid promotion piece');
  }

  return {
    roomId: p.roomId as string,
    from: p.from as string,
    to: p.to as string,
    promotion: promotion as MoveRequest['promotion'],
  };
}
