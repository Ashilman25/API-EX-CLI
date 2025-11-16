const fs = require('fs');
const path = require('path');
const os = require('os');

// Mock axios before requiring any modules
jest.mock('axios');
const axios = require('axios');

// Mock validation module to prevent process.exit
jest.mock('../../src/core/validation', () => ({
  validateUrl: jest.fn((url) => url),
  validateHttpMethod: jest.fn((method) => method.toUpperCase()),
  validateTimeout: jest.fn((timeout) => parseInt(timeout)),
  validateJsonData: jest.fn((data) => data),
  validateEnvironmentName: jest.fn((name) => name),
  validateRequestName: jest.fn((name) => name)
}));

// Setup test storage directory
const TEST_STORAGE_DIR = path.join(os.tmpdir(), '.api-ex-e2e-test-' + Date.now());

// Configure storage before requiring modules
process.env.API_EX_STORAGE_DIR = TEST_STORAGE_DIR;

const storage = require('../../src/core/storage');
const history = require('../../src/core/history');
const { sendRequest } = require('../../src/core/http');

// Helper function to interpolate a single string
function interpolateString(str, env) {
  let result = str;
  for (const [key, value] of Object.entries(env)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}

describe('End-to-End Workflows', () => {
  let consoleOutput = [];
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  beforeAll(() => {
    storage.setStorageDir(TEST_STORAGE_DIR);
  });

  beforeEach(() => {
    // Clean storage
    if (fs.existsSync(TEST_STORAGE_DIR)) {
      fs.rmSync(TEST_STORAGE_DIR, { recursive: true, force: true });
    }
    storage.initStorage();

    // Reset mocks
    jest.clearAllMocks();
    consoleOutput = [];

    // Capture console output
    console.log = jest.fn((...args) => {
      consoleOutput.push(args.join(' '));
    });
    console.error = jest.fn((...args) => {
      consoleOutput.push('ERROR: ' + args.join(' '));
    });
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  afterAll(() => {
    if (fs.existsSync(TEST_STORAGE_DIR)) {
      fs.rmSync(TEST_STORAGE_DIR, { recursive: true, force: true });
    }
  });

  describe('Complete API Request Workflow', () => {
    it('should save request, set environment, and run request with interpolation', async () => {
      // Step 1: Save a request with placeholders
      storage.saveRequest({
        name: 'get-users',
        method: 'GET',
        url: '{{BASE_URL}}/api/users',
        headers: ['Authorization: Bearer {{API_TOKEN}}'],
        data: ''
      });

      // Step 2: Create environment
      storage.saveEnvironment('production', {
        BASE_URL: 'https://api.example.com',
        API_TOKEN: 'prod-secret-token'
      });

      // Step 3: Mock API response
      axios.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        data: [
          { id: 1, name: 'John Doe' },
          { id: 2, name: 'Jane Smith' }
        ]
      });

      // Step 4: Get saved request and interpolate
      const savedRequest = storage.getRequestByName('get-users');
      const env = storage.getEnvironments().production;

      const interpolatedUrl = interpolateString(savedRequest.url, env);
      const interpolatedHeaders = savedRequest.headers.map(h => interpolateString(h, env));

      expect(interpolatedUrl).toBe('https://api.example.com/api/users');
      expect(interpolatedHeaders[0]).toBe('Authorization: Bearer prod-secret-token');

      // Step 5: Make request
      const response = await sendRequest({
        method: savedRequest.method,
        url: interpolatedUrl,
        headers: { 'Authorization': 'Bearer prod-secret-token' },
        data: savedRequest.data
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveLength(2);
      expect(axios).toHaveBeenCalledWith(expect.objectContaining({
        method: 'GET',
        url: 'https://api.example.com/api/users'
      }));
    });

    it('should handle POST request with JSON body', async () => {
      // Save POST request
      storage.saveRequest({
        name: 'create-user',
        method: 'POST',
        url: '{{BASE_URL}}/api/users',
        headers: [
          'Content-Type: application/json',
          'Authorization: Bearer {{TOKEN}}'
        ],
        data: '{"name": "New User", "email": "new@example.com"}'
      });

      storage.saveEnvironment('dev', {
        BASE_URL: 'http://localhost:3000',
        TOKEN: 'dev-token'
      });

      axios.mockResolvedValueOnce({
        status: 201,
        statusText: 'Created',
        headers: { 'content-type': 'application/json' },
        data: { id: 3, name: 'New User', email: 'new@example.com' }
      });

      const savedRequest = storage.getRequestByName('create-user');
      const env = storage.getEnvironments().dev;

      const response = await sendRequest({
        method: savedRequest.method,
        url: interpolateString(savedRequest.url, env),
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer dev-token' },
        data: savedRequest.data
      });

      expect(response.status).toBe(201);
      expect(response.data.id).toBe(3);
    });

    it('should record request in history', async () => {
      axios.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { message: 'success' }
      });

      const response = await sendRequest({
        method: 'GET',
        url: 'https://api.example.com/health',
        headers: {},
        data: ''
      });

      history.recordHistory({
        method: 'GET',
        url: 'https://api.example.com/health',
        status: response.status,
        timestamp: new Date().toISOString()
      });

      const historyRecords = history.getHistory();
      expect(historyRecords.length).toBe(1);
      expect(historyRecords[0].method).toBe('GET');
      expect(historyRecords[0].status).toBe(200);
    });
  });

  describe('Environment Management Workflow', () => {
    it('should manage multiple environments', () => {
      // Create multiple environments
      storage.saveEnvironment('dev', {
        BASE_URL: 'http://localhost:3000',
        API_KEY: 'dev-key',
        DEBUG: 'true'
      });

      storage.saveEnvironment('staging', {
        BASE_URL: 'https://staging.example.com',
        API_KEY: 'staging-key',
        DEBUG: 'false'
      });

      storage.saveEnvironment('production', {
        BASE_URL: 'https://api.example.com',
        API_KEY: 'prod-key',
        DEBUG: 'false'
      });

      const envs = storage.getEnvironments();
      expect(Object.keys(envs)).toHaveLength(3);
      expect(envs.dev.BASE_URL).toBe('http://localhost:3000');
      expect(envs.staging.BASE_URL).toBe('https://staging.example.com');
      expect(envs.production.BASE_URL).toBe('https://api.example.com');
    });

    it('should update environment variables', () => {
      storage.saveEnvironment('dev', { API_KEY: 'old-key' });
      storage.saveEnvironment('dev', { API_KEY: 'new-key', NEW_VAR: 'value' });

      const env = storage.getEnvironments().dev;
      expect(env.API_KEY).toBe('new-key');
      expect(env.NEW_VAR).toBe('value');
    });

    it('should remove environment', () => {
      storage.saveEnvironment('temp', { VAR: 'value' });
      storage.saveEnvironment('keep', { VAR: 'keep-value' });

      storage.removeEnvironment('temp');

      const envs = storage.getEnvironments();
      expect(envs.temp).toBeUndefined();
      expect(envs.keep).toBeDefined();
    });

    it('should interpolate complex URL patterns', () => {
      const env = {
        PROTOCOL: 'https',
        HOST: 'api.example.com',
        VERSION: 'v2',
        USER_ID: '123'
      };

      const url = '{{PROTOCOL}}://{{HOST}}/{{VERSION}}/users/{{USER_ID}}/profile';
      const result = interpolateString(url, env);

      expect(result).toBe('https://api.example.com/v2/users/123/profile');
    });
  });

  describe('Request Collection Management', () => {
    it('should manage a collection of related requests', () => {
      // Create a full API collection
      const apiCollection = [
        { name: 'users-list', method: 'GET', url: '{{BASE_URL}}/users', headers: [], data: '' },
        { name: 'users-get', method: 'GET', url: '{{BASE_URL}}/users/{{ID}}', headers: [], data: '' },
        { name: 'users-create', method: 'POST', url: '{{BASE_URL}}/users', headers: ['Content-Type: application/json'], data: '{}' },
        { name: 'users-update', method: 'PUT', url: '{{BASE_URL}}/users/{{ID}}', headers: ['Content-Type: application/json'], data: '{}' },
        { name: 'users-delete', method: 'DELETE', url: '{{BASE_URL}}/users/{{ID}}', headers: [], data: '' }
      ];

      apiCollection.forEach(req => storage.saveRequest(req));

      const saved = storage.getRequests();
      expect(saved).toHaveLength(5);

      // Verify all CRUD operations are present
      expect(saved.find(r => r.name === 'users-list').method).toBe('GET');
      expect(saved.find(r => r.name === 'users-create').method).toBe('POST');
      expect(saved.find(r => r.name === 'users-update').method).toBe('PUT');
      expect(saved.find(r => r.name === 'users-delete').method).toBe('DELETE');
    });

    it('should update existing request', () => {
      storage.saveRequest({
        name: 'api-call',
        method: 'GET',
        url: 'http://old.url',
        headers: [],
        data: ''
      });

      // Update the same request
      storage.saveRequest({
        name: 'api-call',
        method: 'POST',
        url: 'http://new.url',
        headers: ['Authorization: Bearer token'],
        data: '{"updated": true}'
      });

      const requests = storage.getRequests();
      expect(requests).toHaveLength(1);
      expect(requests[0].method).toBe('POST');
      expect(requests[0].url).toBe('http://new.url');
    });
  });

  describe('Error Handling Workflow', () => {
    it('should handle network errors gracefully', async () => {
      axios.mockRejectedValueOnce({
        code: 'ECONNREFUSED',
        message: 'Connection refused'
      });

      await expect(sendRequest({
        method: 'GET',
        url: 'http://localhost:9999/api',
        headers: {},
        data: ''
      })).rejects.toThrow();
    });

    it('should handle HTTP error responses', async () => {
      axios.mockRejectedValueOnce({
        response: {
          status: 404,
          statusText: 'Not Found',
          headers: {},
          data: { error: 'Resource not found' }
        }
      });

      await expect(sendRequest({
        method: 'GET',
        url: 'https://api.example.com/missing',
        headers: {},
        data: ''
      })).rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      axios.mockRejectedValueOnce({
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded'
      });

      await expect(sendRequest({
        method: 'GET',
        url: 'https://slow.api.com/data',
        headers: {},
        data: '',
        timeout: 5000
      })).rejects.toThrow();
    });

    it('should handle missing environment variable', () => {
      const env = { BASE_URL: 'https://api.example.com' };
      const url = '{{BASE_URL}}/users/{{MISSING_VAR}}';

      // Should leave placeholder as-is
      const result = interpolateString(url, env);
      expect(result).toBe('https://api.example.com/users/{{MISSING_VAR}}');
    });
  });

  describe('History Tracking Workflow', () => {
    it('should track multiple requests in history', () => {
      const requests = [
        { method: 'GET', url: '/users', status: 200 },
        { method: 'POST', url: '/users', status: 201 },
        { method: 'GET', url: '/users/1', status: 200 },
        { method: 'PUT', url: '/users/1', status: 200 },
        { method: 'DELETE', url: '/users/1', status: 204 }
      ];

      requests.forEach(req => {
        history.recordHistory({
          ...req,
          timestamp: new Date().toISOString()
        });
      });

      const historyRecords = history.getHistory();
      expect(historyRecords).toHaveLength(5);

      // Verify order (most recent first due to unshift)
      expect(historyRecords[0].method).toBe('DELETE');
      expect(historyRecords[4].method).toBe('GET');
    });

    it('should retrieve history after recording', () => {
      history.recordHistory({
        method: 'GET',
        url: '/test',
        status: 200,
        timestamp: new Date().toISOString()
      });

      const records = history.getHistory();
      expect(records.length).toBeGreaterThan(0);
      expect(records[0].method).toBe('GET');
      expect(records[0].url).toBe('/test');
    });

    it('should limit history size', () => {
      // Add more than limit
      for (let i = 0; i < 150; i++) {
        history.recordHistory({
          method: 'GET',
          url: `/request/${i}`,
          status: 200,
          timestamp: new Date().toISOString()
        });
      }

      const historyRecords = history.getHistory();
      expect(historyRecords.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Multi-Environment Request Execution', () => {
    beforeEach(() => {
      // Setup common request
      storage.saveRequest({
        name: 'health-check',
        method: 'GET',
        url: '{{BASE_URL}}/health',
        headers: ['X-API-Key: {{API_KEY}}'],
        data: ''
      });

      // Setup environments
      storage.saveEnvironment('local', {
        BASE_URL: 'http://localhost:3000',
        API_KEY: 'local-key'
      });

      storage.saveEnvironment('prod', {
        BASE_URL: 'https://api.production.com',
        API_KEY: 'prod-key'
      });
    });

    it('should execute same request against different environments', async () => {
      const savedRequest = storage.getRequestByName('health-check');
      const environments = storage.getEnvironments();

      // Mock responses for each environment
      axios
        .mockResolvedValueOnce({
          status: 200,
          headers: {},
          data: { status: 'ok', env: 'local' }
        })
        .mockResolvedValueOnce({
          status: 200,
          headers: {},
          data: { status: 'ok', env: 'production' }
        });

      // Test against local
      const localResponse = await sendRequest({
        method: savedRequest.method,
        url: interpolateString(savedRequest.url, environments.local),
        headers: { 'X-API-Key': environments.local.API_KEY },
        data: savedRequest.data
      });

      expect(localResponse.data.env).toBe('local');

      // Test against production
      const prodResponse = await sendRequest({
        method: savedRequest.method,
        url: interpolateString(savedRequest.url, environments.prod),
        headers: { 'X-API-Key': environments.prod.API_KEY },
        data: savedRequest.data
      });

      expect(prodResponse.data.env).toBe('production');

      // Verify different URLs were called
      expect(axios).toHaveBeenCalledTimes(2);
      expect(axios.mock.calls[0][0].url).toContain('localhost');
      expect(axios.mock.calls[1][0].url).toContain('production');
    });
  });
});
