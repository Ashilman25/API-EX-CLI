const http = require('../../src/core/http');
const env = require('../../src/core/env');
const history = require('../../src/core/history');
const printer = require('../../src/core/printer');

// Mock all core modules
jest.mock('../../src/core/http');
jest.mock('../../src/core/env');
jest.mock('../../src/core/history', () => ({
  recordHistory: jest.fn(),
  getHistory: jest.fn()
}));
jest.mock('../../src/core/debug');
jest.mock('../../src/core/printer', () => ({
  printSuccess: jest.fn(),
  printError: jest.fn(),
  printDebug: jest.fn(),
  printTable: jest.fn()
}));
jest.mock('../../src/core/validation', () => ({
  validateUrl: jest.fn((url) => url),
  validateHttpMethod: jest.fn((method) => method.toUpperCase()),
  validateTimeout: jest.fn((timeout) => parseInt(timeout)),
  validateJsonData: jest.fn((data) => data),
  validateEnvironmentName: jest.fn((name) => name)
}));
jest.mock('ora', () => {
  return jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis()
  }));
});
jest.mock('chalk', () => ({
  red: jest.fn((text) => text),
  green: jest.fn((text) => text),
  yellow: jest.fn((text) => text),
  gray: jest.fn((text) => text),
  cyan: jest.fn((text) => text),
  blue: jest.fn((text) => text),
  magenta: jest.fn((text) => text),
  white: jest.fn((text) => text),
  bold: jest.fn((text) => text),
  dim: jest.fn((text) => text)
}));

// Import after mocking
const requestModule = require('../../src/commands/request');
const { Command } = require('commander');

//Mock console and process.exit
let consoleOutput = [];
const originalConsoleLog = console.log;
const originalProcessExit = process.exit;

beforeEach(() => {
  jest.clearAllMocks();

  consoleOutput = [];
  console.log = jest.fn((...args) => {
    consoleOutput.push(args.join(' '));
  });

  process.exit = jest.fn((code) => {
    throw new Error(`Process exited with code ${code}`);
  });
});

afterEach(() => {
  console.log = originalConsoleLog;
  process.exit = originalProcessExit;
});

describe('Request Command', () => {
  describe('sendRequest integration', () => {
    it('should send a successful GET request with all required fields', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        durationMs: 150,
        data: { message: 'Success' }
      };

      http.sendRequest.mockResolvedValue(mockResponse);

      const program = new Command();
      program.exitOverride();
      requestModule(program);

      await program.parseAsync(['request', '--url', 'https://api.example.com/users'], { from: 'user' });

      expect(http.sendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: 'https://api.example.com/users',
          headers: {},
          data: undefined,
          timeout: 30000
        })
      );

      expect(printer.printSuccess).toHaveBeenCalledWith(
        mockResponse,
        'GET',
        'https://api.example.com/users'
      );

      expect(history.recordHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: 'https://api.example.com/users',
          status: 200,
          durationMs: 150,
          env: null
        })
      );
    });

    it('should send POST request with body and headers', async () => {
      const mockResponse = {
        status: 201,
        statusText: 'Created',
        durationMs: 200,
        data: { id: 1, name: 'New User' }
      };

      http.sendRequest.mockResolvedValue(mockResponse);

      const program = new Command();
      program.exitOverride();
      requestModule(program);

      await program.parseAsync([
        'request',
        '--method', 'POST',
        '--url', 'https://api.example.com/users',
        '--header', 'Content-Type: application/json',
        '--header', 'Authorization: Bearer token123',
        '--data', '{"name":"John"}'
      ], { from: 'user' });

      expect(http.sendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: 'https://api.example.com/users',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer token123'
          },
          data: '{"name":"John"}',
          timeout: 30000
        })
      );

      expect(printer.printSuccess).toHaveBeenCalled();
      expect(history.recordHistory).toHaveBeenCalled();
    });

    it('should use custom timeout', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        durationMs: 100,
        data: {}
      };

      http.sendRequest.mockResolvedValue(mockResponse);

      const program = new Command();
      program.exitOverride();
      requestModule(program);

      await program.parseAsync([
        'request',
        '--url', 'https://api.example.com/slow',
        '--timeout', '60000'
      ], { from: 'user' });

      expect(http.sendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 60000
        })
      );
    });
  });

  describe('Validation', () => {
    it('should exit with error when URL is missing', async () => {
      const program = new Command();
      requestModule(program);

      try {
        await program.parseAsync(['request'], { from: 'user' });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Process exited with code 1');
        expect(consoleOutput.some(line => line.includes('--url is required'))).toBe(true);
      }
    });
  });

  describe('Environment Interpolation', () => {
    it('should interpolate request with environment variables', async () => {
      const mockEnv = {
        BASE_URL: 'https://api.example.com',
        AUTH_TOKEN: 'secret-token'
      };

      const mockInterpolatedRequest = {
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: {
          'Authorization': 'Bearer secret-token'
        },
        data: undefined,
        timeout: 30000
      };

      const mockResponse = {
        status: 200,
        statusText: 'OK',
        durationMs: 120,
        data: {}
      };

      env.getEnv.mockReturnValue(mockEnv);
      env.interpolateRequest.mockReturnValue(mockInterpolatedRequest);
      http.sendRequest.mockResolvedValue(mockResponse);

      const program = new Command();
      program.exitOverride();
      requestModule(program);

      await program.parseAsync([
        'request',
        '--url', '{{BASE_URL}}/users',
        '--header', 'Authorization: Bearer {{AUTH_TOKEN}}',
        '--env', 'dev'
      ], { from: 'user' });

      expect(env.getEnv).toHaveBeenCalledWith('dev');
      expect(env.interpolateRequest).toHaveBeenCalled();
      expect(http.sendRequest).toHaveBeenCalledWith(mockInterpolatedRequest);

      expect(history.recordHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          env: 'dev'
        })
      );
    });

    it('should handle unknown environment error', async () => {
      env.getEnv.mockImplementation(() => {
        throw new Error("Unknown environment 'unknown'");
      });

      const program = new Command();
      requestModule(program);

      try {
        await program.parseAsync([
          'request',
          '--url', 'https://api.example.com/users',
          '--env', 'unknown'
        ], { from: 'user' });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Process exited with code 1');
        expect(env.getEnv).toHaveBeenCalledWith('unknown');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      networkError.code = 'ENOTFOUND';

      http.sendRequest.mockRejectedValue(networkError);

      const program = new Command();
      requestModule(program);

      try {
        await program.parseAsync([
          'request',
          '--url', 'https://invalid-domain.com/api'
        ], { from: 'user' });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Process exited with code 2');
        expect(printer.printError).toHaveBeenCalledWith(
          networkError,
          'GET',
          'https://invalid-domain.com/api'
        );
      }
    });

    it('should handle HTTP error responses', async () => {
      const httpError = new Error('Request failed with status code 404');
      httpError.response = {
        status: 404,
        statusText: 'Not Found',
        data: { error: 'Resource not found' }
      };

      http.sendRequest.mockRejectedValue(httpError);

      const program = new Command();
      requestModule(program);

      try {
        await program.parseAsync([
          'request',
          '--url', 'https://api.example.com/users/999'
        ], { from: 'user' });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Process exited with code 2');
        expect(printer.printError).toHaveBeenCalled();
      }
    });
  });

  describe('Header Parsing', () => {
    it('should parse multiple headers correctly', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        durationMs: 100,
        data: {}
      };

      http.sendRequest.mockResolvedValue(mockResponse);

      const program = new Command();
      program.exitOverride();
      requestModule(program);

      await program.parseAsync([
        'request',
        '--url', 'https://api.example.com/users',
        '--header', 'Content-Type: application/json',
        '--header', 'Authorization: Bearer token',
        '--header', 'X-Custom-Header: custom-value'
      ], { from: 'user' });

      expect(http.sendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer token',
            'X-Custom-Header': 'custom-value'
          }
        })
      );
    });

    it('should warn about invalid header format', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        durationMs: 100,
        data: {}
      };

      http.sendRequest.mockResolvedValue(mockResponse);

      const program = new Command();
      program.exitOverride();
      requestModule(program);

      await program.parseAsync([
        'request',
        '--url', 'https://api.example.com/users',
        '--header', 'InvalidHeader'
      ], { from: 'user' });

      expect(consoleOutput.some(line => line.includes('Invalid header format'))).toBe(true);
    });

    it('should handle headers with colons in value', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        durationMs: 100,
        data: {}
      };

      http.sendRequest.mockResolvedValue(mockResponse);

      const program = new Command();
      program.exitOverride();
      requestModule(program);

      await program.parseAsync([
        'request',
        '--url', 'https://api.example.com/users',
        '--header', 'Authorization: Bearer token:with:colons'
      ], { from: 'user' });

      expect(http.sendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer token:with:colons'
          }
        })
      );
    });
  });

  describe('Different HTTP Methods', () => {
    it('should handle different HTTP methods', async () => {
      const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

      for (const method of methods) {
        jest.clearAllMocks();

        const mockResponse = {
          status: 200,
          statusText: 'OK',
          durationMs: 100,
          data: {}
        };

        http.sendRequest.mockResolvedValue(mockResponse);
  
        const program = new Command();
        program.exitOverride();
        requestModule(program);

        await program.parseAsync([
          'request',
          '--method', method,
          '--url', 'https://api.example.com/test'
        ], { from: 'user' });

        expect(http.sendRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            method: method.toUpperCase()
          })
        );
      }
    });
  });
});
