import { Schema, model, Document } from 'mongoose';

/**
 * Mongoose document interface — extends Document so TypeScript
 * knows the _id and other Mongoose methods are available.
 */
export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    rating: {
      type: Number,
      default: 1200,
      min: 100,
      max: 3200,
    },
    gamesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      /**
       * SECURITY: Strip passwordHash from EVERY response.
       * This transform runs whenever .toJSON() is called on a user document,
       * which Express does automatically via res.json().
       */
      transform(_doc, ret: Record<string, unknown>) {
        delete ret['passwordHash'];
        delete ret['__v'];
        return ret;
      },
    },
  },
);

// Index for fast user lookup by email (used on every login)
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

export const UserModel = model<IUser>('User', userSchema);
