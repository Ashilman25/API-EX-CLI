const printer = require('../../src/core/printer');
const chalk = require('chalk');
const prettyjson = require('prettyjson');
const Table = require('cli-table3');

// Mock console.log to capture output
let consoleOutput = [];
const originalConsoleLog = console.log;

beforeEach(() => {
  // Clear console output before each test
  consoleOutput = [];
  console.log = jest.fn((...args) => {
    consoleOutput.push(args.join(' '));
  });
});

afterEach(() => {
  // Restore console.log after each test
  console.log = originalConsoleLog;
});

describe('Printer Module', () => {
  describe('printSuccess()', () => {
    it('should print success status line with colors', () => {
      const response = {
        status: 200,
        statusText: 'OK',
        durationMs: 150,
        data: { message: 'Success' }
      };

      printer.printSuccess(response, 'GET', 'https://api.example.com/users');

      // Check that status line was printed
      expect(consoleOutput[0]).toContain('GET');
      expect(consoleOutput[0]).toContain('https://api.example.com/users');
      expect(consoleOutput[0]).toContain('200');
      expect(consoleOutput[0]).toContain('OK');
      expect(consoleOutput[0]).toContain('150ms');
    });

    it('should pretty print JSON response data', () => {
      const response = {
        status: 200,
        statusText: 'OK',
        durationMs: 100,
        data: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com'
        }
      };

      printer.printSuccess(response, 'GET', 'https://api.example.com/user/1');

      // Should have called console.log at least twice (status line + data)
      expect(console.log).toHaveBeenCalledTimes(2);

      // Second call should be the prettyjson rendered output
      expect(consoleOutput.length).toBeGreaterThan(1);
    });

    it('should print plain text for non-JSON response', () => {
      const response = {
        status: 200,
        statusText: 'OK',
        durationMs: 75,
        data: 'Plain text response'
      };

      printer.printSuccess(response, 'GET', 'https://api.example.com/text');

      expect(console.log).toHaveBeenCalledTimes(2);
      expect(consoleOutput[1]).toBe('Plain text response');
    });

    it('should handle null or undefined response data', () => {
      const response = {
        status: 204,
        statusText: 'No Content',
        durationMs: 50,
        data: null
      };

      printer.printSuccess(response, 'DELETE', 'https://api.example.com/resource/1');

      expect(console.log).toHaveBeenCalled();
      expect(consoleOutput[0]).toContain('204');
    });

    it('should handle array response data', () => {
      const response = {
        status: 200,
        statusText: 'OK',
        durationMs: 200,
        data: [
          { id: 1, name: 'User 1' },
          { id: 2, name: 'User 2' }
        ]
      };

      printer.printSuccess(response, 'GET', 'https://api.example.com/users');

      expect(console.log).toHaveBeenCalledTimes(2);
      // Array is an object, so it should be pretty-printed
      expect(consoleOutput.length).toBeGreaterThan(1);
    });
  });

  describe('printError()', () => {
    it('should print error status line in red', () => {
      const error = new Error('Network error');

      printer.printError(error, 'GET', 'https://api.example.com/users');

      expect(consoleOutput[0]).toContain('GET');
      expect(consoleOutput[0]).toContain('https://api.example.com/users');
      expect(consoleOutput[0]).toContain('ERROR');
      expect(consoleOutput[1]).toContain('Network error');
    });

    it('should show response status and data snippet when available', () => {
      const error = new Error('Request failed with status code 404');
      error.response = {
        status: 404,
        statusText: 'Not Found',
        data: { error: 'Resource not found', details: 'The requested user does not exist' }
      };

      printer.printError(error, 'GET', 'https://api.example.com/user/999');

      expect(console.log).toHaveBeenCalled();
      expect(consoleOutput.some(line => line.includes('404'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('Not Found'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('Resource not found'))).toBe(true);
    });

    it('should show helpful tip for ENOTFOUND error', () => {
      const error = new Error('getaddrinfo ENOTFOUND invalid-domain.com');
      error.code = 'ENOTFOUND';

      printer.printError(error, 'GET', 'https://invalid-domain.com/api');

      expect(consoleOutput.some(line =>
        line.includes('Check if the URL is correct') ||
        line.includes('internet connectivity')
      )).toBe(true);
    });

    it('should show helpful tip for timeout error', () => {
      const error = new Error('timeout of 30000ms exceeded');
      error.code = 'ETIMEDOUT';

      printer.printError(error, 'GET', 'https://api.example.com/slow');

      expect(consoleOutput.some(line =>
        line.includes('timed out') ||
        line.includes('timeout')
      )).toBe(true);
    });

    it('should show helpful tip for 404 error', () => {
      const error = new Error('Request failed with status code 404');
      error.response = {
        status: 404,
        statusText: 'Not Found',
        data: 'Not found'
      };

      printer.printError(error, 'GET', 'https://api.example.com/unknown');

      expect(consoleOutput.some(line =>
        line.includes('not found') ||
        line.includes('URL path')
      )).toBe(true);
    });

    it('should show helpful tip for 401 error', () => {
      const error = new Error('Request failed with status code 401');
      error.response = {
        status: 401,
        statusText: 'Unauthorized',
        data: { error: 'Invalid credentials' }
      };

      printer.printError(error, 'GET', 'https://api.example.com/protected');

      expect(consoleOutput.some(line =>
        line.includes('Authentication') ||
        line.includes('credentials')
      )).toBe(true);
    });

    it('should truncate long response data to 200 characters', () => {
      const longData = 'A'.repeat(300);
      const error = new Error('Request failed');
      error.response = {
        status: 500,
        statusText: 'Internal Server Error',
        data: longData
      };

      printer.printError(error, 'POST', 'https://api.example.com/data');

      expect(consoleOutput.some(line => line.includes('...'))).toBe(true);
    });

    it('should handle string response data', () => {
      const error = new Error('Bad request');
      error.response = {
        status: 400,
        statusText: 'Bad Request',
        data: 'Invalid input format'
      };

      printer.printError(error, 'POST', 'https://api.example.com/submit');

      expect(consoleOutput.some(line => line.includes('Invalid input format'))).toBe(true);
    });
  });

  describe('printTable()', () => {
    it('should create and print a table with headers and rows', () => {
      const headers = ['Name', 'Method', 'URL'];
      const rows = [
        ['get-users', 'GET', 'https://api.example.com/users'],
        ['create-user', 'POST', 'https://api.example.com/users']
      ];

      printer.printTable(headers, rows);

      expect(console.log).toHaveBeenCalled();
      // Table output should contain header values
      const tableOutput = consoleOutput.join('\n');
      expect(tableOutput).toContain('Name');
      expect(tableOutput).toContain('Method');
      expect(tableOutput).toContain('URL');
    });

    it('should handle empty rows', () => {
      const headers = ['Column1', 'Column2'];
      const rows = [];

      printer.printTable(headers, rows);

      expect(console.log).toHaveBeenCalled();
      // Should still print the table headers
      const tableOutput = consoleOutput.join('\n');
      expect(tableOutput).toContain('Column1');
      expect(tableOutput).toContain('Column2');
    });

    it('should handle single row', () => {
      const headers = ['ID', 'Name'];
      const rows = [
        ['1', 'Test Item']
      ];

      printer.printTable(headers, rows);

      expect(console.log).toHaveBeenCalled();
      const tableOutput = consoleOutput.join('\n');
      expect(tableOutput).toContain('ID');
      expect(tableOutput).toContain('Name');
      expect(tableOutput).toContain('Test Item');
    });

    it('should handle colored values in rows', () => {
      const headers = ['Name', 'Status'];
      const rows = [
        [chalk.cyan('request-1'), chalk.green('200')],
        [chalk.cyan('request-2'), chalk.red('404')]
      ];

      printer.printTable(headers, rows);

      expect(console.log).toHaveBeenCalled();
      // Table should be printed
      expect(consoleOutput.length).toBeGreaterThan(0);
    });
  });

  describe('printDebug()', () => {
    let originalEnv;
    let originalDebug;

    beforeEach(() => {
      // Save original environment
      originalEnv = process.env.API_EX_DEBUG;
      originalDebug = process.env.DEBUG;
    });

    afterEach(() => {
      // Restore original environment
      if (originalEnv === undefined) {
        delete process.env.API_EX_DEBUG;
      } else {
        process.env.API_EX_DEBUG = originalEnv;
      }
      if (originalDebug === undefined) {
        delete process.env.DEBUG;
      } else {
        process.env.DEBUG = originalDebug;
      }
    });

    it('should not print when debug mode is disabled', () => {
      delete process.env.API_EX_DEBUG;
      delete process.env.DEBUG;

      printer.printDebug('Test Label', { key: 'value' });

      expect(console.log).not.toHaveBeenCalled();
    });

    it('should print when API_EX_DEBUG=1', () => {
      process.env.API_EX_DEBUG = '1';

      printer.printDebug('Test Label', { key: 'value' });

      expect(console.log).toHaveBeenCalled();
      expect(consoleOutput[0]).toContain('[DEBUG]');
      expect(consoleOutput[0]).toContain('Test Label');
    });

    it('should print when DEBUG=true', () => {
      process.env.DEBUG = 'true';

      printer.printDebug('Request Config', { method: 'GET', url: 'http://example.com' });

      expect(console.log).toHaveBeenCalled();
      expect(consoleOutput[0]).toContain('[DEBUG]');
      expect(consoleOutput[0]).toContain('Request Config');
    });

    it('should print debug label and data separately', () => {
      process.env.API_EX_DEBUG = '1';

      const debugData = {
        method: 'POST',
        url: 'https://api.example.com/data',
        headers: { 'Content-Type': 'application/json' }
      };

      printer.printDebug('Sending Request', debugData);

      expect(console.log).toHaveBeenCalledTimes(2);
      expect(consoleOutput[0]).toContain('[DEBUG]');
      expect(consoleOutput[0]).toContain('Sending Request');
    });

    it('should not print when API_EX_DEBUG is set to other values', () => {
      process.env.API_EX_DEBUG = '0';
      delete process.env.DEBUG;

      printer.printDebug('Test', { data: 'test' });

      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('should work with all printer functions in sequence', () => {
      // Test success
      printer.printSuccess(
        { status: 200, statusText: 'OK', durationMs: 100, data: { id: 1 } },
        'GET',
        'https://api.example.com/test'
      );

      const successCalls = console.log.mock.calls.length;
      expect(successCalls).toBeGreaterThan(0);

      // Test table
      printer.printTable(['Col1', 'Col2'], [['val1', 'val2']]);

      const tableCalls = console.log.mock.calls.length;
      expect(tableCalls).toBeGreaterThan(successCalls);

      // Test error
      const error = new Error('Test error');
      printer.printError(error, 'POST', 'https://api.example.com/fail');

      const errorCalls = console.log.mock.calls.length;
      expect(errorCalls).toBeGreaterThan(tableCalls);
    });
  });
});
