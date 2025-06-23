// Configuration sync service for cross-browser pull payment settings

import { cacheManager, CACHE_KEYS } from './cacheManager';

const SYNC_SERVER_URL = import.meta.env.VITE_SYNC_SERVER_URL || 'http://localhost:3001';
const API_KEY = import.meta.env.VITE_SYNC_API_KEY || '';
const CONFIG_CACHE_TTL = 60000; // 1 minute cache for config

export interface SyncConfig {
  pullPaymentId: string | null;
  btcPayServerUrl: string | null;
  btcPayStoreId: string | null;
  btcPayApiKey: string | null;
  
  // Payout Settings
  maxDailyPayout: number | null;
  maxPayoutPerUser: number | null;
  minWithdrawal: number | null;
  withdrawalFee: number | null;

  // Game Rewards
  gameRewards: {
    triviaEasy: number;
    triviaMedium: number;
    triviaHard: number;
    dailyChallenge: number;
    achievementBonus: number;
    referralBonus: number;
  } | null;

  // Rate Limits
  rateLimits: {
    triviaPerHour: number;
    withdrawalsPerDay: number;
    maxStreakBonus: number;
  } | null;

  // Admin Settings
  adminPubkeys: string[] | null;
  requireApprovalAbove: number | null;
  maintenanceMode: boolean | null;

  lastUpdated: string | null;
}

class ConfigSyncService {
  private isOnline = true;

  // Check if sync server is available
  async checkServerHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${SYNC_SERVER_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000) // 3 second timeout
      });
      this.isOnline = response.ok;
      return this.isOnline;
    } catch {
      this.isOnline = false;
      return false;
    }
  }

  // Get configuration from sync server with caching
  async getConfig(): Promise<SyncConfig | null> {
    // Check cache first
    const cached = cacheManager.get<SyncConfig>(CACHE_KEYS.CONFIG);
    if (cached) {
      return cached;
    }

    if (!this.isOnline) {
      return null;
    }

    try {
      const response = await fetch(`${SYNC_SERVER_URL}/api/config`, {
        method: 'GET',
        headers: {
          'X-API-Key': API_KEY
        },
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        // Cache the config
        cacheManager.set(CACHE_KEYS.CONFIG, result.data, CONFIG_CACHE_TTL);
      }
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Failed to get config from sync server:', error);
      this.isOnline = false;
      return null;
    }
  }

  // Save configuration to sync server
  async saveConfig(pullPaymentId: string, btcPayServerUrl: string): Promise<boolean> {
    if (!this.isOnline) {
      return false;
    }

    try {
      const response = await fetch(`${SYNC_SERVER_URL}/api/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        body: JSON.stringify({
          pullPaymentId,
          btcPayServerUrl
        }),
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        // Invalidate cache on successful save
        cacheManager.remove(CACHE_KEYS.CONFIG);
      }
      return result.success;
    } catch (error) {
      console.error('Failed to save config to sync server:', error);
      this.isOnline = false;
      return false;
    }
  }

  // Save full configuration to sync server
  async saveFullConfig(config: Partial<Omit<SyncConfig, 'lastUpdated'>>): Promise<boolean> {
    if (!this.isOnline) {
      return false;
    }

    try {
      const response = await fetch(`${SYNC_SERVER_URL}/api/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        body: JSON.stringify(config),
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        // Invalidate cache on successful save
        cacheManager.remove(CACHE_KEYS.CONFIG);
      }
      return result.success;
    } catch (error) {
      console.error('Failed to save full config to sync server:', error);
      this.isOnline = false;
      return false;
    }
  }

  // Remove configuration from sync server
  async removeConfig(): Promise<boolean> {
    if (!this.isOnline) {
      return false;
    }

    try {
      const response = await fetch(`${SYNC_SERVER_URL}/api/config`, {
        method: 'DELETE',
        headers: {
          'X-API-Key': API_KEY
        },
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        // Invalidate cache on successful save
        cacheManager.remove(CACHE_KEYS.CONFIG);
      }
      return result.success;
    } catch (error) {
      console.error('Failed to remove config from sync server:', error);
      this.isOnline = false;
      return false;
    }
  }

  // Check if server is available
  get serverOnline(): boolean {
    return this.isOnline;
  }
}

export const configSyncService = new ConfigSyncService();