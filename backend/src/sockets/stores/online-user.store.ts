import logger from '../../shared/logger/logger';

/** Data stored per connected socket */
export interface OnlineUserEntry {
  userId: string;
  socketId: string;
  username: string;
  rating: number;
  connectedAt: Date;
}

/**
 * Online User Store — tracks all currently connected, authenticated users.
 *
 * DESIGN INTENT:
 * Abstracted behind a class so future Redis drop-in only requires
 * changing this class implementation.
 * Never query MongoDB to determine online status.
 */
export class OnlineUserStore {
  private readonly users: Map<string, OnlineUserEntry> = new Map();

  add(entry: OnlineUserEntry): void {
    this.users.set(entry.userId, entry);
    logger.info(
      { userId: entry.userId, total: this.users.size },
      'User came online',
    );
  }

  remove(userId: string): void {
    const removed = this.users.delete(userId);
    if (removed) {
      logger.info({ userId, total: this.users.size }, 'User went offline');
    }
  }

  get(userId: string): OnlineUserEntry | undefined {
    return this.users.get(userId);
  }

  has(userId: string): boolean {
    return this.users.has(userId);
  }

  getCount(): number {
    return this.users.size;
  }

  getAll(): OnlineUserEntry[] {
    return Array.from(this.users.values());
  }
}

// Singleton
export const onlineUserStore = new OnlineUserStore();
