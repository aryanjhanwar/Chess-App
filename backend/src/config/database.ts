import mongoose from 'mongoose';
import { env } from './environment';
import logger from '../shared/logger/logger';

/**
 * Establishes the MongoDB connection.
 * Called once from server.ts at startup.
 * Uses Mongoose's built-in reconnection logic.
 */
export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10,   // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('MongoDB connected');

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
  } catch (err) {
    logger.fatal({ err }, 'MongoDB connection failed');
    process.exit(1);
  }
}
