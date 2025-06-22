/**
 * Unified Game Wallet Manager
 * Combines all wallet services into a single interface
 */

import { ConfigService } from "./configService";
import { BalanceService } from "./balanceService";
import { PayoutService } from "./payoutService";
import { AdminService } from "./adminService";
import { GameWalletConfig, UserBalance, GamePayout, PayoutRequest } from "./types";

export * from "./types";

class GameWalletManager {
  private configService: ConfigService;
  private balanceService: BalanceService;
  private payoutService: PayoutService;
  private adminService: AdminService;

  constructor() {
    this.configService = new ConfigService();
    this.balanceService = new BalanceService();
    this.payoutService = new PayoutService();
    
    // Initialize admin service with config update callback
    this.adminService = new AdminService(
      this.configService.getConfig().adminPubkeys,
      (updates) => this.configService.saveConfig(updates)
    );
  }

  // Configuration methods
  getConfig(): GameWalletConfig {
    return this.configService.getConfig();
  }

  async saveConfig(updates: Partial<GameWalletConfig>) {
    await this.configService.saveConfig(updates);
    
    // Update admin service if admin pubkeys changed
    if (updates.adminPubkeys) {
      this.adminService.updateAdmins(updates.adminPubkeys);
    }
  }

  async loadConfigFromServer(): Promise<boolean> {
    const success = await this.configService.loadConfigFromServer();
    if (success) {
      // Update admin service with new config
      this.adminService.updateAdmins(this.configService.getConfig().adminPubkeys);
    }
    return success;
  }

  async loadPullPaymentFromServer(): Promise<boolean> {
    return this.configService.loadPullPaymentFromServer();
  }

  // Balance methods
  getUserBalance(pubkey: string): UserBalance {
    return this.balanceService.getUserBalance(pubkey);
  }

  updateUserBalance(pubkey: string, updates: Partial<UserBalance>) {
    this.balanceService.updateUserBalance(pubkey, updates);
  }

  getUserDailyTotal(pubkey: string): number {
    return this.balanceService.getUserDailyTotal(pubkey);
  }

  getTotalDailyPayout(): number {
    return this.balanceService.getTotalDailyPayout();
  }

  canUserEarnMore(pubkey: string): { allowed: boolean; reason?: string } {
    const config = this.configService.getConfig();
    return this.balanceService.canUserEarnMore(
      pubkey, 
      config.maxPayoutPerUser, 
      config.maxDailyPayout
    );
  }

  // Payout methods
  recordPayout(payout: PayoutRequest): GamePayout {
    return this.payoutService.recordPayout(payout);
  }

  getPayouts(filters?: { 
    userPubkey?: string; 
    status?: GamePayout["status"]; 
    gameType?: GamePayout["gameType"]; 
    since?: string 
  }): GamePayout[] {
    return this.payoutService.getPayouts(filters);
  }

  updatePayoutStatus(
    payoutId: string,
    status: GamePayout["status"],
    pullPaymentId?: string
  ) {
    this.payoutService.updatePayoutStatus(payoutId, status, pullPaymentId);
  }

  cleanupOldPayouts(daysToKeep: number = 30): number {
    this.payoutService.cleanupOldPayouts(daysToKeep);
    return 0; // For backward compatibility
  }

  resetWithdrawal(payoutId: string): boolean {
    return this.payoutService.resetWithdrawal(payoutId);
  }

  getResetableWithdrawals(): GamePayout[] {
    return this.payoutService.getResetableWithdrawals();
  }

  // Admin methods
  isAdmin(pubkey: string): boolean {
    return this.adminService.isAdmin(pubkey);
  }

  addAdmin(pubkey: string) {
    this.adminService.addAdmin(pubkey);
  }

  removeAdmin(pubkey: string) {
    this.adminService.removeAdmin(pubkey);
  }
}

// Export singleton instance
export const gameWalletManager = new GameWalletManager();