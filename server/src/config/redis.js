const Redis = require('ioredis');
const config = require('./env');

class MemoryCacheFallback {
  constructor() {
    this.store = new Map();
    console.log('[Cache] Using In-Memory Fallback Cache (Redis connection disabled/unavailable)');
  }

  async get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key, value, mode, ttlSeconds) {
    let expiresAt = null;
    if (mode === 'EX' && ttlSeconds) {
      expiresAt = Date.now() + ttlSeconds * 1000;
    }
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(key) {
    return this.store.delete(key) ? 1 : 0;
  }
}

let redisClient;
let isRedisConnected = false;
const memoryFallback = new MemoryCacheFallback();

try {
  redisClient = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) {
        console.warn('[Redis] Connection retries exhausted. Falling back to in-memory cache.');
        return null; // Stop retrying and fall back gracefully
      }
      return Math.min(times * 200, 1000);
    },
    lazyConnect: true,
  });

  redisClient.on('connect', () => {
    isRedisConnected = true;
    console.log('[Redis] Connected successfully to Redis Cache');
  });

  redisClient.on('error', (err) => {
    isRedisConnected = false;
    console.warn('[Redis] Redis error, using in-memory cache fallback:', err.message);
  });

  // Attempt connection asynchronously
  redisClient.connect().catch((err) => {
    isRedisConnected = false;
    console.warn('[Redis] Unable to connect to Redis server, using in-memory fallback:', err.message);
  });
} catch (error) {
  isRedisConnected = false;
  console.warn('[Redis] Initialization failed, using in-memory fallback:', error.message);
}

const getCache = async (key) => {
  try {
    if (isRedisConnected && redisClient.status === 'ready') {
      return await redisClient.get(key);
    }
  } catch (err) {
    console.warn(`[Cache GET Error for key ${key}]:`, err.message);
  }
  return await memoryFallback.get(key);
};

const setCache = async (key, value, ttlSeconds = 86400) => {
  try {
    if (isRedisConnected && redisClient.status === 'ready') {
      await redisClient.set(key, value, 'EX', ttlSeconds);
      return;
    }
  } catch (err) {
    console.warn(`[Cache SET Error for key ${key}]:`, err.message);
  }
  await memoryFallback.set(key, value, 'EX', ttlSeconds);
};

const deleteCache = async (key) => {
  try {
    if (isRedisConnected && redisClient.status === 'ready') {
      await redisClient.del(key);
      return;
    }
  } catch (err) {
    console.warn(`[Cache DEL Error for key ${key}]:`, err.message);
  }
  await memoryFallback.del(key);
};

module.exports = {
  getCache,
  setCache,
  deleteCache,
  isRedisConnected: () => isRedisConnected,
};
