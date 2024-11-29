const LocationService = require('../../services/locationService');
const { Location } = require('../../models');
const { calculateHaversineDistance } = require('../../utils/geolocationUtils');
const { cache } = require('../../utils/cache');

// Mock the models
jest.mock('../../models', () => ({
  Location: {
    findOne: jest.fn(),
    findAll: jest.fn()
  }
}));

describe('LocationService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    cache.flushAll(); // Clear cache before each test
  });

  describe('searchLocations', () => {
    it('should return exact match when coordinates match exactly', async () => {
      const mockLocation = {
        id: 1,
        latitude: 40.7128,
        longitude: -74.0060,
        toJSON: () => ({
          id: 1,
          latitude: 40.7128,
          longitude: -74.0060
        })
      };

      Location.findOne.mockResolvedValue(mockLocation);

      const result = await LocationService.searchLocations({
        latitude: 40.7128,
        longitude: -74.0060
      });

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].score).toBe(1.00);
    });

    it('should handle text search with coordinates', async () => {
      const mockLocations = [
        {
          id: 1,
          city: 'New York',
          country: 'USA',
          latitude: 40.7128,
          longitude: -74.0060,
          toJSON: () => ({
            id: 1,
            city: 'New York',
            country: 'USA',
            latitude: 40.7128,
            longitude: -74.0060
          })
        }
      ];

      Location.findAll.mockResolvedValue(mockLocations);

      const result = await LocationService.searchLocations({
        searchText: 'New York',
        latitude: 40.7128,
        longitude: -74.0060
      });

      expect(result.success).toBe(true);
      expect(result.results).toBeDefined();
      expect(result.results[0].score).toBeLessThanOrEqual(1);
    });

    it('should handle invalid latitude', async () => {
      const result = await LocationService.searchLocations({
        latitude: 91,
        longitude: 0
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid latitude. Must be between -90 and 90');
    });

    it('should handle invalid longitude', async () => {
      const result = await LocationService.searchLocations({
        latitude: 0,
        longitude: 181
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid longitude. Must be between -180 and 180');
    });
  });

  describe('caching', () => {
    it('should return cached results for identical queries', async () => {
      const mockLocation = {
        id: 1,
        latitude: 40.7128,
        longitude: -74.0060,
        toJSON: () => ({
          id: 1,
          latitude: 40.7128,
          longitude: -74.0060
        })
      };

      Location.findOne.mockResolvedValue(mockLocation);

      // First call - should hit database
      const result1 = await LocationService.searchLocations({
        latitude: 40.7128,
        longitude: -74.0060
      });

      // Second call - should use cache
      const result2 = await LocationService.searchLocations({
        latitude: 40.7128,
        longitude: -74.0060
      });

      expect(Location.findOne).toHaveBeenCalledTimes(1); // Database queried only once
      expect(result1).toEqual(result2);
    });

    it('should clear cache when clearCache is called', async () => {
      const mockLocation = {
        id: 1,
        latitude: 40.7128,
        longitude: -74.0060,
        toJSON: () => ({
          id: 1,
          latitude: 40.7128,
          longitude: -74.0060
        })
      };

      Location.findOne.mockResolvedValue(mockLocation);

      // First call
      await LocationService.searchLocations({
        latitude: 40.7128,
        longitude: -74.0060
      });

      LocationService.clearCache();

      // Second call after cache clear
      await LocationService.searchLocations({
        latitude: 40.7128,
        longitude: -74.0060
      });

      expect(Location.findOne).toHaveBeenCalledTimes(2); // Database queried twice
    });
  });
});
