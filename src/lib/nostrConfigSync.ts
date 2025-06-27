/**
 * Nostr-based configuration synchronization
 * Uses Nostr network to sync configuration across browsers
 */

import { NostrEvent } from '@nostrify/nostrify';

const CONFIG_KIND = 30078; // Application-specific data (NIP-78)
const CONFIG_D_TAG = 'island-bitcoin-config-v1';

export interface NostrSyncConfig {
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


  // Admin Settings
  adminPubkeys: string[] | null;
  requireApprovalAbove: number | null;
  maintenanceMode: boolean | null;

  lastUpdated: string | null;
}

class NostrConfigSyncService {
  private nostr: any = null;
  private publishEvent: any = null;

  // Initialize with Nostr instance
  init(nostr: any, publishEvent: any) {
    this.nostr = nostr;
    this.publishEvent = publishEvent;
  }

  // Get configuration from Nostr
  async getConfig(): Promise<NostrSyncConfig | null> {
    if (!this.nostr) {
      console.warn('[NostrConfigSync] Service not initialized');
      return null;
    }

    try {
      const events = await this.nostr.query([{
        kinds: [CONFIG_KIND],
        '#d': [CONFIG_D_TAG],
        limit: 10, // Get multiple events to find the latest
      }], { signal: AbortSignal.timeout(5000) });

      if (events.length === 0) {
        return null;
      }

      // Sort by created_at to get the latest
      const sortedEvents = events.sort((a: NostrEvent, b: NostrEvent) => b.created_at - a.created_at);
      const latestEvent = sortedEvents[0];

      const content = JSON.parse(latestEvent.content) as NostrSyncConfig;
      return content;
    } catch (error) {
      console.error('[NostrConfigSync] Failed to fetch config:', error);
      return null;
    }
  }

  // Save configuration to Nostr
  async saveConfig(config: Partial<NostrSyncConfig>): Promise<boolean> {
    if (!this.publishEvent) {
      console.warn('[NostrConfigSync] Service not initialized');
      return false;
    }

    try {
      const fullConfig: NostrSyncConfig = {
        pullPaymentId: null,
        btcPayServerUrl: null,
        btcPayStoreId: null,
        btcPayApiKey: null,
        maxDailyPayout: null,
        maxPayoutPerUser: null,
        minWithdrawal: null,
        withdrawalFee: null,
        gameRewards: null,
        adminPubkeys: null,
        requireApprovalAbove: null,
        maintenanceMode: null,
        lastUpdated: new Date().toISOString(),
        ...config,
      };

      const content = JSON.stringify(fullConfig);

      await this.publishEvent({
        kind: CONFIG_KIND,
        content,
        tags: [
          ['d', CONFIG_D_TAG],
          ['client', 'island-bitcoin'],
        ],
      });

      return true;
    } catch (error) {
      console.error('[NostrConfigSync] Failed to save config:', error);
      return false;
    }
  }

  // Check if service is available
  async checkServerHealth(): Promise<boolean> {
    return this.nostr !== null;
  }

  // Check if server is available
  get serverOnline(): boolean {
    return this.nostr !== null;
  }
}

export const nostrConfigSyncService = new NostrConfigSyncService();