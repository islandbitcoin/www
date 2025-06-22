/**
 * User balance management service
 * Handles user balance tracking, updates, and daily limits
 */

import { secureStorage } from "../secureStorage";
import { UserBalance, GamePayout } from "./types";

export class BalanceService {
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

  // Daily earning calculations
  getUserDailyTotal(pubkey: string): number {
    const today = new Date().toISOString().split("T")[0];
    const payouts = secureStorage.get<GamePayout[]>("gamePayouts") || [];
    
    return payouts
      .filter((p) => 
        p.userPubkey === pubkey && 
        p.status === "paid" && 
        p.timestamp.startsWith(today) &&
        p.gameType !== "withdrawal"
      )
      .reduce((sum, p) => sum + p.amount, 0);
  }

  getTotalDailyPayout(): number {
    const today = new Date().toISOString().split("T")[0];
    const payouts = secureStorage.get<GamePayout[]>("gamePayouts") || [];
    
    return payouts
      .filter((p) => 
        p.status === "paid" && 
        p.timestamp.startsWith(today) &&
        p.gameType !== "withdrawal"
      )
      .reduce((sum, p) => sum + p.amount, 0);
  }

  canUserEarnMore(pubkey: string, maxPayoutPerUser: number, maxDailyPayout: number): { allowed: boolean; reason?: string } {
    const userDaily = this.getUserDailyTotal(pubkey);
    const totalDaily = this.getTotalDailyPayout();

    if (userDaily >= maxPayoutPerUser) {
      return {
        allowed: false,
        reason: `Daily limit reached (${maxPayoutPerUser} sats)`
      };
    }

    if (totalDaily >= maxDailyPayout) {
      return {
        allowed: false,
        reason: "Global daily limit reached"
      };
    }

    return { allowed: true };
  }
}