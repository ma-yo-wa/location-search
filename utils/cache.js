const NodeCache = require('node-cache');

// Cache will expire after 1 hour, and check for expired entries every 10 minutes
const cache = new NodeCache({
  stdTTL: 3600, // Time to live in seconds (1 hour)
  checkperiod: 600, // Check for expired keys every 10 minutes
  useClones: false // Store references instead of copying data
});

const generateCacheKey = (params) => {
  const { searchText, latitude, longitude } = params;
  // Create a unique key based on search parameters
  return `search:${searchText || ''}:${latitude || ''}:${longitude || ''}`;
};

module.exports = {
  cache,
  generateCacheKey
};
