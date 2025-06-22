/**
 * Referral system for user acquisition and rewards
 */

import { secureStorage } from './secureStorage';
import { gameWalletManager } from './gameWallet';

export interface ReferralData {
  referrerId: string; // Pubkey of the referrer
  referredId: string; // Pubkey of the referred user
  timestamp: string;
  rewardClaimed: boolean;
  rewardAmount?: number;
}

export interface UserReferralStats {
  pubkey: string;
  referralCode: string;
  referredBy?: string;
  totalReferrals: number;
  successfulReferrals: number; // Users who completed first game
  totalRewardsEarned: number;
  referralLinks: number;
}

class ReferralSystem {
  private readonly REFERRAL_KEY = 'referral-data';
  private readonly USER_STATS_KEY = 'referral-stats';
  private readonly REFERRAL_REWARD = 100; // sats for successful referral
  private readonly REFERRED_BONUS = 25; // bonus sats for new users who use referral

  /**
   * Generate a referral code from a pubkey
   */
  generateReferralCode(pubkey: string): string {
    // Take first 4 and last 4 characters of pubkey
    return `${pubkey.slice(0, 4)}${pubkey.slice(-4)}`.toUpperCase();
  }

  /**
   * Get referral link for a user
   */
  getReferralLink(pubkey: string): string {
    const code = this.generateReferralCode(pubkey);
    const baseUrl = window.location.origin;
    return `${baseUrl}/?ref=${code}`;
  }

  /**
   * Track a referral when a new user signs up
   */
  trackReferral(referrerCode: string, referredPubkey: string): boolean {
    try {
      // Find referrer by code
      const stats = this.getAllUserStats();
      const referrer = Object.values(stats).find(
        s => s.referralCode === referrerCode.toUpperCase()
      );

      if (!referrer || referrer.pubkey === referredPubkey) {
        return false; // Invalid code or self-referral
      }

      // Check if user was already referred
      const referredStats = this.getUserStats(referredPubkey);
      if (referredStats.referredBy) {
        return false; // Already referred
      }

      // Record the referral
      const referrals = this.getReferrals();
      const newReferral: ReferralData = {
        referrerId: referrer.pubkey,
        referredId: referredPubkey,
        timestamp: new Date().toISOString(),
        rewardClaimed: false
      };
      referrals.push(newReferral);
      secureStorage.set(this.REFERRAL_KEY, referrals);

      // Update stats
      this.updateUserStats(referrer.pubkey, {
        totalReferrals: referrer.totalReferrals + 1
      });

      this.updateUserStats(referredPubkey, {
        referredBy: referrer.pubkey
      });

      // Award bonus to new user
      if (gameWalletManager) {
        const payout = gameWalletManager.recordPayout({
          userPubkey: referredPubkey,
          amount: this.REFERRED_BONUS,
          gameType: 'referral'
        });

        const balance = gameWalletManager.getUserBalance(referredPubkey);
        gameWalletManager.updateUserBalance(referredPubkey, {
          balance: balance.balance + this.REFERRED_BONUS,
          totalEarned: balance.totalEarned + this.REFERRED_BONUS
        });

        gameWalletManager.updatePayoutStatus(payout.id, 'paid');
      }

      return true;
    } catch (error) {
      console.error('Error tracking referral:', error);
      return false;
    }
  }

  /**
   * Check if a referred user has completed their first game
   */
  checkReferralCompletion(referredPubkey: string): void {
    const referrals = this.getReferrals();
    const referral = referrals.find(
      r => r.referredId === referredPubkey && !r.rewardClaimed
    );

    if (!referral) return;

    // Check if user has played at least one game
    const payouts = gameWalletManager.getPayouts({
      userPubkey: referredPubkey,
      gameType: 'trivia' // or any game type
    });

    if (payouts.length > 0) {
      // Mark referral as successful and award referrer
      referral.rewardClaimed = true;
      referral.rewardAmount = this.REFERRAL_REWARD;
      secureStorage.set(this.REFERRAL_KEY, referrals);

      // Award referrer
      const referrerBalance = gameWalletManager.getUserBalance(referral.referrerId);
      const payout = gameWalletManager.recordPayout({
        userPubkey: referral.referrerId,
        amount: this.REFERRAL_REWARD,
        gameType: 'referral'
      });

      gameWalletManager.updateUserBalance(referral.referrerId, {
        balance: referrerBalance.balance + this.REFERRAL_REWARD,
        totalEarned: referrerBalance.totalEarned + this.REFERRAL_REWARD
      });

      gameWalletManager.updatePayoutStatus(payout.id, 'paid');

      // Update referrer stats
      const referrerStats = this.getUserStats(referral.referrerId);
      this.updateUserStats(referral.referrerId, {
        successfulReferrals: referrerStats.successfulReferrals + 1,
        totalRewardsEarned: referrerStats.totalRewardsEarned + this.REFERRAL_REWARD
      });
    }
  }

  /**
   * Get all referrals
   */
  private getReferrals(): ReferralData[] {
    return secureStorage.get<ReferralData[]>(this.REFERRAL_KEY) || [];
  }

  /**
   * Get user referral stats
   */
  getUserStats(pubkey: string): UserReferralStats {
    const allStats = this.getAllUserStats();
    
    if (!allStats[pubkey]) {
      allStats[pubkey] = {
        pubkey,
        referralCode: this.generateReferralCode(pubkey),
        totalReferrals: 0,
        successfulReferrals: 0,
        totalRewardsEarned: 0,
        referralLinks: 0
      };
      secureStorage.set(this.USER_STATS_KEY, allStats);
    }

    return allStats[pubkey];
  }

  /**
   * Get all user stats
   */
  private getAllUserStats(): Record<string, UserReferralStats> {
    return secureStorage.get<Record<string, UserReferralStats>>(this.USER_STATS_KEY) || {};
  }

  /**
   * Update user stats
   */
  private updateUserStats(pubkey: string, updates: Partial<UserReferralStats>): void {
    const allStats = this.getAllUserStats();
    const currentStats = this.getUserStats(pubkey);
    
    allStats[pubkey] = {
      ...currentStats,
      ...updates
    };
    
    secureStorage.set(this.USER_STATS_KEY, allStats);
  }

  /**
   * Track when a referral link is shared
   */
  trackReferralShare(pubkey: string): void {
    const stats = this.getUserStats(pubkey);
    this.updateUserStats(pubkey, {
      referralLinks: stats.referralLinks + 1
    });
  }

  /**
   * Get referral leaderboard
   */
  getReferralLeaderboard(limit: number = 10): UserReferralStats[] {
    const allStats = this.getAllUserStats();
    return Object.values(allStats)
      .filter(s => s.successfulReferrals > 0)
      .sort((a, b) => b.successfulReferrals - a.successfulReferrals)
      .slice(0, limit);
  }

  /**
   * Check if a referral code is valid
   */
  isValidReferralCode(code: string): boolean {
    const stats = this.getAllUserStats();
    return Object.values(stats).some(
      s => s.referralCode === code.toUpperCase()
    );
  }

  /**
   * Get referrer info from code
   */
  getReferrerFromCode(code: string): string | null {
    const stats = this.getAllUserStats();
    const referrer = Object.values(stats).find(
      s => s.referralCode === code.toUpperCase()
    );
    return referrer?.pubkey || null;
  }
}

export const referralSystem = new ReferralSystem();