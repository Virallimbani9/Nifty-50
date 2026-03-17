const NodeCache = require('node-cache');

// Cache configuration
const cache = new NodeCache({ 
  stdTTL: 30,           // Default TTL: 30 seconds
  checkperiod: 10,      // Check for expired keys every 10 seconds
  useClones: false      // Don't clone data for better performance
});

// Cache keys
const CACHE_KEYS = {
  CONSTITUENTS: 'constituents',
  INDEX: 'index',
  GAINERS_LOSERS: 'gainers-losers',
  stock: (symbol) => `stock_${symbol}`
};

// Cache wrapper functions
const getCached = (key) => cache.get(key);
const setCached = (key, value, ttl = 30) => cache.set(key, value, ttl);
const delCached = (key) => cache.del(key);
const flushCache = () => cache.flushAll();

module.exports = {
  cache,
  CACHE_KEYS,
  getCached,
  setCached,
  delCached,
  flushCache
};