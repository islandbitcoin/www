# Lightning Rewards Setup Guide

## Overview

The Satoshi Stacker game now includes a proof-of-work based reward system that allows players to earn real Bitcoin via Lightning Network. This document explains how to set up the backend integration.

## Current Implementation

The frontend is ready with:
- ✅ Proof of Work algorithm (SHA-256 with adjustable difficulty)
- ✅ Anti-cheat measures (rate limiting, claim tracking)
- ✅ Lightning address input and validation
- ✅ Reward tiers based on score achievements
- ✅ Invoice display and copy functionality

## Backend Requirements

To make the rewards functional, you need:

### 1. Lightning Node

Options:
- **LND** - Lightning Network Daemon
- **CLN** (Core Lightning) - Blockstream's implementation
- **Eclair** - ACINQ's implementation

### 2. Lightning Service Provider

Easier alternatives to running your own node:
- **Strike API** - Simple Lightning payments API
- **OpenNode** - Bitcoin & Lightning payment processor
- **BTCPay Server** - Self-hosted payment processor
- **Alby API** - Lightning wallet with API
- **Voltage** - Managed Lightning nodes

### 3. Backend API Endpoints

Create these endpoints:

#### POST /api/rewards/claim
```typescript
interface ClaimRequest {
  playerPubkey: string;
  score: number;
  proofOfWork: {
    challenge: string;
    nonce: number;
    hash: string;
  };
  lightningAddress: string;
}

interface ClaimResponse {
  success: boolean;
  invoice?: string;
  satoshis?: number;
  error?: string;
}
```

#### GET /api/rewards/history/:pubkey
```typescript
interface RewardHistory {
  claims: Array<{
    score: number;
    satoshis: number;
    timestamp: string;
    paid: boolean;
  }>;
  totalEarned: number;
}
```

### 4. Implementation Steps

1. **Verify Proof of Work**
   ```javascript
   async function verifyPoW(challenge, nonce, expectedHash) {
     const message = `${challenge}:${nonce}`;
     const hash = crypto.createHash('sha256').update(message).digest('hex');
     return hash === expectedHash && hash.startsWith('0'.repeat(difficulty));
   }
   ```

2. **Check Anti-Fraud Measures**
   - Rate limit by IP and pubkey
   - Verify score hasn't been claimed before
   - Check for suspicious patterns

3. **Generate Lightning Invoice**
   ```javascript
   // Example with LND
   const { invoice } = await lnd.addInvoice({
     value: rewardSatoshis,
     memo: `Island Bitcoin Reward - Score: ${score}`,
     expiry: 3600, // 1 hour
   });
   ```

4. **Store Claim Record**
   - Save to database with claim details
   - Track payment status

### 5. Security Considerations

1. **Rate Limiting**
   - Max 10 claims per hour per user
   - Max 50 claims per day per IP

2. **Proof of Work Validation**
   - Verify challenge was issued by your server
   - Check challenge timestamp (max 5 minutes old)
   - Ensure nonce produces correct hash

3. **Score Validation**
   - Verify score progression is realistic
   - Check for impossible score jumps

## Testing

For testing without real payments:
1. Use testnet Lightning Network
2. Use mock invoices in development
3. Set low reward amounts (1-10 sats)

## Configuration

Update `src/services/lightningRewards.ts`:
```typescript
// Replace mock invoice generation with:
const response = await fetch('/api/rewards/claim', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(claim),
});
```

## Reward Tiers

Current reward structure:
- 100-999 sats: 1 sat reward
- 1,000-4,999 sats: 5 sats reward
- 5,000-9,999 sats: 10 sats reward
- 10,000-19,999 sats: 21 sats reward
- 20,000-49,999 sats: 50 sats reward
- 50,000-99,999 sats: 100 sats reward
- 100,000+ sats: 210 sats reward

## Monitoring

Track:
- Total rewards distributed
- Average claim time
- Fraud detection hits
- Payment success rate

## Support

For questions about Lightning integration:
- Lightning Dev Community: https://lightning.engineering/
- BTCPay Docs: https://docs.btcpayserver.org/
- OpenNode API: https://developers.opennode.com/