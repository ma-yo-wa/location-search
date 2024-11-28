const geohash = require("ngeohash");

const calculateGeohashScore = (searchGeohash, locationGeohash) => {
  // Exact match
  if (searchGeohash === locationGeohash) {
    return 1.0;
  }

  // Compare geohash prefixes for proximity
  const minLength = Math.min(searchGeohash.length, locationGeohash.length);
  let matchingChars = 0;

  for (let i = 0; i < minLength; i++) {
    if (searchGeohash[i] !== locationGeohash[i]) break;
    matchingChars++;
  }

  return Math.max(0.1, (matchingChars / 4) * 0.8);
};

const calculateTextScore = (searchText, location) => {
  const query = searchText.toLowerCase().trim();
  let maxScore = 0;

  const weights = {
    zip_code: 0.4,
    country: 0.25,
    city: 0.15,
    county: 0.15,
    street: 0.05,
  };

  const getMatchRatio = (query, fieldValue) => {
    if (query === fieldValue) return 1;
    
    // Calculate what percentage of the field matches the query
    if (fieldValue.includes(query)) {
        return query.length / fieldValue.length;
    }

    return 0;
};


  Object.entries(weights).forEach(([field, weight]) => {
    const fieldValue = location[field]?.toLowerCase() || "";
    const ratio = getMatchRatio(query, fieldValue);
    maxScore = Math.max(maxScore, weight * ratio);
  });

  return Number(maxScore.toFixed(2));
};

module.exports = {
  calculateGeohashScore,
  calculateTextScore,
};
