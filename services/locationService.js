const { Op } = require("sequelize");
const db = require("../models");
const {
  calculateGeohashScore,
  calculateTextScore,
  calculateHaversineDistance
} = require("../utils/geolocationUtils");
const { cache, generateCacheKey } = require("../utils/cache");
const geohash = require("ngeohash");

const Location = db.Location;

class LocationService {
    async searchLocations({ searchText, latitude, longitude, page = 1, limit = 10 }) {
        try {
            // Generate cache key and check cache
            const cacheKey = generateCacheKey({ searchText, latitude, longitude, page, limit });
            const cachedResult = cache.get(cacheKey);
            
            if (cachedResult) {
                console.log('Cache hit for:', cacheKey);
                return cachedResult;
            }

            console.log('Cache miss for:', cacheKey);

            // Input validation
            if (latitude && (latitude < -90 || latitude > 90)) {
                throw new Error('Invalid latitude. Must be between -90 and 90');
            }
            if (longitude && (longitude < -180 || longitude > 180)) {
                throw new Error('Invalid longitude. Must be between -180 and 180');
            }

            let result;

            // Case 1: Exact coordinates
            if (latitude && longitude) {
                const exactMatch = await Location.findOne({
                    where: { latitude, longitude }
                });

                if (exactMatch) {
                    result = {
                        success: true,
                        results: [{
                            ...exactMatch.toJSON(),
                            score: 1.00
                        }],
                        meta: {
                            page: 1,
                            limit: 1,
                            total: 1
                        }
                    };
                    cache.set(cacheKey, result);
                    return result;
                }
            }

            // Build text search condition
            const textSearchCondition = searchText?.trim() ? {
                [Op.or]: [
                    { city: { [Op.iLike]: `%${searchText.trim()}%` }},
                    { country: { [Op.iLike]: `%${searchText.trim()}%` }},
                    { county: { [Op.iLike]: `%${searchText.trim()}%` }},
                    { street: { [Op.iLike]: `%${searchText.trim()}%` }},
                    { zip_code: { [Op.iLike]: `%${searchText.trim()}%` }}
                ]
            } : {};
            // Case 2: Text search with coordinates
            if (searchText?.trim()) {
                const matches = await Location.findAndCountAll({
                    where: textSearchCondition,
                    limit: limit,
                    offset: (page - 1) * limit
                });

                result = {
                    success: true,
                    results: matches.rows.map(location => ({
                        ...location.toJSON(),
                        score: Number(calculateTextScore(searchText, location).toFixed(2))
                    })).sort((a, b) => b.score - a.score),
                    meta: {
                        page: page,
                        limit: limit,
                        total: matches.count
                    }
                };
            }
    
            // Case 3: Coordinates only
            if (latitude && longitude) {
                const searchGeohash = geohash.encode(latitude, longitude, 2);
                const matches = await Location.findAndCountAll({
                    where: {
                        geohash: {
                            [Op.like]: `${searchGeohash}%`
                        }
                    },
                    limit: limit,
                    offset: (page - 1) * limit
                });

                const results = matches.rows.map(location => ({
                    ...location.toJSON(),
                    score: Number(calculateGeohashScore(searchGeohash, location.geohash).toFixed(2))
                }))
                .filter(location => location.score > 0.1)
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);

                result = {
                    success: true,
                    results,
                    meta: {
                        page: page,
                        limit: limit,
                        total: matches.count
                    }
                };
            }
    
            return result;

        } catch (error) {
            console.error('Search error:', error);
            return {
                success: false,
                error: error.message || 'An error occurred during search'
            };
        }
    }

    clearCache() {
        cache.flushAll();
        console.log('Cache cleared');
    }
}

module.exports = new LocationService();
