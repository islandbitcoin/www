/**
 * Game wallet configuration and management
 */

import { secureStorage } from './secureStorage';
import { getNWCClient, NWCClient } from './nwc';

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
  gameType: 'trivia' | 'stacker' | 'achievement' | 'referral';
  gameData?: any;
  timestamp: string;
  status: 'pending' | 'paid' | 'failed';
  paymentProof?: string;
  error?: string;
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
  adminPubkeys: [],
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
    const saved = secureStorage.get<GameWalletConfig>('gameWalletConfig');
    return { ...DEFAULT_CONFIG, ...saved };
  }
  
  saveConfig(updates: Partial<GameWalletConfig>) {
    this.config = { ...this.config, ...updates };
    secureStorage.set('gameWalletConfig', this.config);
  }
  
  getConfig(): GameWalletConfig {
    return { ...this.config };
  }
  
  // User balance management
  getUserBalance(pubkey: string): UserBalance {
    const balances = secureStorage.get<Record<string, UserBalance>>('userBalances') || {};
    
    if (!balances[pubkey]) {
      balances[pubkey] = {
        pubkey,
        balance: 0,
        pendingBalance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        lastActivity: new Date().toISOString(),
      };
      secureStorage.set('userBalances', balances);
    }
    
    return balances[pubkey];
  }
  
  updateUserBalance(pubkey: string, updates: Partial<UserBalance>) {
    const balances = secureStorage.get<Record<string, UserBalance>>('userBalances') || {};
    balances[pubkey] = {
      ...this.getUserBalance(pubkey),
      ...updates,
      lastActivity: new Date().toISOString(),
    };
    secureStorage.set('userBalances', balances);
  }
  
  // Payout tracking
  recordPayout(payout: Omit<GamePayout, 'id' | 'timestamp' | 'status'>): GamePayout {
    const payouts = secureStorage.get<GamePayout[]>('gamePayouts') || [];
    
    const newPayout: GamePayout = {
      ...payout,
      id: `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };
    
    payouts.push(newPayout);
    secureStorage.set('gamePayouts', payouts);
    
    return newPayout;
  }
  
  getPayouts(filters?: {
    userPubkey?: string;
    status?: GamePayout['status'];
    gameType?: GamePayout['gameType'];
    since?: string;
  }): GamePayout[] {
    let payouts = secureStorage.get<GamePayout[]>('gamePayouts') || [];
    
    if (filters?.userPubkey) {
      payouts = payouts.filter(p => p.userPubkey === filters.userPubkey);
    }
    if (filters?.status) {
      payouts = payouts.filter(p => p.status === filters.status);
    }
    if (filters?.gameType) {
      payouts = payouts.filter(p => p.gameType === filters.gameType);
    }
    if (filters?.since) {
      payouts = payouts.filter(p => p.timestamp >= filters.since);
    }
    
    return payouts;
  }
  
  updatePayoutStatus(payoutId: string, status: GamePayout['status'], data?: {
    paymentProof?: string;
    error?: string;
  }) {
    const payouts = secureStorage.get<GamePayout[]>('gamePayouts') || [];
    const index = payouts.findIndex(p => p.id === payoutId);
    
    if (index >= 0) {
      payouts[index] = {
        ...payouts[index],
        status,
        ...data,
      };
      secureStorage.set('gamePayouts', payouts);
    }
  }
  
  // Daily limits
  getUserDailyTotal(pubkey: string): number {
    const today = new Date().toISOString().split('T')[0];
    const payouts = this.getPayouts({
      userPubkey: pubkey,
      since: today + 'T00:00:00.000Z',
      status: 'paid',
    });
    
    return payouts.reduce((sum, p) => sum + p.amount, 0);
  }
  
  getTotalDailyPayout(): number {
    const today = new Date().toISOString().split('T')[0];
    const payouts = this.getPayouts({
      since: today + 'T00:00:00.000Z',
      status: 'paid',
    });
    
    return payouts.reduce((sum, p) => sum + p.amount, 0);
  }
  
  canUserEarnMore(pubkey: string): { allowed: boolean; reason?: string } {
    if (this.config.maintenanceMode) {
      return { allowed: false, reason: 'System is in maintenance mode' };
    }
    
    const userDaily = this.getUserDailyTotal(pubkey);
    if (userDaily >= this.config.maxPayoutPerUser) {
      return { 
        allowed: false, 
        reason: `Daily limit of ${this.config.maxPayoutPerUser} sats reached` 
      };
    }
    
    const totalDaily = this.getTotalDailyPayout();
    if (totalDaily >= this.config.maxDailyPayout) {
      return { 
        allowed: false, 
        reason: 'Daily payout pool exhausted. Try again tomorrow!' 
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
      adminPubkeys: this.config.adminPubkeys.filter(p => p !== pubkey),
    });
  }
}

// Singleton instance
export const gameWalletManager = new GameWalletManager();