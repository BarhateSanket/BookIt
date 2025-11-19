const Redis = require('ioredis');

class CacheManager {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.defaultTTL = 3600; // 1 hour default
    this.initializeRedis();
  }

  // Initialize Redis connection
  initializeRedis() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.redis = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        reconnectOnError: (err) => {
          console.log('Redis reconnect on error:', err.message);
          return err.message.includes('READONLY');
        }
      });

      this.redis.on('connect', () => {
        console.log('Redis connected successfully');
        this.isConnected = true;
      });

      this.redis.on('error', (err) => {
        console.error('Redis connection error:', err.message);
        this.isConnected = false;
      });

      this.redis.on('ready', () => {
        console.log('Redis is ready to receive commands');
        this.isConnected = true;
      });

      this.redis.on('close', () => {
        console.log('Redis connection closed');
        this.isConnected = false;
      });

    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      this.isConnected = false;
    }
  }

  // Generic cache operations
  async get(key) {
    try {
      if (!this.isConnected) return null;
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (!this.isConnected) return false;
      const serializedValue = JSON.stringify(value);
      await this.redis.setex(key, ttl, serializedValue);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async del(key) {
    try {
      if (!this.isConnected) return false;
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async exists(key) {
    try {
      if (!this.isConnected) return false;
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  // Cached function wrapper
  async cachedFunction(key, fn, ttl = this.defaultTTL, forceRefresh = false) {
    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = await this.get(key);
        if (cached !== null) {
          return { data: cached, fromCache: true };
        }
      }

      // Execute function
      const result = await fn();

      // Cache result
      await this.set(key, result, ttl);

      return { data: result, fromCache: false };
    } catch (error) {
      console.error('Cached function error:', error);
      throw error;
    }
  }

  // Cache key generators
  generateKey(prefix, ...params) {
    return `${prefix}:${params.join(':')}`;
  }

  // Experience-specific caching
  async getExperiencesCache(filters = {}) {
    const key = this.generateKey('experiences', JSON.stringify(filters));
    return this.cachedFunction(key, async () => {
      const Experience = require('../models/Experience');
      return await Experience.getOptimizedExperiences(filters);
    }, 1800); // 30 minutes
  }

  async getExperienceByIdCache(experienceId) {
    const key = this.generateKey('experience', experienceId);
    return this.cachedFunction(key, async () => {
      const Experience = require('../models/Experience');
      return await Experience.findById(experienceId);
    }, 3600); // 1 hour
  }

  async invalidateExperienceCache(experienceId = null) {
    try {
      if (experienceId) {
        // Invalidate specific experience
        await this.del(this.generateKey('experience', experienceId));
      } else {
        // Invalidate all experience caches (use pattern matching)
        const keys = await this.redis.keys('experiences:*');
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }
    } catch (error) {
      console.error('Error invalidating experience cache:', error);
    }
  }

  // User-specific caching
  async getUserCache(userId) {
    const key = this.generateKey('user', userId);
    return this.cachedFunction(key, async () => {
      const User = require('../models/User');
      return await User.findById(userId).populate('organization');
    }, 1800); // 30 minutes
  }

  async invalidateUserCache(userId) {
    await this.del(this.generateKey('user', userId));
  }

  // Analytics caching
  async getAnalyticsCache(type, timeframe) {
    const key = this.generateKey('analytics', type, timeframe);
    return this.cachedFunction(key, async () => {
      const analyticsEngine = require('./analytics');
      switch (type) {
        case 'clv':
          return await analyticsEngine.calculateCLV();
        case 'funnel':
          return await analyticsEngine.calculateConversionFunnel(timeframe);
        case 'business-intelligence':
          return await analyticsEngine.getBusinessIntelligence(timeframe);
        case 'performance':
          return await analyticsEngine.getPerformanceMetrics(timeframe);
        default:
          return null;
      }
    }, 900); // 15 minutes for analytics
  }

  // Recommendation caching
  async getRecommendationsCache(userId, type = 'personalized') {
    const key = this.generateKey('recommendations', userId, type);
    return this.cachedFunction(key, async () => {
      const recommendationEngine = require('./recommendationEngine');
      return await recommendationEngine.getPersonalizedRecommendations(userId);
    }, 1800); // 30 minutes
  }

  async invalidateRecommendationsCache(userId) {
    const keys = await this.redis.keys(`recommendations:${userId}:*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // Search caching
  async getSearchCache(query, filters = {}) {
    const key = this.generateKey('search', query, JSON.stringify(filters));
    return this.cachedFunction(key, async () => {
      const Experience = require('../models/Experience');
      return await Experience.getOptimizedExperiences({
        search: query,
        ...filters
      });
    }, 600); // 10 minutes for search results
  }

  // Session caching
  async getSessionCache(sessionId) {
    const key = this.generateKey('session', sessionId);
    return await this.get(key);
  }

  async setSessionCache(sessionId, data, ttl = 86400) { // 24 hours
    const key = this.generateKey('session', sessionId);
    return await this.set(key, data, ttl);
  }

  async invalidateSessionCache(sessionId) {
    const key = this.generateKey('session', sessionId);
    return await this.del(key);
  }

  // Rate limiting with Redis
  async checkRateLimit(identifier, action, maxRequests = 100, windowMs = 900000) { // 15 minutes default
    const key = `ratelimit:${action}:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      // Remove old requests outside the window
      await this.redis.zremrangebyscore(key, 0, windowStart);

      // Count current requests in window
      const requestCount = await this.redis.zcard(key);

      if (requestCount >= maxRequests) {
        // Get reset time
        const oldestRequest = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
        const resetTime = oldestRequest.length > 0 ? parseInt(oldestRequest[1]) + windowMs : now + windowMs;

        return {
          allowed: false,
          remaining: 0,
          resetTime: new Date(resetTime),
          retryAfter: Math.ceil((resetTime - now) / 1000)
        };
      }

      // Add current request
      await this.redis.zadd(key, now, now.toString());

      // Set expiry on the key
      await this.redis.expire(key, Math.ceil(windowMs / 1000));

      return {
        allowed: true,
        remaining: maxRequests - requestCount - 1,
        resetTime: new Date(now + windowMs)
      };

    } catch (error) {
      console.error('Rate limit check error:', error);
      // Allow request on Redis failure
      return { allowed: true, remaining: maxRequests, resetTime: new Date(now + windowMs) };
    }
  }

  // Cache warming (pre-populate cache with frequently accessed data)
  async warmCache() {
    try {
      console.log('Starting cache warming...');

      // Warm up popular experiences
      const Experience = require('../models/Experience');
      const popularExperiences = await Experience.find({ isActive: true })
        .sort({ rating: -1 })
        .limit(20);

      for (const exp of popularExperiences) {
        await this.getExperienceByIdCache(exp._id.toString());
      }

      // Warm up search results for common queries
      const commonSearches = ['adventure', 'food', 'art', 'sports'];
      for (const query of commonSearches) {
        await this.getSearchCache(query);
      }

      console.log('Cache warming completed');
    } catch (error) {
      console.error('Cache warming error:', error);
    }
  }

  // Cache statistics
  async getStats() {
    try {
      if (!this.isConnected) {
        return { connected: false };
      }

      const info = await this.redis.info();
      const keys = await this.redis.keys('*');

      const stats = {
        connected: true,
        totalKeys: keys.length,
        memory: this.parseRedisInfo(info, 'memory'),
        cpu: this.parseRedisInfo(info, 'cpu'),
        connections: this.parseRedisInfo(info, 'clients'),
        hitRate: 'N/A' // Would need additional tracking
      };

      return stats;
    } catch (error) {
      console.error('Cache stats error:', error);
      return { connected: false, error: error.message };
    }
  }

  parseRedisInfo(info, section) {
    const lines = info.split('\n');
    const sectionData = {};

    let inSection = false;
    for (const line of lines) {
      if (line.startsWith(`# ${section}`)) {
        inSection = true;
      } else if (line.startsWith('#') && inSection) {
        break;
      } else if (inSection && line.includes(':')) {
        const [key, value] = line.split(':');
        sectionData[key] = value;
      }
    }

    return sectionData;
  }

  // Graceful shutdown
  async close() {
    if (this.redis) {
      await this.redis.quit();
      console.log('Redis connection closed');
    }
  }
}

module.exports = new CacheManager();