// cache.js
const cache = new Map();

function setCache(key, value, ttl = 60 * 1000 * 10) {
  const expireAt = Date.now() + ttl;
  cache.set(key, { value, expireAt });
}

function getCache(key) {
  const cached = cache.get(key);
  if (!cached) return null;
  if (Date.now() > cached.expireAt) {
    cache.delete(key);
    return null;
  }
  return cached.value;
}

module.exports = { setCache, getCache };