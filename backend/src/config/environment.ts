import dotenv from 'dotenv';
import path from 'path';

// Load .env before anything else
const envPath = path.resolve(__dirname, '../../.env');

console.log('Loading ENV from:', envPath);

dotenv.config({ path: envPath });

console.log('Loaded MONGODB_URI:', process.env.MONGODB_URI);

/**
 * Environment configuration with validation.
 * The app will CRASH at startup if required variables are missing.
 * This "fail fast" approach prevents silent misconfigurations in production.
 */

interface Environment {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  FRONTEND_URL: string;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`[FATAL] Missing required environment variable: ${key}`);
  }
  return value;
}

function loadEnvironment(): Environment {
  return {
    NODE_ENV: (process.env.NODE_ENV as Environment['NODE_ENV']) || 'development',
    PORT: parseInt(process.env.PORT || '5001', 10),
    MONGODB_URI: requireEnv('MONGODB_URI'),
    JWT_SECRET: requireEnv('JWT_SECRET'),
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  };
}

// Validate on module load — crash immediately if misconfigured
export const env = loadEnvironment();
