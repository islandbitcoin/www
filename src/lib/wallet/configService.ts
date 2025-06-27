/**
 * Configuration management service
 * Handles loading, saving, and syncing configuration data
 */

import { secureStorage } from "../secureStorage";
import { configSyncService, type SyncConfig } from "../configSync";
import { nostrConfigSyncService, type NostrSyncConfig } from "../nostrConfigSync";
import { GameWalletConfig, DEFAULT_CONFIG } from "./types";

export class ConfigService {
  private config: GameWalletConfig;

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
    this.config = { ...this.config, ...updates };
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
      // First try the sync server
      const serverOnline = await configSyncService.checkServerHealth();
      if (serverOnline) {
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
        if ('adminPubkeys' in updates) syncConfig.adminPubkeys = updates.adminPubkeys;
        if ('requireApprovalAbove' in updates) syncConfig.requireApprovalAbove = updates.requireApprovalAbove;
        if ('maintenanceMode' in updates) syncConfig.maintenanceMode = updates.maintenanceMode;

        // Only sync if we have fields to update
        if (Object.keys(syncConfig).length > 0) {
          const success = await configSyncService.saveFullConfig(syncConfig);
          if (success) {
            return;
          }
        }
      }

      // Fallback to Nostr sync if server is unavailable
      const nostrConfig: Partial<NostrSyncConfig> = {};
      
      // Map fields to Nostr config format
      if ('pullPaymentId' in updates) nostrConfig.pullPaymentId = updates.pullPaymentId || null;
      if ('btcPayServerUrl' in updates) nostrConfig.btcPayServerUrl = updates.btcPayServerUrl || null;
      if ('btcPayStoreId' in updates) nostrConfig.btcPayStoreId = updates.btcPayStoreId || null;
      if ('btcPayApiKey' in updates) nostrConfig.btcPayApiKey = updates.btcPayApiKey || null;
      if ('maxDailyPayout' in updates) nostrConfig.maxDailyPayout = updates.maxDailyPayout;
      if ('maxPayoutPerUser' in updates) nostrConfig.maxPayoutPerUser = updates.maxPayoutPerUser;
      if ('minWithdrawal' in updates) nostrConfig.minWithdrawal = updates.minWithdrawal;
      if ('withdrawalFee' in updates) nostrConfig.withdrawalFee = updates.withdrawalFee;
      if ('gameRewards' in updates) nostrConfig.gameRewards = updates.gameRewards;
      if ('adminPubkeys' in updates) nostrConfig.adminPubkeys = updates.adminPubkeys;
      if ('requireApprovalAbove' in updates) nostrConfig.requireApprovalAbove = updates.requireApprovalAbove;
      if ('maintenanceMode' in updates) nostrConfig.maintenanceMode = updates.maintenanceMode;

      await nostrConfigSyncService.saveConfig(nostrConfig);
    } catch (error) {
      // Failed to sync config
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
      let serverConfig: SyncConfig | NostrSyncConfig | null = null;
      
      // First try the sync server
      const serverOnline = await configSyncService.checkServerHealth();
      if (serverOnline) {
        serverConfig = await configSyncService.getConfig();
      }
      
      // If server config not available, try Nostr
      if (!serverConfig) {
        serverConfig = await nostrConfigSyncService.getConfig();
      }
      
      if (!serverConfig) {
        return false;
      }

      // Convert server config to GameWalletConfig format
      const mergedConfig: Partial<GameWalletConfig> = {};
      
      if (serverConfig.pullPaymentId) mergedConfig.pullPaymentId = serverConfig.pullPaymentId;
      if (serverConfig.btcPayServerUrl) mergedConfig.btcPayServerUrl = serverConfig.btcPayServerUrl;
      if (serverConfig.btcPayStoreId) mergedConfig.btcPayStoreId = serverConfig.btcPayStoreId;
      if (serverConfig.btcPayApiKey) mergedConfig.btcPayApiKey = serverConfig.btcPayApiKey;
      if (serverConfig.maxDailyPayout !== undefined && serverConfig.maxDailyPayout !== null) mergedConfig.maxDailyPayout = serverConfig.maxDailyPayout;
      if (serverConfig.maxPayoutPerUser !== undefined && serverConfig.maxPayoutPerUser !== null) mergedConfig.maxPayoutPerUser = serverConfig.maxPayoutPerUser;
      if (serverConfig.minWithdrawal !== undefined && serverConfig.minWithdrawal !== null) mergedConfig.minWithdrawal = serverConfig.minWithdrawal;
      if (serverConfig.withdrawalFee !== undefined && serverConfig.withdrawalFee !== null) mergedConfig.withdrawalFee = serverConfig.withdrawalFee;
      if (serverConfig.gameRewards) mergedConfig.gameRewards = serverConfig.gameRewards;
      if (serverConfig.adminPubkeys) {
        mergedConfig.adminPubkeys = serverConfig.adminPubkeys;
      }
      if (serverConfig.requireApprovalAbove !== undefined && serverConfig.requireApprovalAbove !== null) mergedConfig.requireApprovalAbove = serverConfig.requireApprovalAbove;
      if (serverConfig.maintenanceMode !== undefined && serverConfig.maintenanceMode !== null) mergedConfig.maintenanceMode = serverConfig.maintenanceMode;

      // Merge with current config and save locally
      this.config = { ...this.config, ...mergedConfig };
      secureStorage.set("gameWalletConfig", this.config);
      
      return true;
    } catch (error) {
      return false;
    }
  }

  // Load legacy pull payment from server (backward compatibility)
  async loadPullPaymentFromServer(): Promise<boolean> {
    // This method is now handled by loadConfigFromServer
    return this.loadConfigFromServer();
  }

  getConfig(): GameWalletConfig {
    return { ...this.config };
  }
}