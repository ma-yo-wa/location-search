const { Op } = require("sequelize");
const db = require("../models");
const {
  calculateGeohashScore,
  calculateTextScore,
} = require("../utils/geohash");
const geohash = require("ngeohash");

const sequelize = require('../config/database');

const checkConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection still alive during search');
    } catch (err) {
        console.error('Connection lost during search:', err);
    }
};

const Location = db.Location;

class LocationService {
    async searchLocations({ searchText, latitude, longitude }) {
        try {
            // Input validation
            if (latitude && (latitude < -90 || latitude > 90)) {
                throw new Error('Invalid latitude. Must be between -90 and 90');
            }
            if (longitude && (longitude < -180 || longitude > 180)) {
                throw new Error('Invalid longitude. Must be between -180 and 180');
            }

            console.log('Total locations in database:', await Location.count());

            // Case 1: Exact coordinates
            if (latitude && longitude) {
                const searchGeohash = geohash.encode(latitude, longitude);
                const exactMatch = await Location.findOne({
                    where: { geohash: searchGeohash }
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
                const searchGeohash = geohash.encode(latitude, longitude);
                const matches = await Location.findAll({
                    where: textSearchCondition
                });

                console.log('Found matches:', matches.length);

                const results = matches.map(location => {
                    const textScore = calculateTextScore(searchText, location);
                    const geoScore = calculateGeohashScore(searchGeohash, location.geohash);
                    return {
                        ...location.toJSON(),
                        score: Number(((0.6 * textScore) + (0.4 * geoScore)).toFixed(2))
                    };
                }).sort((a, b) => b.score - a.score);

                return {
                    success: true,
                    results
                };
            }

            // Case 3: Text search only
            if (searchText?.trim()) {
                console.log('Searching with text only:', searchText.trim());
                const matches = await Location.findAll({
                    where: textSearchCondition
                });

                console.log('Found matches:', matches.length);

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
                const searchGeohash = geohash.encode(latitude, longitude);
                const matches = await Location.findAll();

                const results = matches
                    .map(location => ({
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
