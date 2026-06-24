import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../../shared/errors/app.error';
import { HTTP_STATUS } from '../../shared/constants/http.constants';
import { userRepository } from '../users/user.repository';
import { userService } from '../users/user.service';
import { env } from '../../config/environment';
import logger from '../../shared/logger/logger';
import { RegisterDto, LoginDto, AuthResponse, JwtPayload } from './auth.types';

const BCRYPT_SALT_ROUNDS = 12;

/**
 * Auth Service — handles registration, login, and token generation.
 * All password operations happen here and nowhere else.
 */
export class AuthService {
  async register(dto: RegisterDto): Promise<AuthResponse> {
    // Check uniqueness before hashing (cheaper fail-fast)
    const [emailExists, usernameExists] = await Promise.all([
      userRepository.existsByEmail(dto.email),
      userRepository.existsByUsername(dto.username),
    ]);

    if (emailExists) {
      throw new AppError('Email is already registered', HTTP_STATUS.CONFLICT);
    }
    if (usernameExists) {
      throw new AppError('Username is already taken', HTTP_STATUS.CONFLICT);
    }

    // Hash the password — NEVER store plain text
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const user = await userRepository.create({
      username: dto.username,
      email: dto.email.toLowerCase(),
      passwordHash,
    });

    logger.info({ userId: user._id, username: user.username }, 'New user registered');

    const token = this.signToken(user._id.toString(), user.username, user.email, user.rating);

    return {
      token,
      user: userService.toUserProfile(user),
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    // Must select passwordHash explicitly since it's not normally returned
    const user = await userRepository.findByEmail(dto.email);

    // Constant-time comparison — use bcrypt even if user not found to prevent timing attacks
    const dummyHash = '$2a$12$placeholder.hash.to.prevent.timing.attacks.xxxxxxx';
    const passwordToCompare = user ? user.passwordHash : dummyHash;
    const isPasswordValid = await bcrypt.compare(dto.password, passwordToCompare);

    if (!user || !isPasswordValid) {
      // Generic message — don't reveal whether email or password was wrong
      logger.warn({ email: dto.email }, 'Failed login attempt');
      throw new AppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
    }

    logger.info({ userId: user._id }, 'User logged in');

    const token = this.signToken(user._id.toString(), user.username, user.email, user.rating);

    return {
      token,
      user: userService.toUserProfile(user),
    };
  }

  /** Signs and returns a JWT with the user's essential data embedded */
  signToken(userId: string, username: string, email: string, rating: number): string {
    const payload: JwtPayload = { sub: userId, username, email, rating };
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
  }

  /** Verifies a JWT and returns its decoded payload */
  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch {
      throw AppError.unauthorized('Invalid or expired token');
    }
  }
}

export const authService = new AuthService();
