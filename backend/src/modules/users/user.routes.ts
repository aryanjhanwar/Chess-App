import { Router } from 'express';
import { userController } from './user.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { updateProfileSchema } from './user.validator';

const router = Router();

/**
 * User Routes
 *
 * All routes here require authentication (authMiddleware).
 * Authorization (can only edit own profile) is enforced in the service layer.
 */

// GET /api/users/me — Get own profile
router.get('/me', authMiddleware, userController.getMyProfile.bind(userController));

// PATCH /api/users/profile — Update own profile
router.patch(
  '/profile',
  authMiddleware,
  validate(updateProfileSchema),
  userController.updateMyProfile.bind(userController),
);

export default router;
