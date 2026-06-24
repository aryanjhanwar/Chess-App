import { z } from 'zod';

/**
 * Zod schema for PATCH /users/profile
 * Only username and avatar are allowed.
 * At least one field must be provided.
 */
export const updateProfileSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username cannot exceed 20 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
      .optional(),
    avatar: z
      .string()
      .url('Avatar must be a valid URL')
      .max(500, 'Avatar URL too long')
      .optional(),
  })
  .refine((data) => data.username !== undefined || data.avatar !== undefined, {
    message: 'At least one field (username or avatar) must be provided',
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
