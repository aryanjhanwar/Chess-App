/**
 * User module type definitions.
 * DTO = Data Transfer Object (what crosses the API boundary)
 */

/** The public-facing user profile returned in API responses */
export interface UserProfile {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  createdAt: Date;
}

/** Fields allowed to be updated via PATCH /users/profile */
export interface UpdateProfileDto {
  username?: string;
  avatar?: string;
}

/** Internal user stats update (called on game over — not directly from client) */
export interface UpdateStatsDto {
  result: 'win' | 'loss' | 'draw';
  newRating: number;
}
