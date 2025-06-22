import { createClient } from 'redis';

// Redis connection configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
const CACHE_TTL = process.env.CACHE_TTL || 300; // 5 minutes default

// Create Redis client
const redisClient = createClient({
  url: REDIS_URL,
  socket: {
    connectTimeout: 5000,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('❌ Redis reconnection attempts exhausted');
        return new Error('Too many retries');
      }
      // Exponential backoff with max 3 seconds
      return Math.min(retries * 100, 3000);
    }
  }
});

// Redis connection event handlers
redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('🔗 Redis Client Connected');
});

redisClient.on('ready', () => {
  console.log('✅ Redis Client Ready');
});

redisClient.on('reconnecting', () => {
  console.log('🔄 Redis Client Reconnecting...');
});

// Connect to Redis
async function connectRedis() {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error);
    // Don't throw - allow server to run without Redis
  }
}

// Cache wrapper functions
export const cache = {
  /**
   * Get value from cache
   */
  async get(key) {
    try {
      if (!redisClient.isOpen) return null;
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('❌ Redis GET error:', error);
      return null;
    }
  },

  /**
   * Set value in cache with TTL
   */
  async set(key, value, ttl = CACHE_TTL) {
    try {
      if (!redisClient.isOpen) return false;
      await redisClient.set(key, JSON.stringify(value), {
        EX: ttl
      });
      return true;
    } catch (error) {
      console.error('❌ Redis SET error:', error);
      return false;
    }
  },

  /**
   * Delete value from cache
   */
  async del(key) {
    try {
      if (!redisClient.isOpen) return false;
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('❌ Redis DEL error:', error);
      return false;
    }
  },

  /**
   * Clear all cache entries with a pattern
   */
  async clearPattern(pattern) {
    try {
      if (!redisClient.isOpen) return false;
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return true;
    } catch (error) {
      console.error('❌ Redis CLEAR error:', error);
      return false;
    }
  },

  /**
   * Check if Redis is connected
   */
  isConnected() {
    return redisClient.isOpen;
  }
};

// Initialize connection
connectRedis();

export default redisClient;