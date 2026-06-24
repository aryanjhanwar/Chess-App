import { Request } from 'express';

/**
 * Augments Express's Request interface so TypeScript knows about
 * req.user after the auth middleware attaches the authenticated user.
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        username: string;
        email: string;
        rating: number;
      };
    }
  }
}

export {};
