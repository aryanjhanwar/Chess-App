import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response.utils';
import { RegisterInput, LoginInput } from './auth.validator';

/**
 * Auth Controller — handles HTTP request/response for authentication.
 * Delegates all logic to AuthService.
 */
export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as RegisterInput;
      const result = await authService.register(dto);
      sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as LoginInput;
      const result = await authService.login(dto);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
