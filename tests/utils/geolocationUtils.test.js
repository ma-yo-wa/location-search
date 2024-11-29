const { calculateGeohashScore, calculateTextScore } = require('../../utils/geolocationUtils');

describe('Geohash Utils', () => {
  describe('calculateGeohashScore', () => {
    it('should return 1.0 for exact matches', () => {
      const score = calculateGeohashScore('abc123', 'abc123');
      expect(score).toBe(1.0);
    });

    it('should return partial score for partial matches', () => {
      const score = calculateGeohashScore('abc123', 'abc456');
      expect(score).toBeGreaterThan(0.1);
      expect(score).toBeLessThan(1.0);
    });
  });

  describe('calculateTextScore', () => {
    const mockLocation = {
      zip_code: '12345',
      country: 'USA',
      city: 'New York',
      county: 'Manhattan',
      street: 'Broadway'
    };

    it('should return high score for exact matches', () => {
      const score = calculateTextScore('USA', mockLocation);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should handle case-insensitive matching', () => {
      const score1 = calculateTextScore('USA', mockLocation);
      const score2 = calculateTextScore('usa', mockLocation);
      expect(score1).toBe(score2);
    });

    it('should return 0 for non-matching text', () => {
      const score = calculateTextScore('NonExistent', mockLocation);
      expect(score).toBe(0);
    });
  });
});
