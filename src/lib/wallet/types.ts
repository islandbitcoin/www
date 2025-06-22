/**
 * Shared types for wallet services
 */

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
  timestamp: string;
  status: "pending" | "paid" | "failed";
  // Only store essential data
  pullPaymentId?: string; // For tracking withdrawals
}

export type PayoutStatus = "pending" | "paid" | "failed";

export interface PayoutFilters {
  status?: PayoutStatus;
  gameType?: GamePayout['gameType'];
  userPubkey?: string;
  startDate?: string;
  endDate?: string;
}

export interface PayoutRequest {
  userPubkey: string;
  amount: number;
  gameType: GamePayout['gameType'];
  pullPaymentId?: string;
}

// Default configuration
export const DEFAULT_CONFIG: GameWalletConfig = {
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