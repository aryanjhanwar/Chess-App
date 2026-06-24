import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/app.error';
import { HTTP_STATUS } from '../shared/constants/http.constants';
import logger from '../shared/logger/logger';

/**
 * Centralized error handling middleware.
 * Must be the LAST middleware registered in app.ts (Express convention).
 *
 * Handles:
 * - AppError (operational errors from services) → structured response
 * - Mongoose validation errors → 422
 * - Unknown/unhandled errors → generic 500 (no internal details leaked)
 */
export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // Operational errors: known, expected, handled
  if (err instanceof AppError) {
    if (err.statusCode >= HTTP_STATUS.INTERNAL_SERVER_ERROR) {
      logger.error({ err }, 'Operational server error');
    } else {
      logger.warn({ message: err.message, statusCode: err.statusCode }, 'Client error');
    }

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Mongoose validation error
  if (isMongooseValidationError(err)) {
    const errors: Record<string, string> = {};
    for (const field in err.errors) {
      errors[field] = err.errors[field].message;
    }

    res.status(HTTP_STATUS.UNPROCESSABLE).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
    return;
  }

  // MongoDB duplicate key error (unique index violation)
  if (isMongooseDuplicateKeyError(err)) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
    res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: `${field} already exists`,
    });
    return;
  }

  // Unknown error — log full details internally, return generic message
  logger.error({ err }, 'Unhandled error');
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: 'An unexpected error occurred',
  });
}

function isMongooseValidationError(
  err: unknown,
): err is { name: string; errors: Record<string, { message: string }> } {
  return typeof err === 'object' && err !== null && (err as { name?: string }).name === 'ValidationError';
}

function isMongooseDuplicateKeyError(
  err: unknown,
): err is { code: number; keyValue?: Record<string, unknown> } {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}
