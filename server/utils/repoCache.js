const cache = new Map();

export const setCachedRepo = (key, data) => {
  cache.set(key.toLowerCase(), {
    data,
    timestamp: Date.now()
  });
};

export const getCachedRepo = (key) => {
  const item = cache.get(key.toLowerCase());
  if (!item) return null;
  // Cache valid for 30 minutes
  if (Date.now() - item.timestamp > 30 * 60 * 1000) {
    cache.delete(key.toLowerCase());
    return null;
  }
  return item.data;
};

export const clearCache = () => {
  cache.clear();
};
