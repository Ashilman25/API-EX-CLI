/**
 * Tests for ls command
 */

const { Command } = require('commander');
const chalk = require('chalk');
const lsCommand = require('../../src/commands/ls');
const storage = require('../../src/core/storage');
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
jest.mock('../../src/core/printer');

describe('ls command', () => {
  let program;
  let consoleLogSpy;

  beforeEach(() => {
    // Create a fresh commander instance
    program = new Command();
    program.exitOverride();

    // Register the ls command
    lsCommand(program);

    // Spy on console.log
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    printer.printTable.mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('empty requests', () => {
    test('should show message when no requests saved', async () => {
      storage.getRequests.mockReturnValue([]);

      await program.parseAsync(['node', 'test', 'ls']);

      expect(storage.getRequests).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No saved requests'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('api-ex save'));
      expect(printer.printTable).not.toHaveBeenCalled();
    });
  });

  describe('listing requests', () => {
    test('should list all requests in normal mode', async () => {
      const mockRequests = [
        {
          name: 'get-users',
          method: 'GET',
          url: 'https://api.example.com/users',
          headers: [],
          data: ''
        },
        {
          name: 'create-user',
          method: 'POST',
          url: 'https://api.example.com/users',
          headers: ['Content-Type: application/json'],
          data: '{"name":"test"}'
        },
        {
          name: 'update-user',
          method: 'PUT',
          url: 'https://api.example.com/users/1',
          headers: [],
          data: ''
        }
      ];

      storage.getRequests.mockReturnValue(mockRequests);

      await program.parseAsync(['node', 'test', 'ls']);

      expect(storage.getRequests).toHaveBeenCalled();
      expect(printer.printTable).toHaveBeenCalledWith(
        ['Name', 'Method', 'URL'],
        expect.arrayContaining([
          expect.arrayContaining(['get-users', 'GET', 'https://api.example.com/users']),
          expect.arrayContaining(['create-user', 'POST', 'https://api.example.com/users']),
          expect.arrayContaining(['update-user', 'PUT', 'https://api.example.com/users/1'])
        ])
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total: 3 request(s)'));
    });

    test('should list single request', async () => {
      const mockRequests = [
        {
          name: 'only-request',
          method: 'GET',
          url: 'https://api.example.com/test',
          headers: [],
          data: ''
        }
      ];

      storage.getRequests.mockReturnValue(mockRequests);

      await program.parseAsync(['node', 'test', 'ls']);

      expect(printer.printTable).toHaveBeenCalledWith(
        ['Name', 'Method', 'URL'],
        expect.arrayContaining([
          expect.arrayContaining(['only-request', 'GET', 'https://api.example.com/test'])
        ])
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total: 1 request(s)'));
    });
  });

  describe('verbose mode', () => {
    test('should show detailed information in verbose mode', async () => {
      const mockRequests = [
        {
          name: 'test-request',
          method: 'POST',
          url: 'https://api.example.com/data',
          headers: ['Authorization: Bearer token', 'Content-Type: application/json'],
          data: '{"key":"value"}'
        }
      ];

      storage.getRequests.mockReturnValue(mockRequests);

      await program.parseAsync(['node', 'test', 'ls', '--verbose']);

      expect(printer.printTable).toHaveBeenCalledWith(
        ['Name', 'Method', 'URL', 'Headers', 'Body'],
        expect.arrayContaining([
          expect.arrayContaining([
            'test-request',
            'POST',
            'https://api.example.com/data',
            '2',
            '{"key":"value"}'
          ])
        ])
      );
    });

    test('should show dash for missing headers and body in verbose mode', async () => {
      const mockRequests = [
        {
          name: 'simple-get',
          method: 'GET',
          url: 'https://api.example.com/test',
          headers: [],
          data: ''
        }
      ];

      storage.getRequests.mockReturnValue(mockRequests);

      await program.parseAsync(['node', 'test', 'ls', '--verbose']);

      expect(printer.printTable).toHaveBeenCalledWith(
        ['Name', 'Method', 'URL', 'Headers', 'Body'],
        expect.arrayContaining([
          expect.arrayContaining([
            'simple-get',
            'GET',
            'https://api.example.com/test',
            '-',
            '-'
          ])
        ])
      );
    });

    test('should truncate long URLs in verbose mode', async () => {
      const longUrl = 'https://api.example.com/very/long/path/that/exceeds/forty/characters/definitely';
      const mockRequests = [
        {
          name: 'long-url',
          method: 'GET',
          url: longUrl,
          headers: [],
          data: ''
        }
      ];

      storage.getRequests.mockReturnValue(mockRequests);

      await program.parseAsync(['node', 'test', 'ls', '--verbose']);

      // Check that URL was truncated
      const tableCall = printer.printTable.mock.calls[0];
      const rows = tableCall[1];
      const urlColumn = rows[0][2];

      expect(urlColumn).toHaveLength(43); // 40 chars + '...'
      expect(urlColumn).toContain('...');
    });

    test('should truncate long body data in verbose mode', async () => {
      const longBody = '{"data":"' + 'a'.repeat(100) + '"}';
      const mockRequests = [
        {
          name: 'long-body',
          method: 'POST',
          url: 'https://api.example.com/test',
          headers: [],
          data: longBody
        }
      ];

      storage.getRequests.mockReturnValue(mockRequests);

      await program.parseAsync(['node', 'test', 'ls', '--verbose']);

      // Check that body was truncated
      const tableCall = printer.printTable.mock.calls[0];
      const rows = tableCall[1];
      const bodyColumn = rows[0][4];

      expect(bodyColumn).toHaveLength(23); // 20 chars + '...'
      expect(bodyColumn).toContain('...');
    });
  });

  describe('filtering', () => {
    const mockRequests = [
      {
        name: 'get-users',
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: [],
        data: ''
      },
      {
        name: 'get-posts',
        method: 'GET',
        url: 'https://api.example.com/posts',
        headers: [],
        data: ''
      },
      {
        name: 'create-user',
        method: 'POST',
        url: 'https://api.example.com/users',
        headers: [],
        data: ''
      }
    ];

    test('should filter requests by name', async () => {
      storage.getRequests.mockReturnValue(mockRequests);

      await program.parseAsync(['node', 'test', 'ls', '--filter', 'user']);

      expect(printer.printTable).toHaveBeenCalled();
      const tableCall = printer.printTable.mock.calls[0];
      const rows = tableCall[1];

      expect(rows).toHaveLength(2); // get-users and create-user
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total: 2 request(s)'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total saved: 3'));
    });

    test('should be case-insensitive when filtering', async () => {
      storage.getRequests.mockReturnValue(mockRequests);

      await program.parseAsync(['node', 'test', 'ls', '--filter', 'POST']);

      expect(printer.printTable).toHaveBeenCalled();
      const tableCall = printer.printTable.mock.calls[0];
      const rows = tableCall[1];

      expect(rows).toHaveLength(1); // only get-posts contains 'POST'
      expect(rows[0]).toEqual(expect.arrayContaining(['get-posts']));
    });

    test('should show message when filter returns no results', async () => {
      storage.getRequests.mockReturnValue(mockRequests);

      await program.parseAsync(['node', 'test', 'ls', '--filter', 'non-existent']);

      expect(printer.printTable).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No requests found matching'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('non-existent'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total saved requests: 3'));
    });

    test('should filter with partial matches', async () => {
      storage.getRequests.mockReturnValue(mockRequests);

      await program.parseAsync(['node', 'test', 'ls', '--filter', 'get']);

      expect(printer.printTable).toHaveBeenCalled();
      const tableCall = printer.printTable.mock.calls[0];
      const rows = tableCall[1];

      expect(rows).toHaveLength(2); // get-users and get-posts
    });
  });

  describe('combined filters and verbose', () => {
    test('should work with both filter and verbose', async () => {
      const mockRequests = [
        {
          name: 'api-get-users',
          method: 'GET',
          url: 'https://api.example.com/users',
          headers: ['Authorization: token'],
          data: ''
        },
        {
          name: 'api-get-posts',
          method: 'GET',
          url: 'https://api.example.com/posts',
          headers: [],
          data: ''
        },
        {
          name: 'web-get-page',
          method: 'GET',
          url: 'https://web.example.com/page',
          headers: [],
          data: ''
        }
      ];

      storage.getRequests.mockReturnValue(mockRequests);

      await program.parseAsync(['node', 'test', 'ls', '--filter', 'api', '--verbose']);

      expect(printer.printTable).toHaveBeenCalledWith(
        ['Name', 'Method', 'URL', 'Headers', 'Body'],
        expect.any(Array)
      );

      const tableCall = printer.printTable.mock.calls[0];
      const rows = tableCall[1];

      expect(rows).toHaveLength(2); // api-get-users and api-get-posts
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total: 2 request(s)'));
    });
  });

  describe('edge cases', () => {
    test('should handle requests with undefined headers', async () => {
      const mockRequests = [
        {
          name: 'no-headers',
          method: 'GET',
          url: 'https://api.example.com/test',
          // headers property not defined
          data: ''
        }
      ];

      storage.getRequests.mockReturnValue(mockRequests);

      await program.parseAsync(['node', 'test', 'ls', '--verbose']);

      expect(printer.printTable).toHaveBeenCalled();
      const tableCall = printer.printTable.mock.calls[0];
      const rows = tableCall[1];
      const headersColumn = rows[0][3];

      expect(headersColumn).toBe('-');
    });

    test('should handle requests with null data', async () => {
      const mockRequests = [
        {
          name: 'null-data',
          method: 'GET',
          url: 'https://api.example.com/test',
          headers: [],
          data: null
        }
      ];

      storage.getRequests.mockReturnValue(mockRequests);

      await program.parseAsync(['node', 'test', 'ls', '--verbose']);

      expect(printer.printTable).toHaveBeenCalled();
      const tableCall = printer.printTable.mock.calls[0];
      const rows = tableCall[1];
      const bodyColumn = rows[0][4];

      expect(bodyColumn).toBe('-');
    });

    test('should handle many requests', async () => {
      const mockRequests = Array.from({ length: 50 }, (_, i) => ({
        name: `request-${i}`,
        method: i % 2 === 0 ? 'GET' : 'POST',
        url: `https://api.example.com/endpoint-${i}`,
        headers: [],
        data: ''
      }));

      storage.getRequests.mockReturnValue(mockRequests);

      await program.parseAsync(['node', 'test', 'ls']);

      expect(printer.printTable).toHaveBeenCalled();
      const tableCall = printer.printTable.mock.calls[0];
      const rows = tableCall[1];

      expect(rows).toHaveLength(50);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total: 50 request(s)'));
    });

    test('should not show filter message when all requests match filter', async () => {
      const mockRequests = [
        {
          name: 'api-get-users',
          method: 'GET',
          url: 'https://api.example.com/users',
          headers: [],
          data: ''
        },
        {
          name: 'api-get-posts',
          method: 'GET',
          url: 'https://api.example.com/posts',
          headers: [],
          data: ''
        }
      ];

      storage.getRequests.mockReturnValue(mockRequests);

      await program.parseAsync(['node', 'test', 'ls', '--filter', 'api']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total: 2 request(s)'));

      // Should not show "Showing filtered results" since all match
      const filterMessage = consoleLogSpy.mock.calls.find(call =>
        call[0].includes('Showing filtered results')
      );
      expect(filterMessage).toBeUndefined();
    });
  });

  describe('color formatting', () => {
    test('should use cyan for request names', async () => {
      const mockRequests = [
        {
          name: 'test-request',
          method: 'GET',
          url: 'https://api.example.com/test',
          headers: [],
          data: ''
        }
      ];

      storage.getRequests.mockReturnValue(mockRequests);

      await program.parseAsync(['node', 'test', 'ls']);

      expect(chalk.cyan).toHaveBeenCalledWith('test-request');
    });

    test('should use yellow for methods', async () => {
      const mockRequests = [
        {
          name: 'test-request',
          method: 'POST',
          url: 'https://api.example.com/test',
          headers: [],
          data: ''
        }
      ];

      storage.getRequests.mockReturnValue(mockRequests);

      await program.parseAsync(['node', 'test', 'ls']);

      expect(chalk.yellow).toHaveBeenCalledWith('POST');
    });
  });
});
