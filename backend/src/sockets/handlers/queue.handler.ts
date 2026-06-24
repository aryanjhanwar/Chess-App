import { Server, Socket } from 'socket.io';
import { matchmakingService } from '../../modules/matchmaking/matchmaking.service';
import { SOCKET_EVENTS } from '../events/socket.events';
import logger from '../../shared/logger/logger';

/**
 * Queue Handler — registers socket event listeners for matchmaking.
 *
 * Handlers are thin wrappers that delegate ALL logic to matchmakingService.
 * No queue logic lives here.
 */
export function registerQueueHandlers(io: Server, socket: Socket): void {
  // queue:join — player wants to find a game
  socket.on(SOCKET_EVENTS.QUEUE_JOIN, () => {
    try {
      matchmakingService.joinQueue(io, socket);
    } catch (err) {
      logger.error({ err, userId: socket.data.user?._id }, 'queue:join error');
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to join queue' });
    }
  });

  // queue:leave — player cancels matchmaking
  socket.on(SOCKET_EVENTS.QUEUE_LEAVE, () => {
    try {
      matchmakingService.leaveQueue(socket);
    } catch (err) {
      logger.error({ err, userId: socket.data.user?._id }, 'queue:leave error');
    }
  });
}
