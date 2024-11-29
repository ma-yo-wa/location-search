const { Op } = require("sequelize");
const db = require("../models");
const {
  calculateGeohashScore,
  calculateTextScore,
} = require("../utils/geohash");
const geohash = require("ngeohash");

const Location = db.Location;

class LocationService {
    calculateHaversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the earth in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) *
            Math.cos(this.toRadians(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in km
        return distance;
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    async searchLocations({ searchText, latitude, longitude }) {
        try {
            // Input validation
            if (latitude && (latitude < -90 || latitude > 90)) {
                throw new Error('Invalid latitude. Must be between -90 and 90');
            }
            if (longitude && (longitude < -180 || longitude > 180)) {
                throw new Error('Invalid longitude. Must be between -180 and 180');
            }
    
            // Case 1: Exact coordinates
            if (latitude && longitude) {
                const exactMatch = await Location.findOne({
                    where: {
                        latitude: latitude,
                        longitude: longitude
                    }
                });
    
                if (exactMatch) {
                    return {
                        success: true,
                        results: [{
                            ...exactMatch.toJSON(),
                            score: 1.00
                        }]
                    };
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
            if (searchText?.trim() && latitude && longitude) {
                console.log('Searching with text and coordinates:', searchText.trim());
                const matches = await Location.findAll({
                    where: textSearchCondition
                });
    
                const results = matches.map(location => {
                    const textScore = calculateTextScore(searchText, location);
                    const haversineDistance = this.calculateHaversineDistance(
                        latitude,
                        longitude,
                        location.latitude,
                        location.longitude
                    );
                    const haversineScore = 1 - (haversineDistance / 40075); // Arbitrary scaling, adjust as needed
                    return {
                        ...location.toJSON(),
                        score: Number(((0.6 * textScore) + (0.4 * haversineScore)).toFixed(2))
                    };
                }).sort((a, b) => b.score - a.score);
    
                return {
                    success: true,
                    results
                };
            }
    
            // Case 3: Text search only
            if (searchText?.trim()) {
                const matches = await Location.findAll({
                    where: textSearchCondition
                });
    
                return {
                    success: true,
                    results: matches.map(location => ({
                        ...location.toJSON(),
                        score: Number(calculateTextScore(searchText, location).toFixed(2))
                    })).sort((a, b) => b.score - a.score)
                };
            }
    
            // Case 4: Coordinates only
            if (latitude && longitude) {
                console.log('Searching with coordinates only:', latitude, longitude);
                const searchGeohash = geohash.encode(latitude, longitude, 2);
                const matches = await Location.findAll({
                    where: {
                        geohash: {
                            [Op.like]: `${searchGeohash}%`
                        }
                    }
                });
    
                const results = matches.map(location => ({
                    ...location.toJSON(),
                    score: Number(calculateGeohashScore(searchGeohash, location.geohash).toFixed(2))
                }))
                .filter(location => location.score > 0.1)
                .sort((a, b) => b.score - a.score)
                .slice(0, 10);
    
                return {
                    success: true,
                    results
                };
            }
    
            return {
                success: true,
                results: []
            };
    
        } catch (error) {
            console.error('Search error:', error);
            return {
                success: false,
                error: error.message || 'An error occurred during search'
            };
        }
    }
}

module.exports = new LocationService();
