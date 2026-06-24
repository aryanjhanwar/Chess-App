import { Response } from 'express';
import { HttpStatusCode, HTTP_STATUS } from '../constants/http.constants';

/**
 * Standardized API response envelope.
 * All responses from controllers must use these helpers.
 *
 * Success shape:  { success: true, data: T }
 * Error shape:    { success: false, message: string, errors?: unknown }
 */

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: HttpStatusCode = HTTP_STATUS.OK,
): void {
  res.status(statusCode).json({
    success: true,
    data,
  });
}

export function sendCreated<T>(res: Response, data: T): void {
  sendSuccess(res, data, HTTP_STATUS.CREATED);
}

export function sendError(
  res: Response,
  message: string,
  statusCode: HttpStatusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  errors?: unknown,
): void {
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors !== undefined && { errors }),
  });
}
