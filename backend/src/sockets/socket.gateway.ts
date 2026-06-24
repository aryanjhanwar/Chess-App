import { Server, Socket } from 'socket.io';
import { socketAuthMiddleware } from './middleware/socket.auth';
import { registerQueueHandlers } from './handlers/queue.handler';
import { registerGameHandlers } from './handlers/game.handler';
import { onlineUserStore } from './stores/online-user.store';
import { matchmakingService } from '../modules/matchmaking/matchmaking.service';
import { SOCKET_EVENTS } from './events/socket.events';
import logger from '../shared/logger/logger';

/**
 * Socket Gateway — the single point where Socket.IO is configured.
 *
 * Responsibilities:
 * - Attach auth middleware to all connections
 * - Register all event handlers per socket
 * - Manage online user presence
 * - Broadcast online counts
 */
export function initializeSocketGateway(io: Server): void {
  // Apply JWT auth to ALL socket connections before they are accepted
  io.use(socketAuthMiddleware);

  io.on(SOCKET_EVENTS.CONNECTION, (socket: Socket) => {
    const user = socket.data.user as {
      _id: string;
      username: string;
      rating: number;
    };

    // Track online presence
    onlineUserStore.add({
      userId: user._id,
      socketId: socket.id,
      username: user.username,
      rating: user.rating,
      connectedAt: new Date(),
    });

    // Broadcast updated online count to ALL connected clients
    io.emit(SOCKET_EVENTS.ONLINE_UPDATE, { count: onlineUserStore.getCount() });

    logger.info({ userId: user._id, socketId: socket.id }, 'Socket connected');

    // Register feature handlers
    registerQueueHandlers(io, socket);
    registerGameHandlers(io, socket);

    // Disconnect handler
    socket.on(SOCKET_EVENTS.DISCONNECT, (reason: string) => {
      logger.info({ userId: user._id, reason }, 'Socket disconnected');

      // Remove from online store
      onlineUserStore.remove(user._id);

      // Remove from matchmaking queue if waiting
      matchmakingService.cleanupOnDisconnect(user._id);

      // Broadcast updated online count
      io.emit(SOCKET_EVENTS.ONLINE_UPDATE, { count: onlineUserStore.getCount() });
    });
  });

  logger.info('Socket gateway initialized');
}
