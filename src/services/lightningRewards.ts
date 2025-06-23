/**
 * Lightning Network rewards service for Satoshi Stacker
 * Handles reward payouts via Lightning invoices
 */

export interface RewardTier {
  minScore: number;
  maxScore: number;
  satoshis: number;
  description: string;
}

export interface RewardClaim {
  playerPubkey: string;
  score: number;
  proofOfWork: {
    challenge: string;
    nonce: number;
    hash: string;
  };
  lightningAddress?: string;
  invoice?: string;
}

export interface RewardResponse {
  success: boolean;
  invoice?: string;
  satoshis?: number;
  error?: string;
}

// Reward tiers based on score achievements
export const REWARD_TIERS: RewardTier[] = [
  { minScore: 100, maxScore: 999, satoshis: 1, description: 'Satoshi Starter' },
  { minScore: 1000, maxScore: 4999, satoshis: 5, description: 'Bitcoin Beginner' },
  { minScore: 5000, maxScore: 9999, satoshis: 10, description: 'Stacking Apprentice' },
  { minScore: 10000, maxScore: 19999, satoshis: 21, description: 'HODLer' },
  { minScore: 20000, maxScore: 49999, satoshis: 50, description: 'Diamond Hands' },
  { minScore: 50000, maxScore: 99999, satoshis: 100, description: 'Bitcoin Maximalist' },
  { minScore: 100000, maxScore: Infinity, satoshis: 210, description: 'Legendary Stacker' }
];

/**
 * Get reward amount based on score
 */
export function getRewardAmount(score: number): number {
  const tier = REWARD_TIERS.find(t => score >= t.minScore && score <= t.maxScore);
  return tier?.satoshis || 0;
}

/**
 * Get reward tier information
 */
export function getRewardTier(score: number): RewardTier | null {
  return REWARD_TIERS.find(t => score >= t.minScore && score <= t.maxScore) || null;
}

/**
 * Check if player has already claimed reward for this score
 * Uses localStorage to track claims (in production, this would be server-side)
 */
export function hasClaimedReward(playerPubkey: string, score: number): boolean {
  const claimedKey = `satoshi-stacker-claims:${playerPubkey}`;
  const claims = JSON.parse(localStorage.getItem(claimedKey) || '[]');
  
  // Check if this exact score has been claimed
  return claims.some((claim: number) => claim === score);
}

/**
 * Record a reward claim
 */
export function recordRewardClaim(playerPubkey: string, score: number): void {
  const claimedKey = `satoshi-stacker-claims:${playerPubkey}`;
  const claims = JSON.parse(localStorage.getItem(claimedKey) || '[]');
  
  if (!claims.includes(score)) {
    claims.push(score);
    localStorage.setItem(claimedKey, JSON.stringify(claims));
  }
}

/**
 * Validate Lightning address format
 */
export function validateLightningAddress(address: string): boolean {
  // Basic Lightning address validation (email-like format)
  const lightningAddressRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return lightningAddressRegex.test(address);
}

/**
 * Create a reward claim request
 * In production, this would call a backend API
 */
export async function claimReward(claim: RewardClaim): Promise<RewardResponse> {
  try {
    // Validate claim
    if (hasClaimedReward(claim.playerPubkey, claim.score)) {
      return {
        success: false,
        error: 'Reward already claimed for this score'
      };
    }
    
    const rewardAmount = getRewardAmount(claim.score);
    if (rewardAmount === 0) {
      return {
        success: false,
        error: 'Score too low for rewards'
      };
    }
    
    // Production implementation would:
    // 1. Verify the proof of work on the server
    // 2. Check anti-fraud measures (rate limiting, etc.)
    // 3. Generate a Lightning invoice via Lightning node or service
    // 4. Return the invoice to the player
    
    // Mock implementation for development
    
    const mockInvoice = `lnbc${rewardAmount}1234567890abcdef...`; // Mock invoice
    
    // Record the claim
    recordRewardClaim(claim.playerPubkey, claim.score);
    
    return {
      success: true,
      invoice: mockInvoice,
      satoshis: rewardAmount
    };
  } catch (error) {
    console.error('Error claiming reward:', error);
    return {
      success: false,
      error: 'Failed to generate reward invoice'
    };
  }
}

/**
 * Get claim history for a player
 */
export function getClaimHistory(playerPubkey: string): number[] {
  const claimedKey = `satoshi-stacker-claims:${playerPubkey}`;
  return JSON.parse(localStorage.getItem(claimedKey) || '[]');
}

/**
 * Calculate total rewards earned by a player
 */
export function getTotalRewardsEarned(playerPubkey: string): number {
  const claims = getClaimHistory(playerPubkey);
  return claims.reduce((total, score) => total + getRewardAmount(score), 0);
}

/**
 * Anti-cheat: Check if claim rate is suspicious
 */
export function isClaimRateSuspicious(playerPubkey: string): boolean {
  const recentClaimsKey = `satoshi-stacker-recent:${playerPubkey}`;
  const recentClaims = JSON.parse(localStorage.getItem(recentClaimsKey) || '[]');
  const now = Date.now();
  
  // Filter claims within last hour
  const hourAgo = now - (60 * 60 * 1000);
  const claimsLastHour = recentClaims.filter((timestamp: number) => timestamp > hourAgo);
  
  // Suspicious if more than 10 claims in an hour
  return claimsLastHour.length > 10;
}

/**
 * Record timestamp of claim attempt for rate limiting
 */
export function recordClaimAttempt(playerPubkey: string): void {
  const recentClaimsKey = `satoshi-stacker-recent:${playerPubkey}`;
  const recentClaims = JSON.parse(localStorage.getItem(recentClaimsKey) || '[]');
  const now = Date.now();
  
  // Add new timestamp
  recentClaims.push(now);
  
  // Keep only last 24 hours of data
  const dayAgo = now - (24 * 60 * 60 * 1000);
  const filtered = recentClaims.filter((timestamp: number) => timestamp > dayAgo);
  
  localStorage.setItem(recentClaimsKey, JSON.stringify(filtered));
}