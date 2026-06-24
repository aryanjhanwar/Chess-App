import { Request, Response, NextFunction } from 'express';
import { authService } from '../modules/auth/auth.service';
import { AppError } from '../shared/errors/app.error';

/**
 * Express authentication middleware.
 * Validates JWT from Authorization header and attaches user to req.user.
 *
 * Expects: Authorization: Bearer <token>
 *
 * On success: req.user is populated with { _id, username, email, rating }
 * On failure: 401 Unauthorized is returned
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('No authentication token provided');
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix
    const payload = authService.verifyToken(token);

    // Attach clean user object — never the raw JWT payload
    req.user = {
      _id: payload.sub,
      username: payload.username,
      email: payload.email,
      rating: payload.rating,
    };

    next();
  } catch (error) {
    next(error);
  }
}
