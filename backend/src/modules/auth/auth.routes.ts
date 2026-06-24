import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validate.middleware';
import { registerSchema, loginSchema } from './auth.validator';
import rateLimit from 'express-rate-limit';

/**
 * Stricter rate limit for auth endpoints to prevent brute-force attacks.
 * 10 requests per 15 minutes per IP.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

/**
 * Auth Routes — all public (no authentication required)
 */

// POST /api/auth/register
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  authController.register.bind(authController),
);

// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  authController.login.bind(authController),
);

export default router;
