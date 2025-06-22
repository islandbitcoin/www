/**
 * Client-side cache manager for game data
 * Uses localStorage with TTL for caching
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private readonly CACHE_PREFIX = 'island-bitcoin-cache:';
  private readonly DEFAULT_TTL = 300000; // 5 minutes in ms

  /**
   * Get item from cache
   */
  get<T>(key: string): T | null {
    try {
      const fullKey = this.CACHE_PREFIX + key;
      const cached = localStorage.getItem(fullKey);
      
      if (!cached) return null;
      
      const item: CacheItem<T> = JSON.parse(cached);
      
      // Check if cache has expired
      if (Date.now() > item.timestamp + item.ttl) {
        this.remove(key);
        return null;
      }
      
      return item.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set item in cache with optional TTL
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): boolean {
    try {
      const fullKey = this.CACHE_PREFIX + key;
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl
      };
      
      localStorage.setItem(fullKey, JSON.stringify(item));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      // Handle quota exceeded error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.cleanup();
        // Try again
        try {
          const fullKey = this.CACHE_PREFIX + key;
          localStorage.setItem(fullKey, JSON.stringify({ data, timestamp: Date.now(), ttl }));
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  }

  /**
   * Remove item from cache
   */
  remove(key: string): void {
    try {
      const fullKey = this.CACHE_PREFIX + key;
      localStorage.removeItem(fullKey);
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Clean up expired cache entries
   */
  cleanup(): void {
    try {
      const keys = Object.keys(localStorage);
      let removed = 0;
      
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const item = JSON.parse(cached);
              if (Date.now() > item.timestamp + item.ttl) {
                localStorage.removeItem(key);
                removed++;
              }
            }
          } catch {
            // Remove invalid entries
            localStorage.removeItem(key);
            removed++;
          }
        }
      });
      
      if (removed > 0) {
        // Cache entries cleaned up successfully
      }
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { count: number; size: number; expired: number } {
    let count = 0;
    let size = 0;
    let expired = 0;
    
    try {
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          count++;
          const value = localStorage.getItem(key);
          if (value) {
            size += key.length + value.length;
            
            try {
              const item = JSON.parse(value);
              if (Date.now() > item.timestamp + item.ttl) {
                expired++;
              }
            } catch {
              expired++;
            }
          }
        }
      });
    } catch (error) {
      console.error('Cache stats error:', error);
    }
    
    return { count, size, expired };
  }
}

// Create singleton instance
export const cacheManager = new CacheManager();

// Run cleanup on initialization
if (typeof window !== 'undefined') {
  // Initial cleanup
  cacheManager.cleanup();
  
  // Schedule periodic cleanup every 5 minutes
  setInterval(() => {
    cacheManager.cleanup();
  }, 300000);
}

/**
 * Cache keys for different data types
 */
export const CACHE_KEYS = {
  CONFIG: 'config',
  USER_BALANCE: (pubkey: string) => `balance:${pubkey}`,
  GAME_PAYOUTS: (pubkey: string) => `payouts:${pubkey}`,
  LEADERBOARD_DAILY: 'leaderboard:daily',
  LEADERBOARD_WEEKLY: 'leaderboard:weekly',
  LEADERBOARD_ALLTIME: 'leaderboard:alltime',
  REFERRAL_STATS: (pubkey: string) => `referral:${pubkey}`,
  REFERRAL_LEADERBOARD: 'referral:leaderboard',
  TRIVIA_QUESTIONS: 'trivia:questions',
  USER_METADATA: (pubkey: string) => `metadata:${pubkey}`
};