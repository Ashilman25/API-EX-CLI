const validation = require('../../src/core/validation');

// Mock console.log
let consoleOutput = [];
const originalConsoleLog = console.log;

beforeEach(() => {
  consoleOutput = [];
  console.log = jest.fn((...args) => {
    consoleOutput.push(args.join(' '));
  });
});

afterEach(() => {
  console.log = originalConsoleLog;
});

describe('Validation Module', () => {
  describe('isValidUrl()', () => {
    it('should return true for valid HTTP URL', () => {
      expect(validation.isValidUrl('http://example.com')).toBe(true);
    });

    it('should return true for valid HTTPS URL', () => {
      expect(validation.isValidUrl('https://api.example.com/users')).toBe(true);
    });

    it('should return true for URL with port', () => {
      expect(validation.isValidUrl('http://localhost:3000/api')).toBe(true);
    });

    it('should return true for URL with query params', () => {
      expect(validation.isValidUrl('https://api.example.com/search?q=test&limit=10')).toBe(true);
    });

    it('should return true for URL with placeholders', () => {
      expect(validation.isValidUrl('https://{{BASE_URL}}/users/{{USER_ID}}')).toBe(true);
    });

    it('should return false for invalid URL', () => {
      expect(validation.isValidUrl('not-a-url')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(validation.isValidUrl('')).toBe(false);
    });

    it('should return false for null', () => {
      expect(validation.isValidUrl(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(validation.isValidUrl(undefined)).toBe(false);
    });

    it('should return false for non-string', () => {
      expect(validation.isValidUrl(123)).toBe(false);
    });
  });

  describe('isValidJson()', () => {
    it('should return true for valid JSON object', () => {
      expect(validation.isValidJson('{"key": "value"}')).toBe(true);
    });

    it('should return true for valid JSON array', () => {
      expect(validation.isValidJson('[1, 2, 3]')).toBe(true);
    });

    it('should return true for nested JSON', () => {
      expect(validation.isValidJson('{"user": {"name": "John", "age": 30}}')).toBe(true);
    });

    it('should return false for invalid JSON', () => {
      expect(validation.isValidJson('{invalid json}')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(validation.isValidJson('')).toBe(false);
    });

    it('should return false for null', () => {
      expect(validation.isValidJson(null)).toBe(false);
    });

    it('should return false for non-string', () => {
      expect(validation.isValidJson(123)).toBe(false);
    });
  });

  describe('validateRequestName()', () => {
    it('should return trimmed name for valid input', () => {
      expect(validation.validateRequestName('my-request')).toBe('my-request');
    });

    it('should trim whitespace from name', () => {
      expect(validation.validateRequestName('  my-request  ')).toBe('my-request');
    });

    it('should allow names with dashes', () => {
      expect(validation.validateRequestName('get-user-profile')).toBe('get-user-profile');
    });

    it('should allow names with underscores', () => {
      expect(validation.validateRequestName('get_user_profile')).toBe('get_user_profile');
    });

    it('should warn about spaces but not throw', () => {
      const result = validation.validateRequestName('my request');
      expect(result).toBe('my request');
      expect(consoleOutput.some(line => line.includes('Warning'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('spaces'))).toBe(true);
    });

    it('should throw for empty string', () => {
      expect(() => validation.validateRequestName('')).toThrow('is required');
    });

    it('should throw for whitespace-only string', () => {
      expect(() => validation.validateRequestName('   ')).toThrow('cannot be empty');
    });

    it('should throw for null', () => {
      expect(() => validation.validateRequestName(null)).toThrow('Request name is required');
    });

    it('should throw for undefined', () => {
      expect(() => validation.validateRequestName(undefined)).toThrow('Request name is required');
    });

    it('should throw for name too long', () => {
      const longName = 'a'.repeat(51);
      expect(() => validation.validateRequestName(longName)).toThrow('too long');
    });

    it('should allow name at max length (50)', () => {
      const maxName = 'a'.repeat(50);
      expect(validation.validateRequestName(maxName)).toBe(maxName);
    });

    it('should throw for invalid characters', () => {
      expect(() => validation.validateRequestName('my/request')).toThrow('invalid characters');
      expect(() => validation.validateRequestName('my\\request')).toThrow('invalid characters');
      expect(() => validation.validateRequestName('my:request')).toThrow('invalid characters');
      expect(() => validation.validateRequestName('my*request')).toThrow('invalid characters');
      expect(() => validation.validateRequestName('my?request')).toThrow('invalid characters');
      expect(() => validation.validateRequestName('my"request')).toThrow('invalid characters');
      expect(() => validation.validateRequestName('my<request')).toThrow('invalid characters');
      expect(() => validation.validateRequestName('my>request')).toThrow('invalid characters');
      expect(() => validation.validateRequestName('my|request')).toThrow('invalid characters');
    });
  });

  describe('validateEnvironmentName()', () => {
    it('should return trimmed name for valid input', () => {
      expect(validation.validateEnvironmentName('production')).toBe('production');
    });

    it('should trim whitespace', () => {
      expect(validation.validateEnvironmentName('  dev  ')).toBe('dev');
    });

    it('should allow names with dashes', () => {
      expect(validation.validateEnvironmentName('dev-local')).toBe('dev-local');
    });

    it('should throw for empty string', () => {
      expect(() => validation.validateEnvironmentName('')).toThrow('is required');
    });

    it('should throw for null', () => {
      expect(() => validation.validateEnvironmentName(null)).toThrow('is required');
    });

    it('should throw for name too long', () => {
      const longName = 'a'.repeat(51);
      expect(() => validation.validateEnvironmentName(longName)).toThrow('too long');
    });

    it('should throw for invalid characters', () => {
      expect(() => validation.validateEnvironmentName('dev/prod')).toThrow('invalid characters');
    });

    it('should throw for whitespace-only string', () => {
      expect(() => validation.validateEnvironmentName('   ')).toThrow('cannot be empty');
    });
  });

  describe('validateHttpMethod()', () => {
    it('should return uppercase GET', () => {
      expect(validation.validateHttpMethod('GET')).toBe('GET');
    });

    it('should convert lowercase to uppercase', () => {
      expect(validation.validateHttpMethod('get')).toBe('GET');
      expect(validation.validateHttpMethod('post')).toBe('POST');
    });

    it('should accept all valid methods', () => {
      expect(validation.validateHttpMethod('POST')).toBe('POST');
      expect(validation.validateHttpMethod('PUT')).toBe('PUT');
      expect(validation.validateHttpMethod('PATCH')).toBe('PATCH');
      expect(validation.validateHttpMethod('DELETE')).toBe('DELETE');
      expect(validation.validateHttpMethod('HEAD')).toBe('HEAD');
      expect(validation.validateHttpMethod('OPTIONS')).toBe('OPTIONS');
    });

    it('should throw for invalid method', () => {
      expect(() => validation.validateHttpMethod('INVALID')).toThrow('Invalid HTTP method');
    });

    it('should include valid methods in error message', () => {
      expect(() => validation.validateHttpMethod('INVALID')).toThrow('GET, POST, PUT');
    });
  });

  describe('validateTimeout()', () => {
    it('should return parsed number for valid timeout', () => {
      expect(validation.validateTimeout('30000')).toBe(30000);
    });

    it('should handle numeric input', () => {
      expect(validation.validateTimeout(5000)).toBe(5000);
    });

    it('should throw for zero', () => {
      expect(() => validation.validateTimeout(0)).toThrow('positive number');
    });

    it('should throw for negative', () => {
      expect(() => validation.validateTimeout(-1000)).toThrow('positive number');
    });

    it('should throw for non-numeric string', () => {
      expect(() => validation.validateTimeout('abc')).toThrow('positive number');
    });

    it('should throw for timeout exceeding max', () => {
      expect(() => validation.validateTimeout(600001)).toThrow('cannot exceed');
    });

    it('should allow max timeout (600000)', () => {
      expect(validation.validateTimeout(600000)).toBe(600000);
    });
  });

  describe('validateUrl()', () => {
    it('should return trimmed URL for valid input', () => {
      expect(validation.validateUrl('https://api.example.com')).toBe('https://api.example.com');
    });

    it('should trim whitespace', () => {
      expect(validation.validateUrl('  https://api.example.com  ')).toBe('https://api.example.com');
    });

    it('should allow URLs with placeholders by default', () => {
      expect(validation.validateUrl('https://{{BASE_URL}}/api')).toBe('https://{{BASE_URL}}/api');
    });

    it('should throw for invalid URL format', () => {
      expect(() => validation.validateUrl('not-a-url')).toThrow('Invalid URL format');
    });

    it('should throw for empty string', () => {
      expect(() => validation.validateUrl('')).toThrow('is required');
    });

    it('should throw for null', () => {
      expect(() => validation.validateUrl(null)).toThrow('is required');
    });

    it('should include the invalid URL in error message', () => {
      expect(() => validation.validateUrl('bad-url')).toThrow('bad-url');
    });

    it('should throw for whitespace-only string', () => {
      expect(() => validation.validateUrl('   ')).toThrow('cannot be empty');
    });

    it('should validate URL without placeholders when disabled', () => {
      expect(validation.validateUrl('https://api.example.com', false)).toBe('https://api.example.com');
    });

    it('should throw for invalid URL with placeholders disabled', () => {
      expect(() => validation.validateUrl('{{BASE_URL}}/api', false)).toThrow('Invalid URL format');
    });
  });

  describe('validateJsonData()', () => {
    it('should return data as-is for valid JSON object', () => {
      const data = '{"key": "value"}';
      expect(validation.validateJsonData(data)).toBe(data);
    });

    it('should return data as-is for valid JSON array', () => {
      const data = '[1, 2, 3]';
      expect(validation.validateJsonData(data)).toBe(data);
    });

    it('should return data as-is for non-JSON string', () => {
      const data = 'plain text body';
      expect(validation.validateJsonData(data)).toBe(data);
    });

    it('should throw for invalid JSON when it looks like JSON', () => {
      expect(() => validation.validateJsonData('{invalid json}')).toThrow('Invalid JSON format');
    });

    it('should return null/undefined as-is', () => {
      expect(validation.validateJsonData(null)).toBe(null);
      expect(validation.validateJsonData(undefined)).toBe(undefined);
    });

    it('should handle empty string', () => {
      expect(validation.validateJsonData('')).toBe('');
    });

    it('should validate JSON with whitespace', () => {
      const data = '  {"key": "value"}  ';
      expect(validation.validateJsonData(data)).toBe(data);
    });
  });

  describe('Error Types', () => {
    it('should throw ValidationError for invalid request name', () => {
      try {
        validation.validateRequestName(null);
        fail('Should have thrown');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.code).toBe(1);
      }
    });

    it('should throw ValidationError for invalid HTTP method', () => {
      try {
        validation.validateHttpMethod('INVALID');
        fail('Should have thrown');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.code).toBe(1);
      }
    });

    it('should throw ValidationError for invalid timeout', () => {
      try {
        validation.validateTimeout(-1);
        fail('Should have thrown');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.code).toBe(1);
      }
    });
  });
});
