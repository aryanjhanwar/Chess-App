import { AppError } from '../../shared/errors/app.error';
import { HTTP_STATUS } from '../../shared/constants/http.constants';
import { userRepository } from './user.repository';
import { IUser } from './user.model';
import { UpdateProfileDto, UserProfile } from './user.types';

/**
 * User Service — orchestrates business logic for user operations.
 * Calls repository for data access.
 * Never deals with HTTP req/res objects.
 */
export class UserService {
  /**
   * Returns the authenticated user's own profile.
   * The userId comes from the verified JWT — never from the client body.
   */
  async getMyProfile(userId: string): Promise<UserProfile> {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw AppError.notFound('User not found');
    }

    return this.toUserProfile(user);
  }

  /**
   * Updates the authenticated user's own profile.
   * Only allows updating username and avatar.
   * Rating, wins, losses, draws CANNOT be changed here — only by the game system.
   */
  async updateMyProfile(userId: string, dto: UpdateProfileDto): Promise<UserProfile> {
    // If a new username is requested, check it is not already taken
    if (dto.username) {
      const existingUser = await userRepository.findByUsername(dto.username);
      if (existingUser && existingUser._id.toString() !== userId) {
        throw new AppError('Username is already taken', HTTP_STATUS.CONFLICT);
      }
    }

    const updatedUser = await userRepository.updateProfile(userId, dto);

    if (!updatedUser) {
      throw AppError.notFound('User not found');
    }

    return this.toUserProfile(updatedUser);
  }

  /** Convert a Mongoose IUser document to a clean public profile DTO */
  toUserProfile(user: IUser): UserProfile {
    return {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      rating: user.rating,
      gamesPlayed: user.gamesPlayed,
      wins: user.wins,
      losses: user.losses,
      draws: user.draws,
      createdAt: user.createdAt,
    };
  }
}

export const userService = new UserService();
