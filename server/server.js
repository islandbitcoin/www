import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import dotenv from 'dotenv';
import { cache } from './redisClient.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_SECRET = process.env.API_SECRET || 'change-this-secret-in-production';
const CONFIG_CACHE_KEY = 'island-bitcoin:config';
const CONFIG_CACHE_TTL = 300; // 5 minutes

// Rate limiting configurations
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const configLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit config updates to 10 per minute
  message: 'Too many config updates, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allowed origins - update these for production
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:8080',
      'https://islandbitcoin.com',
      'https://www.islandbitcoin.com',
      // Add your production domains here
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.islandbitcoin.com')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// API Authentication middleware
const authenticateAPI = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (!apiKey || apiKey !== API_SECRET) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or missing API key'
    });
  }
  
  next();
};

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// Validation rules for config update
const validateConfigUpdate = [
  body('pullPaymentId').optional().isString().trim().isLength({ max: 100 }),
  body('btcPayServerUrl').optional().isURL({ protocols: ['http', 'https'] }),
  body('btcPayStoreId').optional().isString().trim().isLength({ max: 100 }),
  body('btcPayApiKey').optional().isString().trim().isLength({ max: 200 }),
  body('maxDailyPayout').optional().isInt({ min: 0, max: 10000000 }),
  body('maxPayoutPerUser').optional().isInt({ min: 0, max: 1000000 }),
  body('minWithdrawal').optional().isInt({ min: 1, max: 100000 }),
  body('withdrawalFee').optional().isInt({ min: 0, max: 1000 }),
  body('gameRewards').optional().isObject(),
  body('gameRewards.triviaEasy').optional().isInt({ min: 0, max: 1000 }),
  body('gameRewards.triviaMedium').optional().isInt({ min: 0, max: 1000 }),
  body('gameRewards.triviaHard').optional().isInt({ min: 0, max: 1000 }),
  body('gameRewards.dailyChallenge').optional().isInt({ min: 0, max: 10000 }),
  body('gameRewards.achievementBonus').optional().isInt({ min: 0, max: 10000 }),
  body('gameRewards.referralBonus').optional().isInt({ min: 0, max: 10000 }),
  body('rateLimits').optional().isObject(),
  body('rateLimits.triviaPerHour').optional().isInt({ min: 1, max: 100 }),
  body('rateLimits.withdrawalsPerDay').optional().isInt({ min: 1, max: 10 }),
  body('rateLimits.maxStreakBonus').optional().isInt({ min: 0, max: 10000 }),
  body('adminPubkeys').optional().isArray(),
  body('adminPubkeys.*').optional().isString().matches(/^[a-fA-F0-9]{64}$/),
  body('requireApprovalAbove').optional().isInt({ min: 0, max: 1000000 }),
  body('maintenanceMode').optional().isBoolean(),
];

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(generalLimiter); // Apply general rate limit to all routes

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

// Health check with Redis status
app.get('/health', async (req, res) => {
  const redisConnected = cache.isConnected();
  
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    redis: {
      connected: redisConnected,
      status: redisConnected ? 'healthy' : 'disconnected'
    }
  });
});

// Get game configuration with Redis caching
app.get('/api/config', authenticateAPI, async (req, res) => {
  try {
    // Try to get from cache first
    const cached = await cache.get(CONFIG_CACHE_KEY);
    if (cached) {
      console.log('📦 Config served from cache');
      return res.json({
        success: true,
        data: cached,
        cached: true
      });
    }

    // If not in cache, return in-memory config and cache it
    if (gameConfig.lastUpdated) {
      await cache.set(CONFIG_CACHE_KEY, gameConfig, CONFIG_CACHE_TTL);
    }

    res.json({
      success: true,
      data: gameConfig,
      cached: false
    });
  } catch (error) {
    console.error('❌ Error getting config:', error);
    // Fallback to in-memory config
    res.json({
      success: true,
      data: gameConfig,
      cached: false
    });
  }
});

// Update game configuration
app.post('/api/config', authenticateAPI, configLimiter, validateConfigUpdate, handleValidationErrors, async (req, res) => {
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
  
  // Invalidate cache when config is updated
  await cache.del(CONFIG_CACHE_KEY);
  // Set new config in cache
  await cache.set(CONFIG_CACHE_KEY, gameConfig, CONFIG_CACHE_TTL);
  
  console.log('Configuration updated:', gameConfig);
  console.log('🗑️ Cache invalidated and refreshed');
  
  res.json({
    success: true,
    data: gameConfig
  });
});

// Remove game configuration
app.delete('/api/config', authenticateAPI, configLimiter, async (req, res) => {
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
  
  // Clear cache when config is removed
  await cache.del(CONFIG_CACHE_KEY);
  
  console.log('Configuration removed');
  console.log('🗑️ Cache cleared');
  
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