/**
 * Game wallet configuration and management
 */

import { secureStorage } from "./secureStorage";
import { NWCClient } from "./nwc";
import { configSyncService, type SyncConfig } from "./configSync";

export interface GameWalletConfig {
  // NWC Connection
  nwcUri?: string;
  isConnected: boolean;
  walletBalance?: number;
  lastBalanceCheck?: string;

  // Payout Settings
  maxDailyPayout: number; // Total sats per day across all games
  maxPayoutPerUser: number; // Max sats per user per day
  minWithdrawal: number; // Minimum withdrawal amount
  withdrawalFee: number; // Lightning network fee buffer

  // Game Rewards (in sats)
  gameRewards: {
    triviaEasy: number;
    triviaMedium: number;
    triviaHard: number;
    dailyChallenge: number;
    achievementBonus: number;
    referralBonus: number;
  };

  // Anti-Abuse Settings
  rateLimits: {
    triviaPerHour: number;
    withdrawalsPerDay: number;
    maxStreakBonus: number;
  };

  // Admin Settings
  adminPubkeys: string[]; // Nostr pubkeys with admin access
  requireApprovalAbove: number; // Manual approval for large payouts
  maintenanceMode: boolean;
  
  // Pull Payment Settings (simplified BTCPay integration)
  pullPaymentId?: string; // BTCPay pull payment ID for withdrawals (legacy - for shared pull payment)
  btcPayServerUrl?: string; // Just the server URL for LNURL generation
  btcPayStoreId?: string; // BTCPay store ID for API access
  btcPayApiKey?: string; // BTCPay API key for creating pull payments
}

export interface UserBalance {
  pubkey: string;
  balance: number; // Current balance in sats
  pendingBalance: number; // Rewards earned but not yet withdrawable
  totalEarned: number;
  totalWithdrawn: number;
  lastActivity: string;
  lastWithdrawal?: string;
}

export interface GamePayout {
  id: string;
  userPubkey: string;
  amount: number;
  gameType: "trivia" | "stacker" | "achievement" | "referral" | "withdrawal";
  gameData?: Record<string, unknown>;
  timestamp: string;
  status: "pending" | "paid" | "failed";
  paymentProof?: string;
  error?: string;
  lightningAddress?: string; // For withdrawals
}

// Default configuration
const DEFAULT_CONFIG: GameWalletConfig = {
  isConnected: false,
  maxDailyPayout: 10000, // 10k sats per day total
  maxPayoutPerUser: 1000, // 1k sats per user per day
  minWithdrawal: 100, // 100 sats minimum
  withdrawalFee: 10, // 10 sats for network fees
  gameRewards: {
    triviaEasy: 5,
    triviaMedium: 10,
    triviaHard: 21,
    dailyChallenge: 50,
    achievementBonus: 25,
    referralBonus: 100,
  },
  rateLimits: {
    triviaPerHour: 10,
    withdrawalsPerDay: 3,
    maxStreakBonus: 500,
  },
  adminPubkeys: [], // No default admins - first user to access admin setup becomes admin
  requireApprovalAbove: 5000,
  maintenanceMode: false,
};

class GameWalletManager {
  private config: GameWalletConfig;
  private nwcClient: NWCClient | null = null;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): GameWalletConfig {
    const saved = secureStorage.get<GameWalletConfig>("gameWalletConfig");
    // Merge saved config with defaults, preserving existing admin configurations
    if (saved) {
      return { ...DEFAULT_CONFIG, ...saved };
    }
    return { ...DEFAULT_CONFIG };
  }

  async saveConfig(updates: Partial<GameWalletConfig>) {
    console.log('🔧 saveConfig called with updates:', updates);
    this.config = { ...this.config, ...updates };
    console.log('🔧 New config after merge:', this.config);
    secureStorage.set("gameWalletConfig", this.config);
    
    // Sync all config changes to server
    await this.syncConfigToServer(updates);
    
    // Also emit event for config updates
    window.dispatchEvent(new CustomEvent('gameWalletConfigUpdate', { 
      detail: { config: this.config } 
    }));
  }

  // Sync configuration to server
  private async syncConfigToServer(updates: Partial<GameWalletConfig>) {
    try {
      console.log('🔄 Starting full config sync to server...', updates);
      
      // Check if server is available
      const serverOnline = await configSyncService.checkServerHealth();
      if (!serverOnline) {
        console.warn('❌ Sync server offline, config will only be local');
        return;
      }

      // Prepare config for sync (only include fields that are actually being updated)
      const syncConfig: Partial<Omit<SyncConfig, 'lastUpdated'>> = {};
      
      // Only sync fields that are explicitly being updated
      if ('pullPaymentId' in updates) syncConfig.pullPaymentId = updates.pullPaymentId || null;
      if ('btcPayServerUrl' in updates) syncConfig.btcPayServerUrl = updates.btcPayServerUrl || null;
      if ('btcPayStoreId' in updates) syncConfig.btcPayStoreId = updates.btcPayStoreId || null;
      if ('btcPayApiKey' in updates) syncConfig.btcPayApiKey = updates.btcPayApiKey || null;
      if ('maxDailyPayout' in updates) syncConfig.maxDailyPayout = updates.maxDailyPayout;
      if ('maxPayoutPerUser' in updates) syncConfig.maxPayoutPerUser = updates.maxPayoutPerUser;
      if ('minWithdrawal' in updates) syncConfig.minWithdrawal = updates.minWithdrawal;
      if ('withdrawalFee' in updates) syncConfig.withdrawalFee = updates.withdrawalFee;
      if ('gameRewards' in updates) syncConfig.gameRewards = updates.gameRewards;
      if ('rateLimits' in updates) syncConfig.rateLimits = updates.rateLimits;
      if ('adminPubkeys' in updates) syncConfig.adminPubkeys = updates.adminPubkeys;
      if ('requireApprovalAbove' in updates) syncConfig.requireApprovalAbove = updates.requireApprovalAbove;
      if ('maintenanceMode' in updates) syncConfig.maintenanceMode = updates.maintenanceMode;

      // Only sync if we have fields to update
      if (Object.keys(syncConfig).length > 0) {
        console.log('📤 Saving config to server...', syncConfig);
        const success = await configSyncService.saveFullConfig(syncConfig);
        if (success) {
          console.log('✅ Config synced to server successfully');
        } else {
          console.error('❌ Failed to sync config to server');
        }
      }
    } catch (error) {
      console.error('❌ Failed to sync config:', error);
    }
  }

  // Sync pull payment configuration to server (legacy method for compatibility)
  private async syncPullPaymentConfig() {
    await this.syncConfigToServer({
      pullPaymentId: this.config.pullPaymentId,
      btcPayServerUrl: this.config.btcPayServerUrl
    });
  }

  // Load full config from sync server
  async loadConfigFromServer(): Promise<boolean> {
    try {
      console.log('📥 Checking server for config updates...');
      
      // Check if server is available
      const serverOnline = await configSyncService.checkServerHealth();
      if (!serverOnline) {
        console.log('❌ Server offline, using local config');
        return false;
      }

      const syncConfig = await configSyncService.getConfig();
      console.log('📡 Server response:', syncConfig);
      
      if (syncConfig) {
        console.log('📦 Updating local config with server data...');
        
        // Update local config with server data (only update non-null values)
        const updates: Partial<GameWalletConfig> = {};
        
        // Log what we're getting from the server
        console.log('📦 Server config fields:', {
          hasPullPaymentId: syncConfig.pullPaymentId !== null,
          hasBtcPayServerUrl: syncConfig.btcPayServerUrl !== null,
          hasBtcPayStoreId: syncConfig.btcPayStoreId !== null,
          hasBtcPayApiKey: syncConfig.btcPayApiKey !== null,
          btcPayStoreId: syncConfig.btcPayStoreId,
          btcPayApiKey: syncConfig.btcPayApiKey ? '[REDACTED]' : null
        });
        
        if (syncConfig.pullPaymentId !== null) updates.pullPaymentId = syncConfig.pullPaymentId;
        if (syncConfig.btcPayServerUrl !== null) updates.btcPayServerUrl = syncConfig.btcPayServerUrl;
        if (syncConfig.btcPayStoreId !== null) updates.btcPayStoreId = syncConfig.btcPayStoreId;
        if (syncConfig.btcPayApiKey !== null) updates.btcPayApiKey = syncConfig.btcPayApiKey;
        if (syncConfig.maxDailyPayout !== null) updates.maxDailyPayout = syncConfig.maxDailyPayout;
        if (syncConfig.maxPayoutPerUser !== null) updates.maxPayoutPerUser = syncConfig.maxPayoutPerUser;
        if (syncConfig.minWithdrawal !== null) updates.minWithdrawal = syncConfig.minWithdrawal;
        if (syncConfig.withdrawalFee !== null) updates.withdrawalFee = syncConfig.withdrawalFee;
        if (syncConfig.gameRewards !== null) updates.gameRewards = syncConfig.gameRewards;
        if (syncConfig.rateLimits !== null) updates.rateLimits = syncConfig.rateLimits;
        if (syncConfig.adminPubkeys !== null) updates.adminPubkeys = syncConfig.adminPubkeys;
        if (syncConfig.requireApprovalAbove !== null) updates.requireApprovalAbove = syncConfig.requireApprovalAbove;
        if (syncConfig.maintenanceMode !== null) updates.maintenanceMode = syncConfig.maintenanceMode;

        if (Object.keys(updates).length > 0) {
          this.config = { ...this.config, ...updates };
          
          // Save to local storage
          secureStorage.set("gameWalletConfig", this.config);
          
          // Emit update event
          window.dispatchEvent(new CustomEvent('gameWalletConfigUpdate', { 
            detail: { config: this.config } 
          }));
          
          console.log('✅ Config loaded from server and saved locally', updates);
          return true;
        }
      }
      
      console.log('🔍 No valid config updates found on server');
      return false;
    } catch (error) {
      console.error('❌ Failed to load config from server:', error);
      return false;
    }
  }

  // Load pull payment config from sync server (legacy method for compatibility)
  async loadPullPaymentFromServer(): Promise<boolean> {
    return this.loadConfigFromServer();
  }

  getConfig(): GameWalletConfig {
    return { ...this.config };
  }

  // User balance management
  getUserBalance(pubkey: string): UserBalance {
    const balances = secureStorage.get<Record<string, UserBalance>>("userBalances") || {};

    if (!balances[pubkey]) {
      balances[pubkey] = {
        pubkey,
        balance: 0,
        pendingBalance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        lastActivity: new Date().toISOString(),
      };
      secureStorage.set("userBalances", balances);
    }

    return balances[pubkey];
  }

  updateUserBalance(pubkey: string, updates: Partial<UserBalance>) {
    const balances = secureStorage.get<Record<string, UserBalance>>("userBalances") || {};
    balances[pubkey] = {
      ...this.getUserBalance(pubkey),
      ...updates,
      lastActivity: new Date().toISOString(),
    };
    secureStorage.set("userBalances", balances);
    
    // Emit a custom event when balance updates
    window.dispatchEvent(new CustomEvent('gameWalletBalanceUpdate', { 
      detail: { pubkey, balance: balances[pubkey] } 
    }));
  }

  // Payout tracking
  recordPayout(payout: Omit<GamePayout, "id" | "timestamp" | "status">): GamePayout {
    const payouts = secureStorage.get<GamePayout[]>("gamePayouts") || [];

    const newPayout: GamePayout = {
      ...payout,
      id: `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      status: "pending",
    };

    payouts.push(newPayout);
    secureStorage.set("gamePayouts", payouts);

    return newPayout;
  }

  getPayouts(filters?: { userPubkey?: string; status?: GamePayout["status"]; gameType?: GamePayout["gameType"]; since?: string }): GamePayout[] {
    let payouts = secureStorage.get<GamePayout[]>("gamePayouts") || [];

    if (filters?.userPubkey) {
      payouts = payouts.filter((p) => p.userPubkey === filters.userPubkey);
    }
    if (filters?.status) {
      payouts = payouts.filter((p) => p.status === filters.status);
    }
    if (filters?.gameType) {
      payouts = payouts.filter((p) => p.gameType === filters.gameType);
    }
    if (filters?.since) {
      payouts = payouts.filter((p) => p.timestamp >= filters.since!);
    }

    return payouts;
  }

  updatePayoutStatus(
    payoutId: string,
    status: GamePayout["status"],
    data?: {
      paymentProof?: string;
      error?: string;
      lightningAddress?: string;
    }
  ) {
    const payouts = secureStorage.get<GamePayout[]>("gamePayouts") || [];
    const index = payouts.findIndex((p) => p.id === payoutId);

    if (index >= 0) {
      payouts[index] = {
        ...payouts[index],
        status,
        ...data,
      };
      secureStorage.set("gamePayouts", payouts);
    }
  }

  // Daily limits
  getUserDailyTotal(pubkey: string): number {
    const today = new Date().toISOString().split("T")[0];
    const payouts = this.getPayouts({
      userPubkey: pubkey,
      since: today + "T00:00:00.000Z",
      status: "paid",
    });

    return payouts.reduce((sum, p) => sum + p.amount, 0);
  }

  getTotalDailyPayout(): number {
    const today = new Date().toISOString().split("T")[0];
    const payouts = this.getPayouts({
      since: today + "T00:00:00.000Z",
      status: "paid",
    });

    return payouts.reduce((sum, p) => sum + p.amount, 0);
  }

  canUserEarnMore(pubkey: string): { allowed: boolean; reason?: string } {
    if (this.config.maintenanceMode) {
      return { allowed: false, reason: "System is in maintenance mode" };
    }

    const userDaily = this.getUserDailyTotal(pubkey);
    if (userDaily >= this.config.maxPayoutPerUser) {
      return {
        allowed: false,
        reason: `Daily limit of ${this.config.maxPayoutPerUser} sats reached`,
      };
    }

    const totalDaily = this.getTotalDailyPayout();
    if (totalDaily >= this.config.maxDailyPayout) {
      return {
        allowed: false,
        reason: "Daily payout pool exhausted. Try again tomorrow!",
      };
    }

    return { allowed: true };
  }

  // Admin functions
  isAdmin(pubkey: string): boolean {
    return this.config.adminPubkeys.includes(pubkey);
  }

  addAdmin(pubkey: string) {
    if (!this.config.adminPubkeys.includes(pubkey)) {
      this.saveConfig({
        adminPubkeys: [...this.config.adminPubkeys, pubkey],
      });
    }
  }

  removeAdmin(pubkey: string) {
    this.saveConfig({
      adminPubkeys: this.config.adminPubkeys.filter((p) => p !== pubkey),
    });
  }

  // Clean up old simulated payouts
  cleanupSimulatedPayouts() {
    const payouts = secureStorage.get<GamePayout[]>("gamePayouts") || [];
    const cleanedPayouts = payouts.filter(
      (p) => !p.paymentProof?.startsWith("simulated_")
    );
    secureStorage.set("gamePayouts", cleanedPayouts);
    return payouts.length - cleanedPayouts.length;
  }

  // Reset a failed withdrawal and restore user balance (admin function)
  resetWithdrawal(payoutId: string): boolean {
    const payouts = secureStorage.get<GamePayout[]>("gamePayouts") || [];
    const payoutIndex = payouts.findIndex((p) => p.id === payoutId);
    
    if (payoutIndex === -1) {
      return false; // Payout not found
    }
    
    const payout = payouts[payoutIndex];
    
    // Only allow resetting withdrawal payouts
    if (payout.gameType !== 'withdrawal') {
      return false;
    }
    
    // Get current user balance
    const balance = this.getUserBalance(payout.userPubkey);
    
    // Restore the withdrawn amount to user's balance
    this.updateUserBalance(payout.userPubkey, {
      balance: balance.balance + payout.amount,
      totalWithdrawn: balance.totalWithdrawn - payout.amount,
      lastWithdrawal: balance.lastWithdrawal // Keep the same last withdrawal date
    });
    
    // Remove the payout record entirely
    payouts.splice(payoutIndex, 1);
    secureStorage.set("gamePayouts", payouts);
    
    // Emit balance update event
    window.dispatchEvent(new CustomEvent('gameWalletBalanceUpdate', { 
      detail: { pubkey: payout.userPubkey, balance: this.getUserBalance(payout.userPubkey) } 
    }));
    
    return true;
  }

  // Get failed withdrawals that can be reset (admin function)
  getResetableWithdrawals(): GamePayout[] {
    const payouts = secureStorage.get<GamePayout[]>("gamePayouts") || [];
    return payouts.filter(p => 
      p.gameType === 'withdrawal' && 
      (p.status === 'paid' || p.status === 'pending') &&
      p.paymentProof?.startsWith('pullpayment_')
    );
  }
}

// Singleton instance
export const gameWalletManager = new GameWalletManager();
