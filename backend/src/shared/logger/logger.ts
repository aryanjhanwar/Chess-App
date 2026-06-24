import pino from 'pino';

/**
 * Centralized structured logger using Pino.
 * - In development: pretty-printed, human readable
 * - In production: JSON, machine readable (for log aggregation)
 *
 * NEVER log: passwords, JWT tokens, sensitive PII
 */
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:HH:MM:ss',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  redact: {
    // Automatically redact these fields from all log output
    paths: ['password', 'passwordHash', 'token', 'authorization', '*.token'],
    censor: '[REDACTED]',
  },
});

export default logger;
