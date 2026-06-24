import { Request, Response, NextFunction } from 'express';
import { userService } from './user.service';
import { sendSuccess } from '../../shared/utils/response.utils';
import { UpdateProfileInput } from './user.validator';

/**
 * User Controller — handles HTTP request/response concerns only.
 * Delegates all business logic to UserService.
 * Controllers never import repositories or mongoose models.
 */
export class UserController {
  async getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // req.user is populated by auth middleware — userId is from JWT, not client
      const profile = await userService.getMyProfile(req.user!._id);
      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  }

  async updateMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as UpdateProfileInput;
      // Authorization: userId always from JWT, never from request body
      const profile = await userService.updateMyProfile(req.user!._id, dto);
      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
