/**
 * Secure local storage with encryption for user preferences
 */

interface StorageData {
  [key: string]: unknown;
}

class SecureStorage {
  private storageKey = 'island-bitcoin-secure';
  
  // Simple obfuscation for preferences (not cryptographically secure, but adds a layer)
  private obfuscate(data: string): string {
    return btoa(encodeURIComponent(data).split('').reverse().join(''));
  }
  
  private deobfuscate(data: string): string {
    try {
      return decodeURIComponent(atob(data).split('').reverse().join(''));
    } catch {
      return '';
    }
  }
  
  set(key: string, value: unknown): void {
    try {
      const storage = this.getAll();
      storage[key] = value;
      
      const encrypted = this.obfuscate(JSON.stringify(storage));
      localStorage.setItem(this.storageKey, encrypted);
    } catch (error) {
      console.error('Failed to save to secure storage:', error);
    }
  }
  
  get<T = unknown>(key: string, defaultValue?: T): T | undefined {
    try {
      const storage = this.getAll();
      return key in storage ? (storage[key] as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  }
  
  remove(key: string): void {
    try {
      const storage = this.getAll();
      delete storage[key];
      
      const encrypted = this.obfuscate(JSON.stringify(storage));
      localStorage.setItem(this.storageKey, encrypted);
    } catch (error) {
      console.error('Failed to remove from secure storage:', error);
    }
  }
  
  clear(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
    }
  }
  
  private getAll(): StorageData {
    try {
      const encrypted = localStorage.getItem(this.storageKey);
      if (!encrypted) return {};
      
      const decrypted = this.deobfuscate(encrypted);
      return JSON.parse(decrypted) || {};
    } catch {
      return {};
    }
  }
}

export const secureStorage = new SecureStorage();

// User preferences management
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  notificationsEnabled?: boolean;
  autoLoadImages?: boolean;
  preferredRelays?: string[];
  hiddenPosts?: string[];
  mutedUsers?: string[];
  favoriteUsers?: string[];
  language?: string;
  compactView?: boolean;
}

export function getUserPreferences(): UserPreferences {
  return secureStorage.get('userPreferences', {
    theme: 'light',
    notificationsEnabled: true,
    autoLoadImages: true,
    preferredRelays: [],
    hiddenPosts: [],
    mutedUsers: [],
    favoriteUsers: [],
    language: 'en',
    compactView: false,
  }) || {
    theme: 'light',
    notificationsEnabled: true,
    autoLoadImages: true,
    preferredRelays: [],
    hiddenPosts: [],
    mutedUsers: [],
    favoriteUsers: [],
    language: 'en',
    compactView: false,
  };
}

export function setUserPreferences(preferences: Partial<UserPreferences>): void {
  const current = getUserPreferences();
  secureStorage.set('userPreferences', { ...current, ...preferences });
}

// Privacy-focused analytics (local only, no external tracking)
export interface LocalAnalytics {
  postsViewed: number;
  postsCreated: number;
  daysActive: Set<string>;
  lastActive: string;
}

export function getLocalAnalytics(): LocalAnalytics {
  const stored = secureStorage.get('localAnalytics', {
    postsViewed: 0,
    postsCreated: 0,
    daysActive: [],
    lastActive: new Date().toISOString(),
  }) || {
    postsViewed: 0,
    postsCreated: 0,
    daysActive: [],
    lastActive: new Date().toISOString(),
  };
  
  return {
    postsViewed: stored.postsViewed || 0,
    postsCreated: stored.postsCreated || 0,
    lastActive: stored.lastActive || new Date().toISOString(),
    daysActive: new Set(stored.daysActive || []),
  };
}

export function updateLocalAnalytics(update: Partial<LocalAnalytics>): void {
  const current = getLocalAnalytics();
  const today = new Date().toISOString().split('T')[0];
  
  const updated = {
    ...current,
    ...update,
    daysActive: Array.from(new Set([...current.daysActive, today])),
    lastActive: new Date().toISOString(),
  };
  
  secureStorage.set('localAnalytics', {
    ...updated,
    daysActive: Array.from(updated.daysActive),
  });
}