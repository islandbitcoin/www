import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory storage (in production, use a real database)
let gameConfig = {
  pullPaymentId: null,
  btcPayServerUrl: null,
  btcPayStoreId: null,
  btcPayApiKey: null,
  
  // Payout Settings
  maxDailyPayout: null,
  maxPayoutPerUser: null,
  minWithdrawal: null,
  withdrawalFee: null,

  // Game Rewards
  gameRewards: null,

  // Rate Limits
  rateLimits: null,

  // Admin Settings
  adminPubkeys: null,
  requireApprovalAbove: null,
  maintenanceMode: null,

  lastUpdated: null
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get game configuration
app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    data: gameConfig
  });
});

// Update game configuration
app.post('/api/config', (req, res) => {
  const {
    pullPaymentId,
    btcPayServerUrl,
    btcPayStoreId,
    btcPayApiKey,
    maxDailyPayout,
    maxPayoutPerUser,
    minWithdrawal,
    withdrawalFee,
    gameRewards,
    rateLimits,
    adminPubkeys,
    requireApprovalAbove,
    maintenanceMode
  } = req.body;
  
  // Update configuration with all provided fields (keep existing values for unprovided fields)
  if (pullPaymentId !== undefined) gameConfig.pullPaymentId = pullPaymentId ? pullPaymentId.trim() : null;
  if (btcPayServerUrl !== undefined) gameConfig.btcPayServerUrl = btcPayServerUrl ? btcPayServerUrl.trim() : null;
  if (btcPayStoreId !== undefined) gameConfig.btcPayStoreId = btcPayStoreId ? btcPayStoreId.trim() : null;
  if (btcPayApiKey !== undefined) gameConfig.btcPayApiKey = btcPayApiKey ? btcPayApiKey.trim() : null;
  if (maxDailyPayout !== undefined) gameConfig.maxDailyPayout = maxDailyPayout;
  if (maxPayoutPerUser !== undefined) gameConfig.maxPayoutPerUser = maxPayoutPerUser;
  if (minWithdrawal !== undefined) gameConfig.minWithdrawal = minWithdrawal;
  if (withdrawalFee !== undefined) gameConfig.withdrawalFee = withdrawalFee;
  if (gameRewards !== undefined) gameConfig.gameRewards = gameRewards;
  if (rateLimits !== undefined) gameConfig.rateLimits = rateLimits;
  if (adminPubkeys !== undefined) gameConfig.adminPubkeys = adminPubkeys;
  if (requireApprovalAbove !== undefined) gameConfig.requireApprovalAbove = requireApprovalAbove;
  if (maintenanceMode !== undefined) gameConfig.maintenanceMode = maintenanceMode;
  
  gameConfig.lastUpdated = new Date().toISOString();
  
  console.log('Configuration updated:', gameConfig);
  
  res.json({
    success: true,
    data: gameConfig
  });
});

// Remove game configuration
app.delete('/api/config', (req, res) => {
  gameConfig = {
    pullPaymentId: null,
    btcPayServerUrl: null,
    btcPayStoreId: null,
    btcPayApiKey: null,
    
    // Payout Settings
    maxDailyPayout: null,
    maxPayoutPerUser: null,
    minWithdrawal: null,
    withdrawalFee: null,

    // Game Rewards
    gameRewards: null,

    // Rate Limits
    rateLimits: null,

    // Admin Settings
    adminPubkeys: null,
    requireApprovalAbove: null,
    maintenanceMode: null,

    lastUpdated: new Date().toISOString()
  };
  
  console.log('Configuration removed');
  
  res.json({
    success: true,
    data: gameConfig
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Island Bitcoin Sync Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`⚙️  Config API: http://localhost:${PORT}/api/config`);
});