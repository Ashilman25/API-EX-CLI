const debug = require('../../src/core/debug');

describe('Debug Module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset debug mode before each test
    debug.setDebugMode(false);
    // Reset environment
    process.env = { ...originalEnv };
    delete process.env.API_EX_DEBUG;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('setDebugMode()', () => {
    it('should enable debug mode when called with true', () => {
      debug.setDebugMode(true);
      expect(debug.isDebugMode()).toBe(true);
    });

    it('should disable debug mode when called with false', () => {
      debug.setDebugMode(true);
      debug.setDebugMode(false);
      expect(debug.isDebugMode()).toBe(false);
    });

    it('should handle multiple toggles', () => {
      debug.setDebugMode(true);
      expect(debug.isDebugMode()).toBe(true);

      debug.setDebugMode(false);
      expect(debug.isDebugMode()).toBe(false);

      debug.setDebugMode(true);
      expect(debug.isDebugMode()).toBe(true);
    });
  });

  describe('isDebugMode()', () => {
    it('should return false by default', () => {
      expect(debug.isDebugMode()).toBe(false);
    });

    it('should return true when debug mode is set programmatically', () => {
      debug.setDebugMode(true);
      expect(debug.isDebugMode()).toBe(true);
    });

    it('should return true when API_EX_DEBUG environment variable is set to 1', () => {
      process.env.API_EX_DEBUG = '1';
      expect(debug.isDebugMode()).toBe(true);
    });

    it('should return false when API_EX_DEBUG is set to 0', () => {
      process.env.API_EX_DEBUG = '0';
      expect(debug.isDebugMode()).toBe(false);
    });

    it('should return false when API_EX_DEBUG is set to any non-1 value', () => {
      process.env.API_EX_DEBUG = 'true';
      expect(debug.isDebugMode()).toBe(false);

      process.env.API_EX_DEBUG = 'yes';
      expect(debug.isDebugMode()).toBe(false);

      process.env.API_EX_DEBUG = '';
      expect(debug.isDebugMode()).toBe(false);
    });

    it('should return true if either programmatic or env var is set', () => {
      // Only env var
      process.env.API_EX_DEBUG = '1';
      expect(debug.isDebugMode()).toBe(true);

      // Only programmatic
      delete process.env.API_EX_DEBUG;
      debug.setDebugMode(true);
      expect(debug.isDebugMode()).toBe(true);

      // Both
      process.env.API_EX_DEBUG = '1';
      debug.setDebugMode(true);
      expect(debug.isDebugMode()).toBe(true);
    });

    it('should prioritize env var even if programmatic is false', () => {
      debug.setDebugMode(false);
      process.env.API_EX_DEBUG = '1';
      expect(debug.isDebugMode()).toBe(true);
    });
  });

  describe('Module exports', () => {
    it('should export setDebugMode function', () => {
      expect(typeof debug.setDebugMode).toBe('function');
    });

    it('should export isDebugMode function', () => {
      expect(typeof debug.isDebugMode).toBe('function');
    });
  });
});
