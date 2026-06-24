import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app';
import { connectDatabase } from './config/database';
import { initializeSocketGateway } from './sockets/socket.gateway';
import { env } from './config/environment';
import logger from './shared/logger/logger';

import dns from "dns";

dns.setServers([
  "8.8.8.8",
  "8.8.4.4"
]);

/**
 * Server entry point.
 *
 * Startup sequence:
 * 1. Connect to MongoDB (fail fast if unavailable)
 * 2. Create Express app
 * 3. Create HTTP server wrapping Express
 * 4. Attach Socket.IO to the HTTP server
 * 5. Initialize socket gateway (auth middleware + event handlers)
 * 6. Start listening
 */
async function bootstrap(): Promise<void> {
  // 1. Connect to database first — fail fast before starting HTTP server
  await connectDatabase();

  // 2. Create Express application
  const app = createApp();

  // 3. Create HTTP server
  const httpServer = http.createServer(app);

  // 4. Attach Socket.IO
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Disable polling fallback in production for cleaner connections
    transports: env.NODE_ENV === 'production' ? ['websocket'] : ['websocket', 'polling'],
  });

  // 5. Initialize socket gateway (registers all handlers)
  initializeSocketGateway(io);

  // 6. Start listening
  httpServer.listen(env.PORT, () => {
    logger.info(`Server started on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`Frontend URL: ${env.FRONTEND_URL}`);
  });

  // ── Graceful shutdown ──────────────────────────────────────────────────
  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received');
    httpServer.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // ── Unhandled rejection guard ──────────────────────────────────────────
  process.on('unhandledRejection', (reason: unknown) => {
    logger.fatal({ reason }, 'Unhandled promise rejection — shutting down');
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
