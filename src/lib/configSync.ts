// Configuration sync service for cross-browser pull payment settings

const SYNC_SERVER_URL = 'http://localhost:3001';

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
      console.warn('Sync server offline, using local storage only');
      this.isOnline = false;
      return false;
    }
  }

  // Get configuration from sync server
  async getConfig(): Promise<SyncConfig | null> {
    if (!this.isOnline) {
      return null;
    }

    try {
      const response = await fetch(`${SYNC_SERVER_URL}/api/config`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
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
          'Content-Type': 'application/json'
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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config),
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
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
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
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