import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { body, validationResult } from 'express-validator';
import dotenv from 'dotenv';
import { cache } from './redisClient.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const API_SECRET = process.env.API_SECRET || 'change-this-secret-in-production';
const CONFIG_CACHE_KEY = 'island-bitcoin:config';
const CONFIG_PERSISTENT_KEY = 'island-bitcoin:config:persistent';
const CONFIG_CACHE_TTL = 300; // 5 minutes

// Trust proxy to get correct IPs when behind Nginx
app.set('trust proxy', true);


// CORS configuration for API endpoints only
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // For same-origin requests, always allow
    callback(null, true);
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

// Default configuration
const DEFAULT_CONFIG = {
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

// Load config from Redis on startup
let gameConfig = { ...DEFAULT_CONFIG };

// Initialize config from Redis
(async () => {
  try {
    const persistedConfig = await cache.get(CONFIG_PERSISTENT_KEY);
    if (persistedConfig) {
      gameConfig = { ...DEFAULT_CONFIG, ...persistedConfig };
      // Config loaded from Redis
    } else {
      // No persisted config, using defaults
    }
  } catch (error) {
    console.error('❌ Failed to load persisted config:', error);
  }
})();

// Apply CORS only to API routes
app.use('/api', cors(corsOptions));
app.use('/api', bodyParser.json());

// Debug endpoint to check your IP (before rate limiting)
app.get('/api/check-ip', (req, res) => {
  const ip = req.headers['x-real-ip'] || 
         req.headers['x-forwarded-for']?.split(',')[0].trim() || 
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         req.ip;
  const clientIp = ip?.replace(/^::ffff:/, '') || 'unknown';
  
  const headers = {
    'x-real-ip': req.headers['x-real-ip'],
    'x-forwarded-for': req.headers['x-forwarded-for'],
    'x-forwarded-proto': req.headers['x-forwarded-proto'],
    'connection-remoteAddress': req.connection?.remoteAddress,
    'socket-remoteAddress': req.socket?.remoteAddress,
    'req-ip': req.ip
  };
  
  res.json({
    yourIp: clientIp,
    headers: headers,
    trustProxy: app.get('trust proxy'),
    rateLimits: {
      general: 'No rate limiting',
      config: 'No rate limiting'
    }
  });
});


// ====================
// API Routes
// ====================

// Health check with Redis status
app.get('/api/health', async (req, res) => {
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


// Get game configuration - PUBLIC endpoint (no auth required)
// All users need to see config for things like min withdrawal amounts
app.get('/api/config', async (req, res) => {
  try {
    // Always try to get the latest from persistent storage first
    const persistedConfig = await cache.get(CONFIG_PERSISTENT_KEY);
    if (persistedConfig) {
      // Update in-memory config with persisted version
      gameConfig = { ...DEFAULT_CONFIG, ...persistedConfig };
    }

    // Config requested

    res.json({
      success: true,
      data: gameConfig,
      cached: false
    });
  } catch (error) {
    console.error('❌ Error getting config:', error.message);
    // Fallback to in-memory config
    res.json({
      success: true,
      data: gameConfig,
      cached: false
    });
  }
});

// Update game configuration - ADMIN ONLY endpoint
app.post('/api/config', authenticateAPI, validateConfigUpdate, handleValidationErrors, async (req, res) => {
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
  
  // Persist config to Redis (no TTL for permanent storage)
  try {
    await cache.set(CONFIG_PERSISTENT_KEY, gameConfig, 0);
    // Config persisted to Redis
  } catch (error) {
    console.error('❌ Failed to persist config:', error);
  }
  
  // Also set in cache for faster access
  await cache.set(CONFIG_CACHE_KEY, gameConfig, CONFIG_CACHE_TTL);
  
  // Configuration updated
  
  res.json({
    success: true,
    data: gameConfig
  });
});

// Remove game configuration - ADMIN ONLY endpoint
app.delete('/api/config', authenticateAPI, async (req, res) => {
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
  
  // Clear both cache and persistent storage
  await cache.del(CONFIG_CACHE_KEY);
  await cache.del(CONFIG_PERSISTENT_KEY);
  
  // Configuration removed and cache cleared
  
  res.json({
    success: true,
    data: gameConfig
  });
});

// ====================
// Static File Serving
// ====================

// Serve static files from the dist directory
const distPath = path.join(__dirname, '..', 'dist');

// Check if dist directory exists
if (fs.existsSync(distPath)) {
  // Serve static files
  app.use(express.static(distPath, {
    maxAge: '1d',
    setHeaders: (res, path) => {
      if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
    }
  }));

  // IP check endpoint (must be before catch-all)
  app.get('/check-ip', (req, res) => {
    const ip = req.headers['x-real-ip'] || 
           req.headers['x-forwarded-for']?.split(',')[0].trim() || 
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           req.ip;
    const clientIp = ip?.replace(/^::ffff:/, '') || 'unknown';
    
    const headers = {
      'x-real-ip': req.headers['x-real-ip'],
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'host': req.headers['host'],
      'connection-remoteAddress': req.connection?.remoteAddress,
      'socket-remoteAddress': req.socket?.remoteAddress,
      'req-ip': req.ip
    };
    
    res.json({
      yourIp: clientIp,
      headers: headers,
      trustProxy: app.get('trust proxy'),
      rateLimits: {
        general: '1000 requests per 15 minutes',
        config: '100 requests per minute'
      }
    });
  });
  
  // Serve index.html for all non-API routes (SPA support)
  app.get('*', (req, res) => {
    // Skip API routes and check-ip
    if (req.path.startsWith('/api') || req.path === '/check-ip') {
      return res.status(404).json({ error: 'Not found' });
    }
    
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Development mode - no static files
  app.get('/', (req, res) => {
    res.json({
      message: 'Island Bitcoin Server',
      mode: 'development',
      hint: 'Run "npm run build" to create production files',
      endpoints: {
        health: '/api/health',
        config: '/api/config (requires auth)'
      }
    });
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Island Bitcoin Unified Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`⚙️  Config API: http://localhost:${PORT}/api/config`);
  console.log(`🚦 Rate limits: Disabled`);
  
  if (fs.existsSync(distPath)) {
    console.log(`🌐 Serving frontend from: ${distPath}`);
    console.log(`🏠 Homepage: http://localhost:${PORT}`);
  } else {
    console.log(`⚠️  No dist directory found - API only mode`);
    console.log(`   Run "npm run build" in the root directory to build frontend`);
  }
});