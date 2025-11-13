const fs = require('fs');
const path = require('path');
const os = require('os');
const history = require('../../src/core/history');
const storage = require('../../src/core/storage');

// Use a temporary test directory
const TEST_STORAGE_DIR = path.join(os.tmpdir(), '.api-ex-test-history-' + Date.now());

describe('History Module', () => {
  beforeAll(() => {
    storage.setStorageDir(TEST_STORAGE_DIR);
  });

  beforeEach(() => {
    // Clean up test directory before each test
    if (fs.existsSync(TEST_STORAGE_DIR)) {
      fs.rmSync(TEST_STORAGE_DIR, { recursive: true, force: true });
    }
    // Initialize storage to create directory and files
    storage.initStorage();
  });

  afterAll(() => {
    if (fs.existsSync(TEST_STORAGE_DIR)) {
      fs.rmSync(TEST_STORAGE_DIR, { recursive: true, force: true });
    }
  });

  describe('recordHistory()', () => {
    it('should record a history entry', () => {
      const entry = {
        method: 'GET',
        url: 'http://example.com/api',
        status: 200,
        durationMs: 150
      };

      history.recordHistory(entry);

      const historyEntries = history.getHistory({ limit: 100 });
      expect(historyEntries.length).toBe(1);
      expect(historyEntries[0].method).toBe('GET');
      expect(historyEntries[0].url).toBe('http://example.com/api');
      expect(historyEntries[0].status).toBe(200);
      expect(historyEntries[0].durationMs).toBe(150);
    });

    it('should add timestamp to entry', () => {
      const entry = {
        method: 'POST',
        url: 'http://example.com/api',
        status: 201,
        durationMs: 200
      };

      const beforeTime = new Date();
      history.recordHistory(entry);
      const afterTime = new Date();

      const historyEntries = history.getHistory({ limit: 100 });
      expect(historyEntries[0].timestamp).toBeDefined();

      const entryTime = new Date(historyEntries[0].timestamp);
      expect(entryTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(entryTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should record multiple entries', () => {
      const entries = [
        { method: 'GET', url: 'http://example.com/1', status: 200, durationMs: 100 },
        { method: 'POST', url: 'http://example.com/2', status: 201, durationMs: 150 },
        { method: 'PUT', url: 'http://example.com/3', status: 200, durationMs: 120 }
      ];

      entries.forEach(entry => history.recordHistory(entry));

      const historyEntries = history.getHistory({ limit: 100 });
      expect(historyEntries.length).toBe(3);
    });

    it('should persist entries to file', () => {
      const entry = {
        method: 'DELETE',
        url: 'http://example.com/api/resource',
        status: 204,
        durationMs: 80
      };

      history.recordHistory(entry);

      // Read directly from file
      const historyFile = storage.getHistoryFile();
      const fileData = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));

      expect(fileData.history.length).toBe(1);
      expect(fileData.history[0].method).toBe('DELETE');
      expect(fileData.history[0].status).toBe(204);
    });

    it('should record entry with optional environment field', () => {
      const entry = {
        method: 'GET',
        url: 'http://example.com/api',
        status: 200,
        durationMs: 100,
        env: 'dev'
      };

      history.recordHistory(entry);

      const historyEntries = history.getHistory({ limit: 100 });
      expect(historyEntries[0].env).toBe('dev');
    });

    it('should record entry with optional savedRequestName field', () => {
      const entry = {
        method: 'GET',
        url: 'http://example.com/api',
        status: 200,
        durationMs: 100,
        savedRequestName: 'my-saved-request'
      };

      history.recordHistory(entry);

      const historyEntries = history.getHistory({ limit: 100 });
      expect(historyEntries[0].savedRequestName).toBe('my-saved-request');
    });

    it('should record entry with all optional fields', () => {
      const entry = {
        method: 'POST',
        url: 'http://example.com/api',
        status: 201,
        durationMs: 250,
        env: 'staging',
        savedRequestName: 'create-user'
      };

      history.recordHistory(entry);

      const historyEntries = history.getHistory({ limit: 100 });
      expect(historyEntries[0]).toMatchObject({
        method: 'POST',
        url: 'http://example.com/api',
        status: 201,
        durationMs: 250,
        env: 'staging',
        savedRequestName: 'create-user'
      });
    });

    it('should throw error when entry is not provided', () => {
      expect(() => history.recordHistory()).toThrow('History entry is required');
    });

    it('should throw error when entry is null', () => {
      expect(() => history.recordHistory(null)).toThrow('History entry is required');
    });

    it('should handle entry with extra custom fields', () => {
      const entry = {
        method: 'GET',
        url: 'http://example.com/api',
        status: 200,
        durationMs: 100,
        customField: 'custom-value',
        anotherField: 123
      };

      history.recordHistory(entry);

      const historyEntries = history.getHistory({ limit: 100 });
      expect(historyEntries[0].customField).toBe('custom-value');
      expect(historyEntries[0].anotherField).toBe(123);
    });
  });

  describe('getHistory()', () => {
    it('should return empty array when no history exists', () => {
      const historyEntries = history.getHistory();

      expect(Array.isArray(historyEntries)).toBe(true);
      expect(historyEntries.length).toBe(0);
    });

    it('should retrieve history entries', () => {
      const entry = {
        method: 'GET',
        url: 'http://example.com/api',
        status: 200,
        durationMs: 100
      };

      history.recordHistory(entry);

      const historyEntries = history.getHistory();
      expect(historyEntries.length).toBe(1);
      expect(historyEntries[0].method).toBe('GET');
    });

    it('should use default limit of 10', () => {
      // Add 15 entries
      for (let i = 0; i < 15; i++) {
        history.recordHistory({
          method: 'GET',
          url: `http://example.com/api/${i}`,
          status: 200,
          durationMs: 100
        });
      }

      const historyEntries = history.getHistory();
      expect(historyEntries.length).toBe(10);
    });

    it('should respect custom limit', () => {
      // Add 20 entries
      for (let i = 0; i < 20; i++) {
        history.recordHistory({
          method: 'GET',
          url: `http://example.com/api/${i}`,
          status: 200,
          durationMs: 100
        });
      }

      const historyEntries = history.getHistory({ limit: 5 });
      expect(historyEntries.length).toBe(5);
    });

    it('should return all entries when limit is higher than total', () => {
      // Add 3 entries
      for (let i = 0; i < 3; i++) {
        history.recordHistory({
          method: 'GET',
          url: `http://example.com/api/${i}`,
          status: 200,
          durationMs: 100
        });
      }

      const historyEntries = history.getHistory({ limit: 100 });
      expect(historyEntries.length).toBe(3);
    });

    it('should sort history by timestamp descending (most recent first)', () => {
      // Add entries with small delays to ensure different timestamps
      history.recordHistory({
        method: 'GET',
        url: 'http://example.com/first',
        status: 200,
        durationMs: 100
      });

      // Wait a tiny bit
      const waitUntil = Date.now() + 5;
      while (Date.now() < waitUntil) {}

      history.recordHistory({
        method: 'GET',
        url: 'http://example.com/second',
        status: 200,
        durationMs: 100
      });

      // Wait a tiny bit
      const waitUntil2 = Date.now() + 5;
      while (Date.now() < waitUntil2) {}

      history.recordHistory({
        method: 'GET',
        url: 'http://example.com/third',
        status: 200,
        durationMs: 100
      });

      const historyEntries = history.getHistory({ limit: 100 });

      expect(historyEntries.length).toBe(3);
      expect(historyEntries[0].url).toBe('http://example.com/third'); // most recent
      expect(historyEntries[1].url).toBe('http://example.com/second');
      expect(historyEntries[2].url).toBe('http://example.com/first'); // oldest
    });

    it('should handle limit of 0', () => {
      history.recordHistory({
        method: 'GET',
        url: 'http://example.com/api',
        status: 200,
        durationMs: 100
      });

      const historyEntries = history.getHistory({ limit: 0 });
      expect(historyEntries.length).toBe(0);
    });

    it('should handle limit of 1', () => {
      history.recordHistory({
        method: 'GET',
        url: 'http://example.com/first',
        status: 200,
        durationMs: 100
      });

      history.recordHistory({
        method: 'GET',
        url: 'http://example.com/second',
        status: 200,
        durationMs: 100
      });

      const historyEntries = history.getHistory({ limit: 1 });
      expect(historyEntries.length).toBe(1);
      // Should be most recent
      expect(historyEntries[0].url).toContain('second');
    });

    it('should handle empty options object', () => {
      history.recordHistory({
        method: 'GET',
        url: 'http://example.com/api',
        status: 200,
        durationMs: 100
      });

      const historyEntries = history.getHistory({});
      expect(historyEntries.length).toBe(1);
    });

    it('should handle options with undefined limit', () => {
      // Add 15 entries
      for (let i = 0; i < 15; i++) {
        history.recordHistory({
          method: 'GET',
          url: `http://example.com/api/${i}`,
          status: 200,
          durationMs: 100
        });
      }

      const historyEntries = history.getHistory({ limit: undefined });
      expect(historyEntries.length).toBe(10); // Should use default
    });

    it('should preserve all entry fields in returned history', () => {
      const entry = {
        method: 'POST',
        url: 'http://example.com/api',
        status: 201,
        durationMs: 250,
        env: 'production',
        savedRequestName: 'important-request'
      };

      history.recordHistory(entry);

      const historyEntries = history.getHistory();
      const retrieved = historyEntries[0];

      expect(retrieved.method).toBe('POST');
      expect(retrieved.url).toBe('http://example.com/api');
      expect(retrieved.status).toBe(201);
      expect(retrieved.durationMs).toBe(250);
      expect(retrieved.env).toBe('production');
      expect(retrieved.savedRequestName).toBe('important-request');
      expect(retrieved.timestamp).toBeDefined();
    });
  });

  describe('Integration: recordHistory() and getHistory()', () => {
    it('should maintain history across multiple record and retrieval operations', () => {
      // Record some entries
      history.recordHistory({
        method: 'GET',
        url: 'http://example.com/1',
        status: 200,
        durationMs: 100
      });

      let retrieved = history.getHistory({ limit: 100 });
      expect(retrieved.length).toBe(1);

      // Record more
      history.recordHistory({
        method: 'POST',
        url: 'http://example.com/2',
        status: 201,
        durationMs: 150
      });

      history.recordHistory({
        method: 'DELETE',
        url: 'http://example.com/3',
        status: 204,
        durationMs: 80
      });

      retrieved = history.getHistory({ limit: 100 });
      expect(retrieved.length).toBe(3);
    });

    it('should handle recording different status codes', () => {
      const statusCodes = [200, 201, 204, 400, 401, 403, 404, 500, 502, 503];

      statusCodes.forEach((status, index) => {
        history.recordHistory({
          method: 'GET',
          url: `http://example.com/api/${index}`,
          status: status,
          durationMs: 100
        });
      });

      const historyEntries = history.getHistory({ limit: 100 });
      expect(historyEntries.length).toBe(10);

      // Check all status codes are present
      const retrievedStatuses = historyEntries.map(e => e.status).sort((a, b) => a - b);
      expect(retrievedStatuses).toEqual(statusCodes.sort((a, b) => a - b));
    });

    it('should handle recording different HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

      methods.forEach((method, index) => {
        history.recordHistory({
          method: method,
          url: `http://example.com/api/${index}`,
          status: 200,
          durationMs: 100
        });
      });

      const historyEntries = history.getHistory({ limit: 100 });
      expect(historyEntries.length).toBe(7);

      // Check all methods are present
      const retrievedMethods = historyEntries.map(e => e.method).sort();
      expect(retrievedMethods).toEqual(methods.sort());
    });

    it('should handle large history (100+ entries)', () => {
      // Record 150 entries
      for (let i = 0; i < 150; i++) {
        history.recordHistory({
          method: 'GET',
          url: `http://example.com/api/${i}`,
          status: 200,
          durationMs: 100 + i
        });
      }

      // Get with default limit
      let retrieved = history.getHistory();
      expect(retrieved.length).toBe(10);

      // Get all
      retrieved = history.getHistory({ limit: 200 });
      expect(retrieved.length).toBe(150);

      // Verify sorting - most recent should be last recorded
      expect(retrieved[0].url).toBe('http://example.com/api/149');
      expect(retrieved[149].url).toBe('http://example.com/api/0');
    });

    it('should create history file if it does not exist', () => {
      const historyFile = storage.getHistoryFile();

      // Delete history file if it exists
      if (fs.existsSync(historyFile)) {
        fs.unlinkSync(historyFile);
      }

      // Record entry should create file
      history.recordHistory({
        method: 'GET',
        url: 'http://example.com/api',
        status: 200,
        durationMs: 100
      });

      expect(fs.existsSync(historyFile)).toBe(true);

      const retrieved = history.getHistory();
      expect(retrieved.length).toBe(1);
    });
  });

  describe('Timestamp handling', () => {
    it('should use ISO 8601 format for timestamps', () => {
      history.recordHistory({
        method: 'GET',
        url: 'http://example.com/api',
        status: 200,
        durationMs: 100
      });

      const historyEntries = history.getHistory();
      const timestamp = historyEntries[0].timestamp;

      // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should create valid Date objects from timestamps', () => {
      history.recordHistory({
        method: 'GET',
        url: 'http://example.com/api',
        status: 200,
        durationMs: 100
      });

      const historyEntries = history.getHistory();
      const timestamp = historyEntries[0].timestamp;
      const date = new Date(timestamp);

      expect(date).toBeInstanceOf(Date);
      expect(isNaN(date.getTime())).toBe(false);
    });

    it('should have timestamps that increase with each entry', () => {
      for (let i = 0; i < 5; i++) {
        history.recordHistory({
          method: 'GET',
          url: `http://example.com/api/${i}`,
          status: 200,
          durationMs: 100
        });

        // Small delay between entries
        const waitUntil = Date.now() + 2;
        while (Date.now() < waitUntil) {}
      }

      const historyEntries = history.getHistory({ limit: 100 });

      // Extract timestamps and reverse (since they're sorted descending)
      const entryTimestamps = historyEntries.map(e => e.timestamp).reverse();

      // Each timestamp should be >= the previous one
      for (let i = 1; i < entryTimestamps.length; i++) {
        expect(entryTimestamps[i] >= entryTimestamps[i - 1]).toBe(true);
      }
    });
  });
});
