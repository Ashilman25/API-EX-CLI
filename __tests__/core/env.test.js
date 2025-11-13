const fs = require('fs');
const path = require('path');
const os = require('os');
const env = require('../../src/core/env');
const storage = require('../../src/core/storage');

// Use a temporary test directory
const TEST_STORAGE_DIR = path.join(os.tmpdir(), '.api-ex-test-env-' + Date.now());

describe('Environment Module', () => {
  // Mock console.warn to test warnings
  let consoleWarnSpy;

  beforeAll(() => {
    storage.setStorageDir(TEST_STORAGE_DIR);
  });

  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(TEST_STORAGE_DIR)) {
      fs.rmSync(TEST_STORAGE_DIR, { recursive: true, force: true });
    }
    storage.initStorage();

    // Spy on console.warn
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.warn
    consoleWarnSpy.mockRestore();
  });

  afterAll(() => {
    if (fs.existsSync(TEST_STORAGE_DIR)) {
      fs.rmSync(TEST_STORAGE_DIR, { recursive: true, force: true });
    }
  });

  describe('getEnv()', () => {
    beforeEach(() => {
      // Add some test environments
      storage.saveEnvironment('dev', {
        BASE_URL: 'http://localhost:3000',
        API_KEY: 'dev-key-123'
      });

      storage.saveEnvironment('prod', {
        BASE_URL: 'https://api.example.com',
        API_KEY: 'prod-key-456'
      });
    });

    it('should return environment when it exists', () => {
      const devEnv = env.getEnv('dev');

      expect(devEnv).toEqual({
        BASE_URL: 'http://localhost:3000',
        API_KEY: 'dev-key-123'
      });
    });

    it('should return different environments correctly', () => {
      const prodEnv = env.getEnv('prod');

      expect(prodEnv).toEqual({
        BASE_URL: 'https://api.example.com',
        API_KEY: 'prod-key-456'
      });
    });

    it('should throw error when environment does not exist', () => {
      expect(() => {
        env.getEnv('nonexistent');
      }).toThrow(/Unknown environment "nonexistent"/);
    });

    it('should include available environments in error message', () => {
      expect(() => {
        env.getEnv('missing');
      }).toThrow(/Available environments: dev, prod/);
    });

    it('should handle case when no environments exist', () => {
      // Clean slate
      if (fs.existsSync(TEST_STORAGE_DIR)) {
        fs.rmSync(TEST_STORAGE_DIR, { recursive: true, force: true });
      }
      storage.initStorage();

      expect(() => {
        env.getEnv('any');
      }).toThrow(/No environments have been defined yet/);
    });

    it('should trim whitespace from environment name', () => {
      const devEnv = env.getEnv('  dev  ');

      expect(devEnv).toEqual({
        BASE_URL: 'http://localhost:3000',
        API_KEY: 'dev-key-123'
      });
    });

    it('should throw error for empty environment name', () => {
      expect(() => {
        env.getEnv('');
      }).toThrow(/Environment name is required/);
    });

    it('should throw error for whitespace-only environment name', () => {
      expect(() => {
        env.getEnv('   ');
      }).toThrow(/Environment name is required/);
    });

    it('should handle non-string environment name', () => {
      expect(() => {
        env.getEnv(null);
      }).toThrow(/Environment name is required/);

      expect(() => {
        env.getEnv(undefined);
      }).toThrow(/Environment name is required/);
    });
  });

  describe('interpolate()', () => {
    const testEnv = {
      BASE_URL: 'http://localhost:3000',
      API_KEY: 'secret-key',
      PORT: '8080',
      EMPTY: '',
      NULL_VALUE: null
    };

    it('should interpolate single placeholder', () => {
      const result = env.interpolate('{{BASE_URL}}/api', testEnv);
      expect(result).toBe('http://localhost:3000/api');
    });

    it('should interpolate multiple placeholders', () => {
      const result = env.interpolate('{{BASE_URL}}/api?key={{API_KEY}}', testEnv);
      expect(result).toBe('http://localhost:3000/api?key=secret-key');
    });

    it('should interpolate same placeholder multiple times', () => {
      const result = env.interpolate('{{BASE_URL}}/{{BASE_URL}}', testEnv);
      expect(result).toBe('http://localhost:3000/http://localhost:3000');
    });

    it('should handle missing keys with warning', () => {
      const result = env.interpolate('{{BASE_URL}}/{{MISSING}}', testEnv);

      expect(result).toBe('http://localhost:3000/{{MISSING}}');
      expect(consoleWarnSpy).toHaveBeenCalledWith('Warning: Missing environment value for "MISSING".');
    });

    it('should leave placeholder unchanged when key is missing', () => {
      const result = env.interpolate('{{UNKNOWN_KEY}}', testEnv);

      expect(result).toBe('{{UNKNOWN_KEY}}');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should handle empty string values', () => {
      const result = env.interpolate('value:{{EMPTY}}:end', testEnv);
      expect(result).toBe('value::end');
    });

    it('should handle null values', () => {
      const result = env.interpolate('value:{{NULL_VALUE}}:end', testEnv);
      expect(result).toBe('value::end');
    });

    it('should handle string with no placeholders', () => {
      const result = env.interpolate('plain string', testEnv);
      expect(result).toBe('plain string');
    });

    it('should handle empty string input', () => {
      const result = env.interpolate('', testEnv);
      expect(result).toBe('');
    });

    it('should handle non-string input', () => {
      expect(env.interpolate(null, testEnv)).toBe(null);
      expect(env.interpolate(undefined, testEnv)).toBe(undefined);
      expect(env.interpolate(123, testEnv)).toBe(123);
      expect(env.interpolate({}, testEnv)).toEqual({});
    });

    it('should handle placeholders with spaces', () => {
      const result = env.interpolate('{{ BASE_URL }}/api', testEnv);
      expect(result).toBe('http://localhost:3000/api');
    });

    it('should handle multiple missing keys', () => {
      const result = env.interpolate('{{MISSING1}}/{{MISSING2}}', testEnv);

      expect(result).toBe('{{MISSING1}}/{{MISSING2}}');
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
    });

    it('should work with empty env object', () => {
      const result = env.interpolate('{{KEY}}/test', {});

      expect(result).toBe('{{KEY}}/test');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should handle complex URLs', () => {
      const result = env.interpolate(
        '{{BASE_URL}}/users?apiKey={{API_KEY}}&port={{PORT}}',
        testEnv
      );
      expect(result).toBe('http://localhost:3000/users?apiKey=secret-key&port=8080');
    });

    it('should convert non-string values to strings', () => {
      const envWithNumbers = { COUNT: 42, ENABLED: true };
      const result = env.interpolate('count={{COUNT}},enabled={{ENABLED}}', envWithNumbers);
      expect(result).toBe('count=42,enabled=true');
    });
  });

  describe('interpolateRequest()', () => {
    const testEnv = {
      BASE_URL: 'http://localhost:3000',
      API_KEY: 'secret-key',
      AUTH_TOKEN: 'Bearer token123',
      USER_ID: '456'
    };

    it('should interpolate request URL', () => {
      const request = {
        method: 'GET',
        url: '{{BASE_URL}}/users'
      };

      const result = env.interpolateRequest(request, testEnv);

      expect(result.url).toBe('http://localhost:3000/users');
      expect(result.method).toBe('GET');
    });

    it('should interpolate request headers (object format)', () => {
      const request = {
        method: 'GET',
        url: 'http://example.com',
        headers: {
          'Authorization': '{{AUTH_TOKEN}}',
          'X-API-Key': '{{API_KEY}}'
        }
      };

      const result = env.interpolateRequest(request, testEnv);

      expect(result.headers).toEqual({
        'Authorization': 'Bearer token123',
        'X-API-Key': 'secret-key'
      });
    });

    it('should interpolate request headers (array format)', () => {
      const request = {
        method: 'GET',
        url: 'http://example.com',
        headers: [
          'Authorization: {{AUTH_TOKEN}}',
          'X-API-Key: {{API_KEY}}'
        ]
      };

      const result = env.interpolateRequest(request, testEnv);

      expect(result.headers).toEqual([
        'Authorization: Bearer token123',
        'X-API-Key: secret-key'
      ]);
    });

    it('should interpolate request data field', () => {
      const request = {
        method: 'POST',
        url: 'http://example.com',
        data: '{"userId": "{{USER_ID}}", "apiKey": "{{API_KEY}}"}'
      };

      const result = env.interpolateRequest(request, testEnv);

      expect(result.data).toBe('{"userId": "456", "apiKey": "secret-key"}');
    });

    it('should interpolate request body field', () => {
      const request = {
        method: 'POST',
        url: 'http://example.com',
        body: '{"userId": "{{USER_ID}}"}'
      };

      const result = env.interpolateRequest(request, testEnv);

      expect(result.body).toBe('{"userId": "456"}');
    });

    it('should interpolate both data and body if present', () => {
      const request = {
        method: 'POST',
        url: 'http://example.com',
        data: '{"apiKey": "{{API_KEY}}"}',
        body: '{"userId": "{{USER_ID}}"}'
      };

      const result = env.interpolateRequest(request, testEnv);

      expect(result.data).toBe('{"apiKey": "secret-key"}');
      expect(result.body).toBe('{"userId": "456"}');
    });

    it('should interpolate URL, headers, and data together', () => {
      const request = {
        method: 'POST',
        url: '{{BASE_URL}}/users',
        headers: {
          'Authorization': '{{AUTH_TOKEN}}'
        },
        data: '{"apiKey": "{{API_KEY}}"}'
      };

      const result = env.interpolateRequest(request, testEnv);

      expect(result.url).toBe('http://localhost:3000/users');
      expect(result.headers.Authorization).toBe('Bearer token123');
      expect(result.data).toBe('{"apiKey": "secret-key"}');
    });

    it('should not mutate original request object', () => {
      const request = {
        method: 'GET',
        url: '{{BASE_URL}}/users',
        headers: {
          'Authorization': '{{AUTH_TOKEN}}'
        }
      };

      const originalUrl = request.url;
      const originalHeaders = request.headers;

      env.interpolateRequest(request, testEnv);

      expect(request.url).toBe(originalUrl);
      expect(request.headers).toBe(originalHeaders);
      expect(request.headers.Authorization).toBe('{{AUTH_TOKEN}}');
    });

    it('should handle request with no placeholders', () => {
      const request = {
        method: 'GET',
        url: 'http://example.com/api',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const result = env.interpolateRequest(request, testEnv);

      expect(result.url).toBe('http://example.com/api');
      expect(result.headers['Content-Type']).toBe('application/json');
    });

    it('should handle request with missing environment values', () => {
      const request = {
        method: 'GET',
        url: '{{BASE_URL}}/{{MISSING}}'
      };

      const result = env.interpolateRequest(request, testEnv);

      expect(result.url).toBe('http://localhost:3000/{{MISSING}}');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should handle request without headers', () => {
      const request = {
        method: 'GET',
        url: '{{BASE_URL}}/users'
      };

      const result = env.interpolateRequest(request, testEnv);

      expect(result.url).toBe('http://localhost:3000/users');
      expect(result.headers).toBeUndefined();
    });

    it('should handle request without data/body', () => {
      const request = {
        method: 'GET',
        url: '{{BASE_URL}}/users'
      };

      const result = env.interpolateRequest(request, testEnv);

      expect(result.data).toBeUndefined();
      expect(result.body).toBeUndefined();
    });

    it('should handle non-string data field', () => {
      const request = {
        method: 'POST',
        url: 'http://example.com',
        data: { key: 'value' }
      };

      const result = env.interpolateRequest(request, testEnv);

      expect(result.data).toEqual({ key: 'value' });
    });

    it('should handle non-string header values in object format', () => {
      const request = {
        method: 'GET',
        url: 'http://example.com',
        headers: {
          'Content-Length': 123,
          'X-Custom': '{{API_KEY}}'
        }
      };

      const result = env.interpolateRequest(request, testEnv);

      expect(result.headers['Content-Length']).toBe(123);
      expect(result.headers['X-Custom']).toBe('secret-key');
    });

    it('should handle non-string items in array headers', () => {
      const request = {
        method: 'GET',
        url: 'http://example.com',
        headers: [
          'Authorization: {{AUTH_TOKEN}}',
          123,
          null
        ]
      };

      const result = env.interpolateRequest(request, testEnv);

      expect(result.headers[0]).toBe('Authorization: Bearer token123');
      expect(result.headers[1]).toBe(123);
      expect(result.headers[2]).toBe(null);
    });

    it('should handle null request', () => {
      const result = env.interpolateRequest(null, testEnv);
      expect(result).toBe(null);
    });

    it('should handle undefined request', () => {
      const result = env.interpolateRequest(undefined, testEnv);
      // undefined defaults to {} due to default parameter
      expect(result).toEqual({});
    });

    it('should handle empty request object', () => {
      const result = env.interpolateRequest({}, testEnv);
      expect(result).toEqual({});
    });

    it('should work with empty env object', () => {
      const request = {
        method: 'GET',
        url: '{{BASE_URL}}/users'
      };

      const result = env.interpolateRequest(request, {});

      expect(result.url).toBe('{{BASE_URL}}/users');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should preserve other request properties', () => {
      const request = {
        method: 'POST',
        url: '{{BASE_URL}}/users',
        timeout: 5000,
        validateStatus: () => true,
        custom: 'property'
      };

      const result = env.interpolateRequest(request, testEnv);

      expect(result.method).toBe('POST');
      expect(result.url).toBe('http://localhost:3000/users');
      expect(result.timeout).toBe(5000);
      expect(result.validateStatus).toBe(request.validateStatus);
      expect(result.custom).toBe('property');
    });
  });

  describe('Integration: getEnv() and interpolateRequest()', () => {
    beforeEach(() => {
      storage.saveEnvironment('staging', {
        BASE_URL: 'https://staging.api.com',
        API_KEY: 'staging-key',
        VERSION: 'v2'
      });
    });

    it('should work together to interpolate request with saved environment', () => {
      const request = {
        method: 'GET',
        url: '{{BASE_URL}}/{{VERSION}}/users',
        headers: {
          'X-API-Key': '{{API_KEY}}'
        }
      };

      const stagingEnv = env.getEnv('staging');
      const result = env.interpolateRequest(request, stagingEnv);

      expect(result.url).toBe('https://staging.api.com/v2/users');
      expect(result.headers['X-API-Key']).toBe('staging-key');
    });

    it('should handle complete workflow', () => {
      // Save environment
      storage.saveEnvironment('test', {
        HOST: 'localhost',
        PORT: '3000',
        TOKEN: 'test-token'
      });

      // Get environment
      const testEnv = env.getEnv('test');

      // Create request
      const request = {
        method: 'POST',
        url: 'http://{{HOST}}:{{PORT}}/api/login',
        headers: {
          'Authorization': 'Bearer {{TOKEN}}'
        },
        data: '{"action": "login"}'
      };

      // Interpolate
      const result = env.interpolateRequest(request, testEnv);

      // Verify
      expect(result.url).toBe('http://localhost:3000/api/login');
      expect(result.headers.Authorization).toBe('Bearer test-token');
      expect(result.data).toBe('{"action": "login"}');
    });
  });
});
