import { UserProfile } from '../users/user.types';

/** Payload embedded inside JWT tokens */
export interface JwtPayload {
  sub: string;       // User's MongoDB _id
  username: string;
  email: string;
  rating: number;
  iat?: number;      // Issued at (set by jwt.sign)
  exp?: number;      // Expiry (set by jwt.sign)
}

/** DTO for POST /auth/register */
export interface RegisterDto {
  username: string;
  email: string;
  password: string;
}

/** DTO for POST /auth/login */
export interface LoginDto {
  email: string;
  password: string;
}

/** Shape of a successful auth response */
export interface AuthResponse {
  token: string;
  user: UserProfile;
}
