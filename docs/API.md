# Island Bitcoin - API Documentation

## Overview

Island Bitcoin integrates with several external APIs and provides internal service endpoints. This document covers all API interactions.

## Config Sync Server API

The config sync server enables configuration synchronization across browsers and sessions.

### Base URL
```
http://localhost:3001 (development)
https://api.islandbitcoin.com (production)
```

### Authentication
All endpoints require an API key passed in the `x-api-key` header:
```
x-api-key: your-secret-key
```

### Endpoints

#### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-03-20T10:00:00Z"
}
```

#### GET /api/config
Retrieve the current configuration.

**Response:**
```json
{
  "pullPaymentId": "abc123",
  "btcPayServerUrl": "https://btcpay.example.com",
  "btcPayStoreId": "STORE123",
  "btcPayApiKey": "encrypted_key",
  "maxDailyPayout": 10000,
  "maxPayoutPerUser": 1000,
  "minWithdrawal": 100,
  "withdrawalFee": 10,
  "gameRewards": {
    "triviaEasy": 5,
    "triviaMedium": 10,
    "triviaHard": 21,
    "dailyChallenge": 50,
    "achievementBonus": 25,
    "referralBonus": 100
  },
  "adminPubkeys": ["npub1..."],
  "requireApprovalAbove": 5000,
  "maintenanceMode": false
}
```

#### POST /api/config
Update the configuration.

**Request Body:**
```json
{
  "maxDailyPayout": 15000,
  "gameRewards": {
    "triviaEasy": 10
  }
}
```

**Response:**
```json
{
  "success": true,
  "config": { /* updated config */ }
}
```

## BTCPay Server API

Island Bitcoin integrates with BTCPay Server for Lightning withdrawals.

### Authentication
Uses API key authentication:
```
Authorization: token YOUR_BTCPAY_API_KEY
```

### Key Endpoints Used

#### POST /api/v1/stores/{storeId}/pull-payments
Create a new pull payment for withdrawals.

**Request:**
```json
{
  "name": "Island Bitcoin Withdrawal",
  "amount": "0.00001000",
  "currency": "BTC",
  "autoApproveClaims": true
}
```

**Response:**
```json
{
  "id": "pullpayment_123",
  "viewLink": "https://btcpay.example.com/pull-payments/123"
}
```

#### GET /api/v1/stores/{storeId}/pull-payments/{pullPaymentId}
Get pull payment status.

**Response:**
```json
{
  "id": "pullpayment_123",
  "amount": "0.00001000",
  "currency": "BTC",
  "claimed": "0.00000000",
  "awaitingCompletion": false
}
```

## Nostr Protocol

Island Bitcoin uses Nostr for social features and authentication.

### Relay Connection
Default relay: `wss://relay.nostr.band`

### Event Kinds Used

| Kind | Description | Usage |
|------|-------------|-------|
| 0 | User Metadata | Profile information |
| 1 | Text Note | Social posts |
| 3 | Contact List | Following/followers |
| 4 | Encrypted DM | Direct messages |
| 7 | Reaction | Likes and reactions |
| 10002 | Relay List | User's preferred relays |

### Custom Tags

| Tag | Description | Example |
|-----|-------------|---------|
| `t` | Content category | `["t", "islandbitcoin"]` |
| `client` | Client identifier | `["client", "island-bitcoin"]` |

### Query Examples

```typescript
// Get recent posts
const posts = await nostr.query([
  { 
    kinds: [1], 
    '#t': ['islandbitcoin'],
    limit: 20 
  }
]);

// Get user profile
const profile = await nostr.query([
  { 
    kinds: [0], 
    authors: [pubkey],
    limit: 1
  }
]);
```

## Internal Services

### Game Wallet Manager

The game wallet manager handles all balance and payout operations internally.

#### Key Methods

```typescript
// Award sats to user
gameWalletManager.recordPayout({
  userPubkey: "hex_pubkey",
  amount: 10,
  gameType: "trivia"
});

// Get user balance
const balance = gameWalletManager.getUserBalance("hex_pubkey");
// Returns: { balance: 150, pendingBalance: 0, totalEarned: 500 }

// Check payout eligibility
const canEarn = gameWalletManager.canUserEarnMore("hex_pubkey");
// Returns: { allowed: true, reason?: "Daily limit reached" }
```

### Local Storage Keys

| Key | Description | Format |
|-----|-------------|--------|
| `gameWalletConfig` | Wallet configuration | JSON |
| `gameBalances` | User balances | JSON |
| `gamePayouts` | Payout history | JSON Array |
| `nostr:login` | Login state | JSON |
| `nostr:app-config` | App preferences | JSON |

## Rate Limiting

### Game Actions
- Trivia: 10 games per hour
- Stacker: Unlimited (but payout limited)
- Withdrawals: 3 per day

### API Requests
- Config sync: 60 requests per minute
- BTCPay: Follow their limits
- Nostr: Relay-specific limits

## Error Codes

| Code | Description | Action |
|------|-------------|--------|
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Check API key |
| 403 | Forbidden | Check permissions |
| 429 | Rate Limited | Wait and retry |
| 500 | Server Error | Contact support |

## WebSocket Events

### Nostr Subscription
```javascript
const sub = nostr.subscribe([
  { kinds: [1], since: Math.floor(Date.now() / 1000) }
], {
  onevent: (event) => {
    console.log('New event:', event);
  },
  oneose: () => {
    console.log('End of stored events');
  }
});
```

### Real-time Updates
- New posts appear automatically
- Direct messages sync in real-time
- Profile updates propagate immediately

## Security Considerations

1. **API Keys**: Never expose API keys in client code
2. **CORS**: Configure appropriate CORS headers
3. **Rate Limiting**: Implement client-side throttling
4. **Input Validation**: Validate all user inputs
5. **Error Handling**: Never expose sensitive errors

## Testing

### Test Endpoints
```bash
# Health check
curl http://localhost:3001/health

# Get config (with auth)
curl -H "x-api-key: test-key" http://localhost:3001/api/config

# Update config
curl -X POST -H "x-api-key: test-key" \
  -H "Content-Type: application/json" \
  -d '{"maxDailyPayout": 20000}' \
  http://localhost:3001/api/config
```

---

*For API access or integration questions, contact the development team.*