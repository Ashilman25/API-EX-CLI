const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');

// Import all Phase 1 modules
const storage = require('../../src/core/storage');
const env = require('../../src/core/env');
const http = require('../../src/core/http');
const history = require('../../src/core/history');

// Mock axios
jest.mock('axios');

// Use a temporary test directory
const TEST_STORAGE_DIR = path.join(os.tmpdir(), '.api-ex-test-integration-' + Date.now());

describe('Phase 1 Integration Tests', () => {
  beforeAll(() => {
    storage.setStorageDir(TEST_STORAGE_DIR);
  });

  beforeEach(() => {
    // Clean up test directory before each test
    if (fs.existsSync(TEST_STORAGE_DIR)) {
      fs.rmSync(TEST_STORAGE_DIR, { recursive: true, force: true });
    }
    // Clear all mocks
    jest.clearAllMocks();
  });

  afterAll(() => {
    if (fs.existsSync(TEST_STORAGE_DIR)) {
      fs.rmSync(TEST_STORAGE_DIR, { recursive: true, force: true });
    }
  });

  describe('Complete Workflow: Storage → Environment → HTTP → History', () => {
    it('should complete full request workflow with environment interpolation and history tracking', async () => {
      // Step 1: Initialize storage
      const dbs = storage.initStorage();
      expect(dbs.dataDb).toBeDefined();
      expect(dbs.historyDb).toBeDefined();

      // Step 2: Save an environment
      storage.saveEnvironment('dev', {
        BASE_URL: 'http://localhost:3000',
        API_KEY: 'dev-api-key-123',
        AUTH_TOKEN: 'Bearer dev-token'
      });

      // Step 3: Verify environment was saved
      const environments = storage.getEnvironments();
      expect(environments.dev).toBeDefined();
      expect(environments.dev.BASE_URL).toBe('http://localhost:3000');

      // Step 4: Retrieve environment using env module
      const devEnv = env.getEnv('dev');
      expect(devEnv).toEqual({
        BASE_URL: 'http://localhost:3000',
        API_KEY: 'dev-api-key-123',
        AUTH_TOKEN: 'Bearer dev-token'
      });

      // Step 5: Create a request with placeholders
      const request = {
        method: 'GET',
        url: '{{BASE_URL}}/api/users',
        headers: {
          'Authorization': '{{AUTH_TOKEN}}',
          'X-API-Key': '{{API_KEY}}'
        }
      };

      // Step 6: Interpolate request using environment
      const interpolatedRequest = env.interpolateRequest(request, devEnv);
      expect(interpolatedRequest.url).toBe('http://localhost:3000/api/users');
      expect(interpolatedRequest.headers.Authorization).toBe('Bearer dev-token');
      expect(interpolatedRequest.headers['X-API-Key']).toBe('dev-api-key-123');

      // Step 7: Mock HTTP response
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        data: { users: [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }] }
      };
      axios.mockResolvedValue(mockResponse);

      // Step 8: Send HTTP request
      const response = await http.sendRequest(interpolatedRequest);
      expect(response.status).toBe(200);
      expect(response.data.users).toHaveLength(2);
      expect(response.durationMs).toBeGreaterThanOrEqual(0);

      // Step 9: Record to history
      history.recordHistory({
        method: interpolatedRequest.method,
        url: interpolatedRequest.url,
        status: response.status,
        durationMs: response.durationMs,
        env: 'dev'
      });

      // Step 10: Retrieve from history
      const historyEntries = history.getHistory({ limit: 10 });
      expect(historyEntries.length).toBe(1);
      expect(historyEntries[0].method).toBe('GET');
      expect(historyEntries[0].url).toBe('http://localhost:3000/api/users');
      expect(historyEntries[0].status).toBe(200);
      expect(historyEntries[0].env).toBe('dev');
      expect(historyEntries[0].timestamp).toBeDefined();
    });

    it('should handle saved request workflow', async () => {
      // Initialize storage
      storage.initStorage();

      // Save an environment
      storage.saveEnvironment('staging', {
        API_URL: 'https://staging.example.com',
        TOKEN: 'staging-token'
      });

      // Save a request with placeholders
      storage.saveRequest({
        name: 'get-profile',
        method: 'GET',
        url: '{{API_URL}}/user/profile',
        headers: ['Authorization: Bearer {{TOKEN}}'],
        data: ''
      });

      // Retrieve saved request
      const savedRequest = storage.getRequestByName('get-profile');
      expect(savedRequest).not.toBeNull();
      expect(savedRequest.name).toBe('get-profile');

      // Get environment
      const stagingEnv = env.getEnv('staging');

      // Interpolate saved request
      const interpolatedRequest = env.interpolateRequest(savedRequest, stagingEnv);
      expect(interpolatedRequest.url).toBe('https://staging.example.com/user/profile');

      // Mock response
      axios.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { userId: 123, name: 'Test User' }
      });

      // Send request
      const response = await http.sendRequest(interpolatedRequest);
      expect(response.status).toBe(200);
      expect(response.data.userId).toBe(123);

      // Record to history with saved request name
      history.recordHistory({
        method: interpolatedRequest.method,
        url: interpolatedRequest.url,
        status: response.status,
        durationMs: response.durationMs,
        env: 'staging',
        savedRequestName: 'get-profile'
      });

      // Verify history
      const historyEntries = history.getHistory();
      expect(historyEntries[0].savedRequestName).toBe('get-profile');
      expect(historyEntries[0].env).toBe('staging');
    });

    it('should handle POST request with data interpolation', async () => {
      // Initialize
      storage.initStorage();

      // Save environment
      storage.saveEnvironment('prod', {
        API_BASE: 'https://api.production.com',
        USER_ID: '456',
        API_SECRET: 'secret-key'
      });

      // Get environment
      const prodEnv = env.getEnv('prod');

      // Create POST request with placeholders in data
      const request = {
        method: 'POST',
        url: '{{API_BASE}}/users',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': '{{API_SECRET}}'
        },
        data: '{"userId": "{{USER_ID}}", "action": "create"}'
      };

      // Interpolate
      const interpolatedRequest = env.interpolateRequest(request, prodEnv);
      expect(interpolatedRequest.url).toBe('https://api.production.com/users');
      expect(interpolatedRequest.data).toBe('{"userId": "456", "action": "create"}');
      expect(interpolatedRequest.headers['X-API-Key']).toBe('secret-key');

      // Mock response
      axios.mockResolvedValue({
        status: 201,
        statusText: 'Created',
        headers: { 'location': '/users/456' },
        data: { id: 456, created: true }
      });

      // Send request
      const response = await http.sendRequest(interpolatedRequest);
      expect(response.status).toBe(201);

      // Record to history
      history.recordHistory({
        method: interpolatedRequest.method,
        url: interpolatedRequest.url,
        status: response.status,
        durationMs: response.durationMs,
        env: 'prod'
      });

      // Verify
      const historyEntries = history.getHistory();
      expect(historyEntries[0].method).toBe('POST');
      expect(historyEntries[0].status).toBe(201);
    });

    it('should handle error responses and still record to history', async () => {
      // Initialize
      storage.initStorage();

      // Save environment
      storage.saveEnvironment('test', {
        API_URL: 'http://test.example.com'
      });

      // Get environment
      const testEnv = env.getEnv('test');

      // Create request
      const request = {
        method: 'GET',
        url: '{{API_URL}}/api/nonexistent',
        headers: {}
      };

      // Interpolate
      const interpolatedRequest = env.interpolateRequest(request, testEnv);

      // Mock 404 response
      axios.mockResolvedValue({
        status: 404,
        statusText: 'Not Found',
        headers: {},
        data: { error: 'Resource not found' }
      });

      // Send request (should not throw because validateStatus returns true)
      const response = await http.sendRequest(interpolatedRequest);
      expect(response.status).toBe(404);

      // Record error response to history
      history.recordHistory({
        method: interpolatedRequest.method,
        url: interpolatedRequest.url,
        status: response.status,
        durationMs: response.durationMs,
        env: 'test'
      });

      // Verify error was recorded
      const historyEntries = history.getHistory();
      expect(historyEntries[0].status).toBe(404);
    });

    it('should handle multiple environments and requests', async () => {
      // Initialize
      storage.initStorage();

      // Create multiple environments
      storage.saveEnvironment('dev', { URL: 'http://dev.local' });
      storage.saveEnvironment('staging', { URL: 'http://staging.example.com' });
      storage.saveEnvironment('prod', { URL: 'https://api.example.com' });

      // Save multiple requests
      storage.saveRequest({ name: 'get-users', method: 'GET', url: '{{URL}}/users' });
      storage.saveRequest({ name: 'get-posts', method: 'GET', url: '{{URL}}/posts' });
      storage.saveRequest({ name: 'create-user', method: 'POST', url: '{{URL}}/users' });

      // Verify all are saved
      const environments = storage.getEnvironments();
      expect(Object.keys(environments).length).toBe(3);

      const requests = storage.getRequests();
      expect(requests.length).toBe(3);

      // Test with dev environment
      const devEnv = env.getEnv('dev');
      const getUsersRequest = storage.getRequestByName('get-users');
      const interpolated = env.interpolateRequest(getUsersRequest, devEnv);
      expect(interpolated.url).toBe('http://dev.local/users');

      // Mock and send
      axios.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: []
      });

      const response = await http.sendRequest(interpolated);

      // Record to history
      history.recordHistory({
        method: interpolated.method,
        url: interpolated.url,
        status: response.status,
        durationMs: response.durationMs,
        env: 'dev',
        savedRequestName: 'get-users'
      });

      // Test with staging environment
      const stagingEnv = env.getEnv('staging');
      const getPostsRequest = storage.getRequestByName('get-posts');
      const interpolated2 = env.interpolateRequest(getPostsRequest, stagingEnv);
      expect(interpolated2.url).toBe('http://staging.example.com/posts');

      axios.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: []
      });

      const response2 = await http.sendRequest(interpolated2);

      history.recordHistory({
        method: interpolated2.method,
        url: interpolated2.url,
        status: response2.status,
        durationMs: response2.durationMs,
        env: 'staging',
        savedRequestName: 'get-posts'
      });

      // Verify both are in history
      const historyEntries = history.getHistory({ limit: 10 });
      expect(historyEntries.length).toBe(2);
      expect(historyEntries[0].savedRequestName).toBe('get-posts');
      expect(historyEntries[1].savedRequestName).toBe('get-users');
    });
  });

  describe('Module Interactions', () => {
    it('should handle storage persistence across operations', async () => {
      // Initialize
      storage.initStorage();

      // Save environment
      storage.saveEnvironment('test', { KEY: 'value' });

      // Save request
      storage.saveRequest({ name: 'test-req', method: 'GET', url: 'http://test.com' });

      // Record history
      history.recordHistory({
        method: 'GET',
        url: 'http://test.com',
        status: 200,
        durationMs: 100
      });

      // Verify all files exist
      const storageDir = storage.getStorageDir();
      const dataFile = storage.getDataFile();
      const historyFile = storage.getHistoryFile();

      expect(fs.existsSync(storageDir)).toBe(true);
      expect(fs.existsSync(dataFile)).toBe(true);
      expect(fs.existsSync(historyFile)).toBe(true);

      // Read files and verify content
      const dataContent = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
      expect(dataContent.environments.test).toBeDefined();
      expect(dataContent.requests.length).toBe(1);

      const historyContent = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
      expect(historyContent.history.length).toBe(1);
    });

    it('should handle missing environment gracefully', () => {
      storage.initStorage();

      // Try to get non-existent environment
      expect(() => {
        env.getEnv('nonexistent');
      }).toThrow(/Unknown environment "nonexistent"/);
    });

    it('should handle request without environment interpolation', async () => {
      storage.initStorage();

      // Create request without placeholders
      const request = {
        method: 'GET',
        url: 'http://example.com/api',
        headers: {}
      };

      // Mock response
      axios.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { success: true }
      });

      // Send without environment
      const response = await http.sendRequest(request);
      expect(response.status).toBe(200);

      // Record to history without env
      history.recordHistory({
        method: request.method,
        url: request.url,
        status: response.status,
        durationMs: response.durationMs
      });

      // Verify
      const historyEntries = history.getHistory();
      expect(historyEntries[0].env).toBeUndefined();
    });

    it('should update existing saved requests', () => {
      storage.initStorage();

      // Save initial request
      storage.saveRequest({
        name: 'test-request',
        method: 'GET',
        url: 'http://example.com/v1'
      });

      // Update the request
      storage.saveRequest({
        name: 'test-request',
        method: 'POST',
        url: 'http://example.com/v2'
      });

      // Verify update
      const requests = storage.getRequests();
      expect(requests.length).toBe(1);
      expect(requests[0].method).toBe('POST');
      expect(requests[0].url).toBe('http://example.com/v2');
    });

    it('should maintain history sorting across multiple additions', () => {
      storage.initStorage();

      // Add entries with delays
      for (let i = 0; i < 5; i++) {
        history.recordHistory({
          method: 'GET',
          url: `http://example.com/api/${i}`,
          status: 200,
          durationMs: 100
        });

        // Small delay
        const waitUntil = Date.now() + 2;
        while (Date.now() < waitUntil) {}
      }

      // Retrieve history
      const historyEntries = history.getHistory({ limit: 10 });

      // Verify sorting (most recent first)
      expect(historyEntries[0].url).toBe('http://example.com/api/4');
      expect(historyEntries[4].url).toBe('http://example.com/api/0');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle network errors and not crash', async () => {
      storage.initStorage();

      const request = {
        method: 'GET',
        url: 'http://unreachable.example.com'
      };

      // Mock network error
      const networkError = new Error('Network Error');
      networkError.request = {};
      axios.mockRejectedValue(networkError);

      // Should throw network error
      await expect(http.sendRequest(request)).rejects.toThrow(/Network error/);
    });

    it('should handle timeout and not crash', async () => {
      storage.initStorage();

      const request = {
        method: 'GET',
        url: 'http://slow.example.com',
        timeout: 1000
      };

      // Mock timeout error
      const timeoutError = new Error('timeout of 1000ms exceeded');
      timeoutError.code = 'ECONNABORTED';
      axios.mockRejectedValue(timeoutError);

      // Should throw timeout error
      await expect(http.sendRequest(request)).rejects.toThrow(/Request timeout/);
    });

    it('should handle empty history gracefully', () => {
      storage.initStorage();

      const historyEntries = history.getHistory();
      expect(historyEntries).toEqual([]);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain data consistency across all operations', async () => {
      // Initialize
      const dbs = storage.initStorage();
      expect(dbs.dataDb.value().requests).toEqual([]);
      expect(dbs.dataDb.value().environments).toEqual({});
      expect(dbs.historyDb.value().history).toEqual([]);

      // Perform multiple operations
      storage.saveEnvironment('env1', { KEY1: 'val1' });
      storage.saveEnvironment('env2', { KEY2: 'val2' });
      storage.saveRequest({ name: 'req1', method: 'GET', url: 'url1' });
      storage.saveRequest({ name: 'req2', method: 'POST', url: 'url2' });
      history.recordHistory({ method: 'GET', url: 'url1', status: 200, durationMs: 100 });
      history.recordHistory({ method: 'POST', url: 'url2', status: 201, durationMs: 150 });

      // Verify all data is present
      const environments = storage.getEnvironments();
      const requests = storage.getRequests();
      const historyEntries = history.getHistory({ limit: 100 });

      expect(Object.keys(environments).length).toBe(2);
      expect(requests.length).toBe(2);
      expect(historyEntries.length).toBe(2);

      // Update operations
      storage.saveEnvironment('env1', { KEY1: 'updated-val1', NEW_KEY: 'new' });
      storage.saveRequest({ name: 'req1', method: 'PUT', url: 'updated-url1' });

      // Verify updates
      const updatedEnvs = storage.getEnvironments();
      const updatedReqs = storage.getRequests();

      expect(updatedEnvs.env1.KEY1).toBe('updated-val1');
      expect(updatedEnvs.env1.NEW_KEY).toBe('new');
      expect(updatedReqs.find(r => r.name === 'req1').method).toBe('PUT');
      expect(updatedReqs.find(r => r.name === 'req1').url).toBe('updated-url1');

      // History should remain unchanged
      const unchangedHistory = history.getHistory({ limit: 100 });
      expect(unchangedHistory.length).toBe(2);
    });
  });
});
