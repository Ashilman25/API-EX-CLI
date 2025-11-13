const fs = require('fs');
const path = require('path');
const os = require('os');
const storage = require('../../src/core/storage');

// Use a temporary test directory
const TEST_STORAGE_DIR = path.join(os.tmpdir(), '.api-ex-test-' + Date.now());
const TEST_DATA_FILE = path.join(TEST_STORAGE_DIR, 'data.json');
const TEST_HISTORY_FILE = path.join(TEST_STORAGE_DIR, 'history.json');

describe('Storage Module', () => {
  // Configure storage to use test directory
  beforeAll(() => {
    storage.setStorageDir(TEST_STORAGE_DIR);
  });

  // Clean up test directory before each test
  beforeEach(() => {
    if (fs.existsSync(TEST_STORAGE_DIR)) {
      fs.rmSync(TEST_STORAGE_DIR, { recursive: true, force: true });
    }
  });

  // Clean up after all tests
  afterAll(() => {
    if (fs.existsSync(TEST_STORAGE_DIR)) {
      fs.rmSync(TEST_STORAGE_DIR, { recursive: true, force: true });
    }
  });

  describe('initStorage()', () => {
    it('should create storage directory if it does not exist', () => {
      expect(fs.existsSync(TEST_STORAGE_DIR)).toBe(false);

      storage.initStorage();

      expect(fs.existsSync(TEST_STORAGE_DIR)).toBe(true);
    });

    it('should initialize data.json with default structure', () => {
      storage.initStorage();

      expect(fs.existsSync(TEST_DATA_FILE)).toBe(true);

      const data = JSON.parse(fs.readFileSync(TEST_DATA_FILE, 'utf-8'));
      expect(data).toEqual({ requests: [], environments: {} });
    });

    it('should initialize history.json with default structure', () => {
      storage.initStorage();

      expect(fs.existsSync(TEST_HISTORY_FILE)).toBe(true);

      const history = JSON.parse(fs.readFileSync(TEST_HISTORY_FILE, 'utf-8'));
      expect(history).toEqual({ history: [] });
    });

    it('should return database instances', () => {
      const result = storage.initStorage();

      expect(result).toHaveProperty('dataDb');
      expect(result).toHaveProperty('historyDb');
      expect(result.dataDb.value()).toEqual({ requests: [], environments: {} });
      expect(result.historyDb.value()).toEqual({ history: [] });
    });

    it('should work if directory already exists', () => {
      fs.mkdirSync(TEST_STORAGE_DIR, { recursive: true });

      expect(() => storage.initStorage()).not.toThrow();
    });
  });

  describe('getRequests()', () => {
    it('should return empty array when no requests exist', () => {
      storage.initStorage();

      const requests = storage.getRequests();

      expect(Array.isArray(requests)).toBe(true);
      expect(requests.length).toBe(0);
    });

    it('should return all saved requests', () => {
      storage.initStorage();

      // Manually add requests to test file
      const testRequests = [
        { name: 'test1', method: 'GET', url: 'http://example.com' },
        { name: 'test2', method: 'POST', url: 'http://example.com/api' }
      ];

      const data = { requests: testRequests, environments: {} };
      fs.writeFileSync(TEST_DATA_FILE, JSON.stringify(data));

      const requests = storage.getRequests();

      expect(requests).toEqual(testRequests);
      expect(requests.length).toBe(2);
    });
  });

  describe('getRequestByName()', () => {
    beforeEach(() => {
      storage.initStorage();

      // Add some test requests
      storage.saveRequest({
        name: 'get-users',
        method: 'GET',
        url: 'http://api.example.com/users',
        headers: [],
        data: ''
      });

      storage.saveRequest({
        name: 'create-user',
        method: 'POST',
        url: 'http://api.example.com/users',
        headers: ['Content-Type: application/json'],
        data: '{"name":"test"}'
      });
    });

    it('should return request when it exists', () => {
      const request = storage.getRequestByName('get-users');

      expect(request).not.toBeNull();
      expect(request.name).toBe('get-users');
      expect(request.method).toBe('GET');
      expect(request.url).toBe('http://api.example.com/users');
    });

    it('should return null when request does not exist', () => {
      const request = storage.getRequestByName('non-existent');

      expect(request).toBeNull();
    });

    it('should find request by exact name match', () => {
      const request = storage.getRequestByName('create-user');

      expect(request).not.toBeNull();
      expect(request.name).toBe('create-user');
      expect(request.method).toBe('POST');
    });
  });

  describe('saveRequest()', () => {
    beforeEach(() => {
      storage.initStorage();
    });

    it('should save a new request', () => {
      const request = {
        name: 'test-request',
        method: 'GET',
        url: 'http://example.com',
        headers: [],
        data: ''
      };

      storage.saveRequest(request);

      const requests = storage.getRequests();
      expect(requests.length).toBe(1);
      expect(requests[0]).toEqual(request);
    });

    it('should save multiple requests', () => {
      storage.saveRequest({
        name: 'request1',
        method: 'GET',
        url: 'http://example.com/1'
      });

      storage.saveRequest({
        name: 'request2',
        method: 'POST',
        url: 'http://example.com/2'
      });

      const requests = storage.getRequests();
      expect(requests.length).toBe(2);
    });

    it('should overwrite existing request with same name', () => {
      const originalRequest = {
        name: 'test-request',
        method: 'GET',
        url: 'http://example.com',
        headers: [],
        data: ''
      };

      storage.saveRequest(originalRequest);

      const updatedRequest = {
        name: 'test-request',
        method: 'POST',
        url: 'http://example.com/updated',
        headers: ['Authorization: Bearer token'],
        data: '{"updated": true}'
      };

      storage.saveRequest(updatedRequest);

      const requests = storage.getRequests();
      expect(requests.length).toBe(1);
      expect(requests[0]).toEqual(updatedRequest);
      expect(requests[0].method).toBe('POST');
      expect(requests[0].url).toBe('http://example.com/updated');
    });

    it('should persist data to file', () => {
      const request = {
        name: 'persist-test',
        method: 'GET',
        url: 'http://example.com'
      };

      storage.saveRequest(request);

      // Read directly from file to verify persistence
      const fileData = JSON.parse(fs.readFileSync(TEST_DATA_FILE, 'utf-8'));
      expect(fileData.requests.length).toBe(1);
      expect(fileData.requests[0].name).toBe('persist-test');
    });
  });

  describe('getEnvironments()', () => {
    beforeEach(() => {
      storage.initStorage();
    });

    it('should return empty object when no environments exist', () => {
      const environments = storage.getEnvironments();

      expect(typeof environments).toBe('object');
      expect(Object.keys(environments).length).toBe(0);
    });

    it('should return all saved environments', () => {
      // Manually add environments to test file
      const testEnvs = {
        dev: { BASE_URL: 'http://localhost:3000', API_KEY: 'dev-key' },
        prod: { BASE_URL: 'https://api.example.com', API_KEY: 'prod-key' }
      };

      const data = { requests: [], environments: testEnvs };
      fs.writeFileSync(TEST_DATA_FILE, JSON.stringify(data));

      const environments = storage.getEnvironments();

      expect(environments).toEqual(testEnvs);
      expect(Object.keys(environments).length).toBe(2);
    });
  });

  describe('saveEnvironment()', () => {
    beforeEach(() => {
      storage.initStorage();
    });

    it('should save a new environment', () => {
      const envVars = {
        BASE_URL: 'http://localhost:3000',
        API_KEY: 'test-key'
      };

      storage.saveEnvironment('dev', envVars);

      const environments = storage.getEnvironments();
      expect(environments.dev).toEqual(envVars);
    });

    it('should save multiple environments', () => {
      storage.saveEnvironment('dev', { BASE_URL: 'http://localhost:3000' });
      storage.saveEnvironment('prod', { BASE_URL: 'https://api.example.com' });

      const environments = storage.getEnvironments();
      expect(Object.keys(environments).length).toBe(2);
      expect(environments.dev).toBeDefined();
      expect(environments.prod).toBeDefined();
    });

    it('should overwrite existing environment with same name', () => {
      storage.saveEnvironment('dev', { BASE_URL: 'http://localhost:3000' });
      storage.saveEnvironment('dev', { BASE_URL: 'http://localhost:4000', NEW_VAR: 'value' });

      const environments = storage.getEnvironments();
      expect(environments.dev.BASE_URL).toBe('http://localhost:4000');
      expect(environments.dev.NEW_VAR).toBe('value');
    });

    it('should persist data to file', () => {
      const envVars = {
        BASE_URL: 'http://example.com',
        AUTH_TOKEN: 'token123'
      };

      storage.saveEnvironment('test', envVars);

      // Read directly from file to verify persistence
      const fileData = JSON.parse(fs.readFileSync(TEST_DATA_FILE, 'utf-8'));
      expect(fileData.environments.test).toEqual(envVars);
    });

    it('should not affect existing requests when saving environment', () => {
      storage.saveRequest({
        name: 'test-request',
        method: 'GET',
        url: 'http://example.com'
      });

      storage.saveEnvironment('dev', { BASE_URL: 'http://localhost:3000' });

      const requests = storage.getRequests();
      expect(requests.length).toBe(1);
      expect(requests[0].name).toBe('test-request');
    });
  });

  describe('Integration: requests and environments together', () => {
    beforeEach(() => {
      storage.initStorage();
    });

    it('should handle both requests and environments in same file', () => {
      // Save a request
      storage.saveRequest({
        name: 'api-call',
        method: 'GET',
        url: '{{BASE_URL}}/users'
      });

      // Save an environment
      storage.saveEnvironment('dev', { BASE_URL: 'http://localhost:3000' });

      // Verify both are stored
      const requests = storage.getRequests();
      const environments = storage.getEnvironments();

      expect(requests.length).toBe(1);
      expect(requests[0].name).toBe('api-call');
      expect(Object.keys(environments).length).toBe(1);
      expect(environments.dev.BASE_URL).toBe('http://localhost:3000');
    });

    it('should maintain data integrity across multiple operations', () => {
      // Multiple operations
      storage.saveRequest({ name: 'req1', method: 'GET', url: 'url1' });
      storage.saveEnvironment('env1', { VAR1: 'value1' });
      storage.saveRequest({ name: 'req2', method: 'POST', url: 'url2' });
      storage.saveEnvironment('env2', { VAR2: 'value2' });

      // Verify all data is present
      const requests = storage.getRequests();
      const environments = storage.getEnvironments();

      expect(requests.length).toBe(2);
      expect(Object.keys(environments).length).toBe(2);

      // Update an existing request
      storage.saveRequest({ name: 'req1', method: 'PUT', url: 'url1-updated' });

      const updatedRequests = storage.getRequests();
      expect(updatedRequests.length).toBe(2);
      expect(updatedRequests.find(r => r.name === 'req1').method).toBe('PUT');
    });
  });

  describe('Error handling and edge cases', () => {
    beforeEach(() => {
      storage.initStorage();
    });

    it('should handle empty request name', () => {
      storage.saveRequest({ name: '', method: 'GET', url: 'http://example.com' });

      const request = storage.getRequestByName('');
      expect(request).not.toBeNull();
      expect(request.name).toBe('');
    });

    it('should handle special characters in request names', () => {
      const specialName = 'request-with_special.chars!@#';
      storage.saveRequest({ name: specialName, method: 'GET', url: 'url' });

      const request = storage.getRequestByName(specialName);
      expect(request).not.toBeNull();
      expect(request.name).toBe(specialName);
    });

    it('should handle empty environment variables', () => {
      storage.saveEnvironment('empty', {});

      const environments = storage.getEnvironments();
      expect(environments.empty).toEqual({});
    });

    it('should create file if it gets deleted between operations', () => {
      storage.initStorage();
      storage.saveRequest({ name: 'test', method: 'GET', url: 'url' });

      // Delete the file
      fs.unlinkSync(TEST_DATA_FILE);

      // Should recreate and work
      storage.saveRequest({ name: 'test2', method: 'POST', url: 'url2' });

      const requests = storage.getRequests();
      expect(requests.length).toBe(1);
      expect(requests[0].name).toBe('test2');
    });
  });
});
