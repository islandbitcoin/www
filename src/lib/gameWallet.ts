/**
 * Game wallet configuration and management (DEPRECATED)
 * 
 * This file is deprecated. Use the new modular wallet services instead:
 * - import { gameWalletManager } from "@/lib/wallet"
 * 
 * This file is kept for backward compatibility and will be removed in a future version.
 */

import { gameWalletManager as newGameWalletManager } from "./wallet";
import type { GameWalletConfig, UserBalance, PayoutFilters, PayoutStatus, PayoutRequest } from "./wallet/types";

// Re-export types from the new wallet module for backward compatibility
export type { GameWalletConfig, UserBalance, GamePayout } from "./wallet";

// DEPRECATED: This class is kept for backward compatibility only.
// All methods now delegate to the new modular wallet services.
class DeprecatedGameWalletManager {
  // Delegate all methods to the new gameWalletManager
  getConfig() { return newGameWalletManager.getConfig(); }
  async saveConfig(updates: Partial<GameWalletConfig>) { return newGameWalletManager.saveConfig(updates); }
  async loadConfigFromServer() { return newGameWalletManager.loadConfigFromServer(); }
  async loadPullPaymentFromServer() { return newGameWalletManager.loadPullPaymentFromServer(); }
  getUserBalance(pubkey: string) { return newGameWalletManager.getUserBalance(pubkey); }
  updateUserBalance(pubkey: string, updates: Partial<UserBalance>) { return newGameWalletManager.updateUserBalance(pubkey, updates); }
  recordPayout(payout: PayoutRequest) { return newGameWalletManager.recordPayout(payout); }
  getPayouts(filters?: PayoutFilters) { return newGameWalletManager.getPayouts(filters); }
  updatePayoutStatus(payoutId: string, status: PayoutStatus, pullPaymentId?: string) { 
    return newGameWalletManager.updatePayoutStatus(payoutId, status, pullPaymentId); 
  }
  getUserDailyTotal(pubkey: string) { return newGameWalletManager.getUserDailyTotal(pubkey); }
  getTotalDailyPayout() { return newGameWalletManager.getTotalDailyPayout(); }
  canUserEarnMore(pubkey: string) { return newGameWalletManager.canUserEarnMore(pubkey); }
  isAdmin(pubkey: string) { return newGameWalletManager.isAdmin(pubkey); }
  addAdmin(pubkey: string) { return newGameWalletManager.addAdmin(pubkey); }
  removeAdmin(pubkey: string) { return newGameWalletManager.removeAdmin(pubkey); }
  cleanupOldPayouts(daysToKeep?: number) { return newGameWalletManager.cleanupOldPayouts(daysToKeep); }
  resetWithdrawal(payoutId: string) { return newGameWalletManager.resetWithdrawal(payoutId); }
  getResetableWithdrawals() { return newGameWalletManager.getResetableWithdrawals(); }
}

// Export singleton instance (deprecated - use gameWalletManager from @/lib/wallet instead)
export const gameWalletManager = new DeprecatedGameWalletManager();