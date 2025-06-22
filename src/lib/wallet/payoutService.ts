/**
 * Payout tracking and management service
 * Handles recording, updating, and querying game payouts
 */

import { secureStorage } from "../secureStorage";
import { GamePayout, PayoutRequest } from "./types";

export class PayoutService {
  // Payout tracking - only store essential data
  recordPayout(payout: PayoutRequest): GamePayout {
    const payouts = secureStorage.get<GamePayout[]>("gamePayouts") || [];

    // Only store essential fields
    const newPayout: GamePayout = {
      id: `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userPubkey: payout.userPubkey,
      amount: payout.amount,
      gameType: payout.gameType,
      timestamp: new Date().toISOString(),
      status: "pending",
      pullPaymentId: payout.pullPaymentId
    };

    payouts.push(newPayout);
    secureStorage.set("gamePayouts", payouts);

    return newPayout;
  }

  getPayouts(filters?: { 
    userPubkey?: string; 
    status?: GamePayout["status"]; 
    gameType?: GamePayout["gameType"]; 
    since?: string 
  }): GamePayout[] {
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
    pullPaymentId?: string
  ) {
    const payouts = secureStorage.get<GamePayout[]>("gamePayouts") || [];
    const index = payouts.findIndex((p) => p.id === payoutId);

    if (index >= 0) {
      payouts[index] = {
        ...payouts[index],
        status,
        pullPaymentId: pullPaymentId || payouts[index].pullPaymentId
      };
      secureStorage.set("gamePayouts", payouts);
    }
  }

  // Data cleanup utilities
  cleanupOldPayouts(daysToKeep: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoff = cutoffDate.toISOString();

    const payouts = secureStorage.get<GamePayout[]>("gamePayouts") || [];
    const filtered = payouts.filter(p => 
      p.timestamp >= cutoff || 
      p.status === "pending"
    );

    secureStorage.set("gamePayouts", filtered);
    console.log(`🧹 Cleaned up ${payouts.length - filtered.length} old payouts`);
  }

  // Withdrawal management
  resetWithdrawal(payoutId: string): boolean {
    const payouts = secureStorage.get<GamePayout[]>("gamePayouts") || [];
    const payout = payouts.find(p => p.id === payoutId);
    
    if (!payout || payout.gameType !== "withdrawal") {
      return false;
    }

    // Update status to failed
    this.updatePayoutStatus(payoutId, "failed");
    
    console.log(`💸 Reset withdrawal ${payoutId}`);
    return true;
  }

  getResetableWithdrawals(): GamePayout[] {
    const payouts = this.getPayouts({ gameType: "withdrawal", status: "pending" });
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    return payouts.filter(p => {
      const payoutTime = new Date(p.timestamp).getTime();
      return payoutTime < oneHourAgo;
    });
  }
}