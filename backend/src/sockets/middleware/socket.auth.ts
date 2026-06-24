import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import { authService } from '../../modules/auth/auth.service';
import logger from '../../shared/logger/logger';

/**
 * Socket.IO authentication middleware.
 * Runs on EVERY new socket connection handshake.
 *
 * Expects JWT in: socket.handshake.auth.token
 *
 * On success: attaches verified user to socket.data.user
 * On failure: rejects the connection with an error
 *
 * SECURITY:
 * - User identity comes ONLY from the verified JWT
 * - Any userId passed in the handshake query/body is IGNORED
 */
export function socketAuthMiddleware(
  socket: Socket,
  next: (err?: ExtendedError) => void,
): void {
  try {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      logger.warn({ socketId: socket.id }, 'Socket connection rejected: no token');
      next(new Error('Authentication required'));
      return;
    }

    const payload = authService.verifyToken(token);

    // Attach verified user to socket context
    socket.data.user = {
      _id: payload.sub,
      username: payload.username,
      email: payload.email,
      rating: payload.rating,
    };

    next();
  } catch {
    logger.warn({ socketId: socket.id }, 'Socket connection rejected: invalid token');
    next(new Error('Invalid or expired token'));
  }
}
