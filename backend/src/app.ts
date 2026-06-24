import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import { env } from './config/environment';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import { errorMiddleware } from './middleware/error.middleware';


/**
 * Express application factory.
 * Returns a configured app WITHOUT starting the server.
 * Server startup (listen + socket.io) happens in server.ts.
 *
 * This separation makes testing easier — tests can import app without binding ports.
 */
export function createApp(): Application {
  const app = express();

  // ── Security Headers ────────────────────────────────────────────────────
  app.use(helmet());

  // ── CORS ────────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // ── Body Parsing (with size limit to prevent oversized payloads) ─────────
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // ── NoSQL Injection Prevention ───────────────────────────────────────────
  app.use(mongoSanitize());

  // ── Global Rate Limiter (100 req / 10 min per IP) ───────────────────────
  const globalLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests. Please try again later.',
    },
  });
  app.use('/api', globalLimiter);

  // ── Health Check (no auth, no rate limit) ───────────────────────────────
  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        env: env.NODE_ENV,
      },
    });
  });

  // ── API Routes ───────────────────────────────────────────────────────────
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);

  // ── 404 Handler ──────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });

  // ── Centralized Error Handler (must be last) ─────────────────────────────
  app.use(errorMiddleware);

  return app;
}
