const {
  ApiExError,
  NetworkError,
  ValidationError,
  ConfigurationError,
  FileSystemError
} = require('../../src/core/errors');

describe('Custom Error Classes', () => {
  describe('ApiExError', () => {
    it('should create error with default code 1', () => {
      const error = new ApiExError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('ApiExError');
      expect(error.code).toBe(1);
    });

    it('should create error with custom code', () => {
      const error = new ApiExError('Test error', 2);
      expect(error.code).toBe(2);
    });

    it('should be instance of Error', () => {
      const error = new ApiExError('Test');
      expect(error).toBeInstanceOf(Error);
    });

    it('should have stack trace', () => {
      const error = new ApiExError('Test');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('ApiExError');
    });
  });

  describe('NetworkError', () => {
    it('should create error with code 2', () => {
      const error = new NetworkError('Network failed');
      expect(error.message).toBe('Network failed');
      expect(error.name).toBe('NetworkError');
      expect(error.code).toBe(2);
    });

    it('should be instance of ApiExError', () => {
      const error = new NetworkError('Network failed');
      expect(error).toBeInstanceOf(ApiExError);
      expect(error).toBeInstanceOf(Error);
    });

    it('should handle timeout messages', () => {
      const error = new NetworkError('Request timeout after 30000ms');
      expect(error.message).toContain('timeout');
      expect(error.code).toBe(2);
    });

    it('should handle connection refused messages', () => {
      const error = new NetworkError('Unable to reach http://localhost:3000');
      expect(error.message).toContain('Unable to reach');
      expect(error.code).toBe(2);
    });
  });

  describe('ValidationError', () => {
    it('should create error with code 1', () => {
      const error = new ValidationError('Invalid input');
      expect(error.message).toBe('Invalid input');
      expect(error.name).toBe('ValidationError');
      expect(error.code).toBe(1);
    });

    it('should be instance of ApiExError', () => {
      const error = new ValidationError('Invalid input');
      expect(error).toBeInstanceOf(ApiExError);
      expect(error).toBeInstanceOf(Error);
    });

    it('should handle missing required field errors', () => {
      const error = new ValidationError('Request URL is required');
      expect(error.message).toContain('required');
      expect(error.code).toBe(1);
    });
  });

  describe('ConfigurationError', () => {
    it('should create error with code 1', () => {
      const error = new ConfigurationError('Invalid config');
      expect(error.message).toBe('Invalid config');
      expect(error.name).toBe('ConfigurationError');
      expect(error.code).toBe(1);
    });

    it('should be instance of ApiExError', () => {
      const error = new ConfigurationError('Invalid config');
      expect(error).toBeInstanceOf(ApiExError);
      expect(error).toBeInstanceOf(Error);
    });

    it('should handle unknown environment errors', () => {
      const error = new ConfigurationError('Unknown environment "prod"');
      expect(error.message).toContain('Unknown environment');
      expect(error.code).toBe(1);
    });
  });

  describe('FileSystemError', () => {
    it('should create error with code 2', () => {
      const error = new FileSystemError('File not found');
      expect(error.message).toBe('File not found');
      expect(error.name).toBe('FileSystemError');
      expect(error.code).toBe(2);
    });

    it('should be instance of ApiExError', () => {
      const error = new FileSystemError('File not found');
      expect(error).toBeInstanceOf(ApiExError);
      expect(error).toBeInstanceOf(Error);
    });

    it('should handle permission denied errors', () => {
      const error = new FileSystemError('Permission denied: /etc/passwd');
      expect(error.message).toContain('Permission denied');
      expect(error.code).toBe(2);
    });
  });

  describe('Error Code Consistency', () => {
    it('should use code 1 for user errors', () => {
      expect(new ValidationError('test').code).toBe(1);
      expect(new ConfigurationError('test').code).toBe(1);
    });

    it('should use code 2 for runtime errors', () => {
      expect(new NetworkError('test').code).toBe(2);
      expect(new FileSystemError('test').code).toBe(2);
    });

    it('should allow custom codes for ApiExError', () => {
      const error = new ApiExError('test', 99);
      expect(error.code).toBe(99);
    });
  });

  describe('Error Inheritance', () => {
    it('should allow catching all custom errors as ApiExError', () => {
      const errors = [
        new NetworkError('net'),
        new ValidationError('val'),
        new ConfigurationError('conf'),
        new FileSystemError('fs')
      ];

      errors.forEach(error => {
        expect(error).toBeInstanceOf(ApiExError);
      });
    });

    it('should preserve error type when caught as ApiExError', () => {
      try {
        throw new NetworkError('Network issue');
      } catch (error) {
        if (error instanceof ApiExError) {
          expect(error.name).toBe('NetworkError');
          expect(error.code).toBe(2);
        }
      }
    });
  });

  describe('Error Messages', () => {
    it('should preserve original message', () => {
      const message = 'This is a detailed error message with special chars: @#$%';
      const error = new ApiExError(message);
      expect(error.message).toBe(message);
    });

    it('should handle empty message', () => {
      const error = new ApiExError('');
      expect(error.message).toBe('');
    });

    it('should handle long messages', () => {
      const longMessage = 'A'.repeat(1000);
      const error = new NetworkError(longMessage);
      expect(error.message).toBe(longMessage);
    });
  });
});
