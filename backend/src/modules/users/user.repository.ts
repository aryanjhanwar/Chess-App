import { UserModel, IUser } from './user.model';
import { UpdateProfileDto, UpdateStatsDto } from './user.types';

/**
 * User Repository — all MongoDB operations for the user collection.
 * Services call this layer; services never import mongoose directly.
 * This abstraction makes future DB swaps straightforward.
 */
export class UserRepository {
  async findById(id: string): Promise<IUser | null> {
    return UserModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return UserModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findByUsername(username: string): Promise<IUser | null> {
    return UserModel.findOne({ username }).exec();
  }

  async create(data: {
    username: string;
    email: string;
    passwordHash: string;
  }): Promise<IUser> {
    const user = new UserModel(data);
    return user.save();
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<IUser | null> {
    return UserModel.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true, runValidators: true },
    ).exec();
  }

  /**
   * Called once when a game ends — updates rating, wins/losses/draws atomically.
   * Using $inc to avoid read-modify-write race conditions.
   */
  async updateStats(id: string, dto: UpdateStatsDto): Promise<IUser | null> {
    const incFields: Record<string, number> = {
      gamesPlayed: 1,
      rating: dto.newRating,
    };

    if (dto.result === 'win') incFields.wins = 1;
    else if (dto.result === 'loss') incFields.losses = 1;
    else incFields.draws = 1;

    return UserModel.findByIdAndUpdate(
      id,
      { $inc: incFields },
      { new: true },
    ).exec();
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await UserModel.countDocuments({ email: email.toLowerCase() });
    return count > 0;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const count = await UserModel.countDocuments({ username });
    return count > 0;
  }
}

// Singleton instance — exported for use in services
export const userRepository = new UserRepository();
