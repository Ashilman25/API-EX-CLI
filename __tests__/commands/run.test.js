/**
 * Tests for run command
 */

const { Command } = require('commander');
const chalk = require('chalk');
const runCommand = require('../../src/commands/run');
const storage = require('../../src/core/storage');
const http = require('../../src/core/http');
const env = require('../../src/core/env');
const history = require('../../src/core/history');
const printer = require('../../src/core/printer');

// Mock dependencies
jest.mock('chalk', () => ({
  red: jest.fn((text) => text),
  green: jest.fn((text) => text),
  yellow: jest.fn((text) => text),
  gray: jest.fn((text) => text),
  cyan: jest.fn((text) => text),
}));

jest.mock('../../src/core/storage');
jest.mock('../../src/core/http');
jest.mock('../../src/core/env');
jest.mock('../../src/core/history');
jest.mock('../../src/core/printer');

// Mock ora spinner
jest.mock('ora', () => {
  return jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis(),
  }));
});

describe('run command', () => {
  let program;
  let consoleLogSpy;
  let processExitSpy;

  beforeEach(() => {
    // Create a fresh commander instance
    program = new Command();
    program.exitOverride();

    // Register the run command
    runCommand(program);

    // Spy on console.log
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    // Spy on process.exit
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation();

    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    printer.printSuccess.mockImplementation(() => {});
    printer.printError.mockImplementation(() => {});
    printer.printDebug.mockImplementation(() => {});
    history.recordHistory.mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('basic functionality', () => {
    test('should run existing request successfully', async () => {
      const savedRequest = {
        name: 'test-request',
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: [],
        data: ''
      };

      const mockResponse = {
        status: 200,
        statusText: 'OK',
        data: { users: [] },
        durationMs: 150
      };

      storage.getRequestByName.mockReturnValue(savedRequest);
      http.sendRequest.mockResolvedValue(mockResponse);

      await program.parseAsync(['node', 'test', 'run', 'test-request']);

      expect(storage.getRequestByName).toHaveBeenCalledWith('test-request');
      expect(http.sendRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: {},
        data: ''
      });
      expect(printer.printSuccess).toHaveBeenCalledWith(mockResponse, 'GET', 'https://api.example.com/users');
      expect(history.recordHistory).toHaveBeenCalled();
    });

    test('should run request with headers', async () => {
      const savedRequest = {
        name: 'auth-request',
        method: 'GET',
        url: 'https://api.example.com/protected',
        headers: ['Authorization: Bearer token123', 'Content-Type: application/json'],
        data: ''
      };

      const mockResponse = {
        status: 200,
        statusText: 'OK',
        data: {},
        durationMs: 100
      };

      storage.getRequestByName.mockReturnValue(savedRequest);
      http.sendRequest.mockResolvedValue(mockResponse);

      await program.parseAsync(['node', 'test', 'run', 'auth-request']);

      expect(http.sendRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: 'https://api.example.com/protected',
        headers: {
          'Authorization': 'Bearer token123',
          'Content-Type': 'application/json'
        },
        data: ''
      });
    });

    test('should run POST request with body', async () => {
      const savedRequest = {
        name: 'create-user',
        method: 'POST',
        url: 'https://api.example.com/users',
        headers: ['Content-Type: application/json'],
        data: '{"name":"John","email":"john@example.com"}'
      };

      const mockResponse = {
        status: 201,
        statusText: 'Created',
        data: { id: 1, name: 'John' },
        durationMs: 200
      };

      storage.getRequestByName.mockReturnValue(savedRequest);
      http.sendRequest.mockResolvedValue(mockResponse);

      await program.parseAsync(['node', 'test', 'run', 'create-user']);

      expect(http.sendRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: 'https://api.example.com/users',
        headers: {
          'Content-Type': 'application/json'
        },
        data: '{"name":"John","email":"john@example.com"}'
      });
    });
  });

  describe('request not found', () => {
    test('should error when request does not exist', async () => {
      storage.getRequestByName.mockReturnValue(null);

      try {
        await program.parseAsync(['node', 'test', 'run', 'non-existent']);
      } catch (err) {
        // Commander will throw when exitOverride is used
      }

      expect(storage.getRequestByName).toHaveBeenCalledWith('non-existent');
      expect(processExitSpy).toHaveBeenCalledWith(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No saved request found'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('non-existent'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('api-ex ls'));
    });
  });

  describe('overrides', () => {
    test('should override headers', async () => {
      const savedRequest = {
        name: 'test-request',
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: ['Authorization: Bearer old-token'],
        data: ''
      };

      const mockResponse = {
        status: 200,
        statusText: 'OK',
        data: {},
        durationMs: 100
      };

      storage.getRequestByName.mockReturnValue(savedRequest);
      http.sendRequest.mockResolvedValue(mockResponse);

      await program.parseAsync([
        'node', 'test', 'run', 'test-request',
        '-H', 'Authorization: Bearer new-token'
      ]);

      expect(http.sendRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: {
          'Authorization': 'Bearer new-token'
        },
        data: ''
      });
    });

    test('should add new headers via override', async () => {
      const savedRequest = {
        name: 'test-request',
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: ['Authorization: Bearer token'],
        data: ''
      };

      const mockResponse = {
        status: 200,
        statusText: 'OK',
        data: {},
        durationMs: 100
      };

      storage.getRequestByName.mockReturnValue(savedRequest);
      http.sendRequest.mockResolvedValue(mockResponse);

      await program.parseAsync([
        'node', 'test', 'run', 'test-request',
        '-H', 'X-Custom-Header: custom-value'
      ]);

      expect(http.sendRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: {
          'Authorization': 'Bearer token',
          'X-Custom-Header': 'custom-value'
        },
        data: ''
      });
    });

    test('should override body data', async () => {
      const savedRequest = {
        name: 'update-user',
        method: 'PUT',
        url: 'https://api.example.com/users/1',
        headers: [],
        data: '{"name":"Old Name"}'
      };

      const mockResponse = {
        status: 200,
        statusText: 'OK',
        data: {},
        durationMs: 150
      };

      storage.getRequestByName.mockReturnValue(savedRequest);
      http.sendRequest.mockResolvedValue(mockResponse);

      await program.parseAsync([
        'node', 'test', 'run', 'update-user',
        '--data', '{"name":"New Name"}'
      ]);

      expect(http.sendRequest).toHaveBeenCalledWith({
        method: 'PUT',
        url: 'https://api.example.com/users/1',
        headers: {},
        data: '{"name":"New Name"}'
      });
    });

    test('should override both headers and data', async () => {
      const savedRequest = {
        name: 'test-request',
        method: 'POST',
        url: 'https://api.example.com/data',
        headers: ['Content-Type: text/plain'],
        data: 'old data'
      };

      const mockResponse = {
        status: 200,
        statusText: 'OK',
        data: {},
        durationMs: 100
      };

      storage.getRequestByName.mockReturnValue(savedRequest);
      http.sendRequest.mockResolvedValue(mockResponse);

      await program.parseAsync([
        'node', 'test', 'run', 'test-request',
        '-H', 'Content-Type: application/json',
        '--data', '{"new":"data"}'
      ]);

      expect(http.sendRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: 'https://api.example.com/data',
        headers: {
          'Content-Type': 'application/json'
        },
        data: '{"new":"data"}'
      });
    });
  });

  describe('environment interpolation', () => {
    test('should interpolate request with environment', async () => {
      const savedRequest = {
        name: 'env-request',
        method: 'GET',
        url: '{{BASE_URL}}/users',
        headers: ['Authorization: Bearer {{AUTH_TOKEN}}'],
        data: ''
      };

      const mockEnv = {
        BASE_URL: 'https://api.example.com',
        AUTH_TOKEN: 'secret-token-123'
      };

      const interpolatedRequest = {
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: {
          'Authorization': 'Bearer secret-token-123'
        },
        data: ''
      };

      const mockResponse = {
        status: 200,
        statusText: 'OK',
        data: {},
        durationMs: 100
      };

      storage.getRequestByName.mockReturnValue(savedRequest);
      env.getEnv.mockReturnValue(mockEnv);
      env.interpolateRequest.mockReturnValue(interpolatedRequest);
      http.sendRequest.mockResolvedValue(mockResponse);

      await program.parseAsync([
        'node', 'test', 'run', 'env-request',
        '--env', 'dev'
      ]);

      expect(env.getEnv).toHaveBeenCalledWith('dev');
      expect(env.interpolateRequest).toHaveBeenCalled();
      expect(http.sendRequest).toHaveBeenCalledWith(interpolatedRequest);
    });

    test('should error on unknown environment', async () => {
      const savedRequest = {
        name: 'test-request',
        method: 'GET',
        url: '{{BASE_URL}}/users',
        headers: [],
        data: ''
      };

      storage.getRequestByName.mockReturnValue(savedRequest);
      env.getEnv.mockImplementation(() => {
        throw new Error("Unknown environment 'unknown'. Define it with 'api-ex env add unknown ...'");
      });

      try {
        await program.parseAsync([
          'node', 'test', 'run', 'test-request',
          '--env', 'unknown'
        ]);
      } catch (err) {
        // Commander will throw when exitOverride is used
      }

      expect(env.getEnv).toHaveBeenCalledWith('unknown');
      expect(processExitSpy).toHaveBeenCalledWith(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown environment'));
    });

    test('should combine environment and overrides', async () => {
      const savedRequest = {
        name: 'env-request',
        method: 'POST',
        url: '{{BASE_URL}}/users',
        headers: ['Authorization: Bearer {{AUTH_TOKEN}}'],
        data: '{"env":"{{ENV_NAME}}"}'
      };

      const mockEnv = {
        BASE_URL: 'https://api.example.com',
        AUTH_TOKEN: 'token-123',
        ENV_NAME: 'development'
      };

      // After overrides are applied and then interpolated
      const interpolatedRequest = {
        method: 'POST',
        url: 'https://api.example.com/users',
        headers: {
          'Authorization': 'Bearer token-123',
          'X-Custom': 'value'
        },
        data: '{"override":"data"}'
      };

      const mockResponse = {
        status: 201,
        statusText: 'Created',
        data: {},
        durationMs: 100
      };

      storage.getRequestByName.mockReturnValue(savedRequest);
      env.getEnv.mockReturnValue(mockEnv);
      env.interpolateRequest.mockReturnValue(interpolatedRequest);
      http.sendRequest.mockResolvedValue(mockResponse);

      await program.parseAsync([
        'node', 'test', 'run', 'env-request',
        '--env', 'dev',
        '-H', 'X-Custom: value',
        '--data', '{"override":"data"}'
      ]);

      // Overrides are applied BEFORE interpolation, so interpolation receives the overridden values
      expect(http.sendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://api.example.com/users',
          data: '{"override":"data"}',
          headers: expect.objectContaining({
            'X-Custom': 'value'
          })
        })
      );
    });
  });

  describe('history recording', () => {
    test('should record history with savedRequestName', async () => {
      const savedRequest = {
        name: 'my-request',
        method: 'GET',
        url: 'https://api.example.com/test',
        headers: [],
        data: ''
      };

      const mockResponse = {
        status: 200,
        statusText: 'OK',
        data: {},
        durationMs: 123
      };

      storage.getRequestByName.mockReturnValue(savedRequest);
      http.sendRequest.mockResolvedValue(mockResponse);

      await program.parseAsync(['node', 'test', 'run', 'my-request']);

      expect(history.recordHistory).toHaveBeenCalledWith({
        method: 'GET',
        url: 'https://api.example.com/test',
        status: 200,
        durationMs: 123,
        env: null,
        savedRequestName: 'my-request'
      });
    });

    test('should record history with environment name', async () => {
      const savedRequest = {
        name: 'env-request',
        method: 'GET',
        url: '{{BASE_URL}}/test',
        headers: [],
        data: ''
      };

      const mockEnv = {
        BASE_URL: 'https://api.example.com'
      };

      const interpolatedRequest = {
        method: 'GET',
        url: 'https://api.example.com/test',
        headers: {},
        data: ''
      };

      const mockResponse = {
        status: 200,
        statusText: 'OK',
        data: {},
        durationMs: 100
      };

      storage.getRequestByName.mockReturnValue(savedRequest);
      env.getEnv.mockReturnValue(mockEnv);
      env.interpolateRequest.mockReturnValue(interpolatedRequest);
      http.sendRequest.mockResolvedValue(mockResponse);

      await program.parseAsync([
        'node', 'test', 'run', 'env-request',
        '--env', 'production'
      ]);

      expect(history.recordHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          env: 'production',
          savedRequestName: 'env-request'
        })
      );
    });
  });

  describe('error handling', () => {
    test('should handle HTTP errors', async () => {
      const savedRequest = {
        name: 'test-request',
        method: 'GET',
        url: 'https://api.example.com/error',
        headers: [],
        data: ''
      };

      const mockError = new Error('Network Error');

      storage.getRequestByName.mockReturnValue(savedRequest);
      http.sendRequest.mockRejectedValue(mockError);

      try {
        await program.parseAsync(['node', 'test', 'run', 'test-request']);
      } catch (err) {
        // Commander will throw when exitOverride is used
      }

      expect(printer.printError).toHaveBeenCalledWith(mockError, 'GET', 'https://api.example.com/error');
      expect(processExitSpy).toHaveBeenCalledWith(2);
    });

    test('should handle invalid header format', async () => {
      const savedRequest = {
        name: 'bad-headers',
        method: 'GET',
        url: 'https://api.example.com/test',
        headers: ['InvalidHeaderNoColon'],
        data: ''
      };

      const mockResponse = {
        status: 200,
        statusText: 'OK',
        data: {},
        durationMs: 100
      };

      storage.getRequestByName.mockReturnValue(savedRequest);
      http.sendRequest.mockResolvedValue(mockResponse);

      await program.parseAsync(['node', 'test', 'run', 'bad-headers']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid header format'));
      // Should still send request with empty headers
      expect(http.sendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {}
        })
      );
    });
  });

  describe('edge cases', () => {
    test('should handle request with no headers', async () => {
      const savedRequest = {
        name: 'no-headers',
        method: 'GET',
        url: 'https://api.example.com/test',
        headers: [],
        data: ''
      };

      const mockResponse = {
        status: 200,
        statusText: 'OK',
        data: {},
        durationMs: 100
      };

      storage.getRequestByName.mockReturnValue(savedRequest);
      http.sendRequest.mockResolvedValue(mockResponse);

      await program.parseAsync(['node', 'test', 'run', 'no-headers']);

      expect(http.sendRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: 'https://api.example.com/test',
        headers: {},
        data: ''
      });
    });

    test('should handle request with undefined headers', async () => {
      const savedRequest = {
        name: 'undefined-headers',
        method: 'GET',
        url: 'https://api.example.com/test',
        // headers property not defined
        data: ''
      };

      const mockResponse = {
        status: 200,
        statusText: 'OK',
        data: {},
        durationMs: 100
      };

      storage.getRequestByName.mockReturnValue(savedRequest);
      http.sendRequest.mockResolvedValue(mockResponse);

      await program.parseAsync(['node', 'test', 'run', 'undefined-headers']);

      expect(http.sendRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: 'https://api.example.com/test',
        headers: {},
        data: ''
      });
    });

    test('should handle multiple header overrides', async () => {
      const savedRequest = {
        name: 'test-request',
        method: 'GET',
        url: 'https://api.example.com/test',
        headers: [],
        data: ''
      };

      const mockResponse = {
        status: 200,
        statusText: 'OK',
        data: {},
        durationMs: 100
      };

      storage.getRequestByName.mockReturnValue(savedRequest);
      http.sendRequest.mockResolvedValue(mockResponse);

      await program.parseAsync([
        'node', 'test', 'run', 'test-request',
        '-H', 'Header1: value1',
        '-H', 'Header2: value2',
        '-H', 'Header3: value3'
      ]);

      expect(http.sendRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: 'https://api.example.com/test',
        headers: {
          'Header1': 'value1',
          'Header2': 'value2',
          'Header3': 'value3'
        },
        data: ''
      });
    });
  });
});
