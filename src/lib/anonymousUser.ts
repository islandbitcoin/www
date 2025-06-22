/**
 * Anonymous user management for allowing gameplay without Nostr login
 */

import { secureStorage } from './secureStorage';

export interface AnonymousUser {
  id: string;
  createdAt: string;
  lastActive: string;
  totalEarned: number;
  gamesPlayed: number;
}

const ANONYMOUS_USER_KEY = 'anonymous-user';
const ANONYMOUS_PREFIX = 'anon_';

class AnonymousUserManager {
  private currentUser: AnonymousUser | null = null;

  constructor() {
    this.loadUser();
  }

  private loadUser() {
    const saved = secureStorage.get<AnonymousUser>(ANONYMOUS_USER_KEY);
    if (saved) {
      // Update last active time
      saved.lastActive = new Date().toISOString();
      this.currentUser = saved;
      this.saveUser();
    }
  }

  private saveUser() {
    if (this.currentUser) {
      secureStorage.set(ANONYMOUS_USER_KEY, this.currentUser);
    }
  }

  /**
   * Get or create an anonymous user
   */
  getOrCreateUser(): AnonymousUser {
    if (!this.currentUser) {
      this.currentUser = {
        id: `${ANONYMOUS_PREFIX}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        totalEarned: 0,
        gamesPlayed: 0
      };
      this.saveUser();
    }
    return this.currentUser;
  }

  /**
   * Check if a user ID is anonymous
   */
  isAnonymousUser(userId: string): boolean {
    return userId.startsWith(ANONYMOUS_PREFIX);
  }

  /**
   * Update anonymous user stats
   */
  updateStats(earned: number) {
    if (this.currentUser) {
      this.currentUser.totalEarned += earned;
      this.currentUser.gamesPlayed += 1;
      this.currentUser.lastActive = new Date().toISOString();
      this.saveUser();
    }
  }

  /**
   * Clear anonymous user data (for privacy)
   */
  clearUser() {
    this.currentUser = null;
    secureStorage.remove(ANONYMOUS_USER_KEY);
  }

  /**
   * Get display name for anonymous users
   */
  getDisplayName(userId: string): string {
    if (this.isAnonymousUser(userId)) {
      // Extract last 4 characters for a short identifier
      const shortId = userId.slice(-4);
      return `Guest ${shortId}`;
    }
    return userId;
  }
}

export const anonymousUserManager = new AnonymousUserManager();