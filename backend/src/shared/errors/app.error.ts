import { HTTP_STATUS, HttpStatusCode } from '../constants/http.constants';

/**
 * Custom application error class.
 * All thrown errors in services/controllers should use this class.
 * The centralized error middleware handles converting these to HTTP responses.
 */
export class AppError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: HttpStatusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguishes expected errors from bugs

    // Maintains proper stack trace in V8
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * Factory methods for common error types — keeps throw sites clean.
   */
  static badRequest(message: string): AppError {
    return new AppError(message, HTTP_STATUS.BAD_REQUEST);
  }

  static unauthorized(message: string = 'Authentication required'): AppError {
    return new AppError(message, HTTP_STATUS.UNAUTHORIZED);
  }

  static forbidden(message: string = 'Access denied'): AppError {
    return new AppError(message, HTTP_STATUS.FORBIDDEN);
  }

  static notFound(message: string): AppError {
    return new AppError(message, HTTP_STATUS.NOT_FOUND);
  }

  static conflict(message: string): AppError {
    return new AppError(message, HTTP_STATUS.CONFLICT);
  }

  static internal(message: string = 'Internal server error'): AppError {
    return new AppError(message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}
