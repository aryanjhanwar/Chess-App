import { randomBytes } from 'crypto';

/**
 * Generates a cryptographically random room ID.
 * - 16 bytes = 32 hex characters
 * - Cannot be guessed by clients
 * - Only the server ever generates room IDs
 *
 * @returns A unique, URL-safe hex string (e.g. "a3f7c1d92e4b8f06")
 */
export function generateRoomId(): string {
  return randomBytes(16).toString('hex');
}
