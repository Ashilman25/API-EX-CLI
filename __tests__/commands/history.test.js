/**
 * Tests for history command
 */

const { Command } = require('commander');
const chalk = require('chalk');
const historyCommand = require('../../src/commands/history');
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

jest.mock('../../src/core/history');
jest.mock('../../src/core/printer');

describe('history command', () => {
  let program;
  let consoleLogSpy;

  beforeEach(() => {
    // Create a fresh commander instance
    program = new Command();
    program.exitOverride();

    // Register the history command
    historyCommand(program);

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

  describe('empty history', () => {
    test('should show message when no history exists', async () => {
      history.getHistory.mockReturnValue([]);

      await program.parseAsync(['node', 'test', 'history']);

      expect(history.getHistory).toHaveBeenCalledWith({ limit: 10 });
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No history yet'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('api-ex request'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('api-ex run'));
      expect(printer.printTable).not.toHaveBeenCalled();
    });
  });

  describe('viewing history', () => {
    test('should display history entries in table format', async () => {
      const mockHistory = [
        {
          timestamp: '2024-01-15T10:30:00.000Z',
          method: 'GET',
          status: 200,
          durationMs: 150,
          url: 'https://api.example.com/users'
        },
        {
          timestamp: '2024-01-15T10:25:00.000Z',
          method: 'POST',
          status: 201,
          durationMs: 250,
          url: 'https://api.example.com/users'
        }
      ];

      history.getHistory.mockReturnValue(mockHistory);

      await program.parseAsync(['node', 'test', 'history']);

      expect(history.getHistory).toHaveBeenCalledWith({ limit: 10 });
      expect(printer.printTable).toHaveBeenCalledWith(
        ['Time', 'Method', 'Status', 'Duration', 'URL'],
        expect.arrayContaining([
          expect.arrayContaining(['GET', 200, '150ms', 'https://api.example.com/users']),
          expect.arrayContaining(['POST', 201, '250ms', 'https://api.example.com/users'])
        ])
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Showing 2 most recent request(s)'));
    });

    test('should display single history entry', async () => {
      const mockHistory = [
        {
          timestamp: '2024-01-15T10:30:00.000Z',
          method: 'DELETE',
          status: 204,
          durationMs: 100,
          url: 'https://api.example.com/users/1'
        }
      ];

      history.getHistory.mockReturnValue(mockHistory);

      await program.parseAsync(['node', 'test', 'history']);

      expect(printer.printTable).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Showing 1 most recent request(s)'));
    });
  });

  describe('custom limit', () => {
    test('should respect custom limit option', async () => {
      const mockHistory = Array.from({ length: 5 }, (_, i) => ({
        timestamp: new Date(2024, 0, 15, 10, 30 - i).toISOString(),
        method: 'GET',
        status: 200,
        durationMs: 100 + i * 10,
        url: `https://api.example.com/endpoint-${i}`
      }));

      history.getHistory.mockReturnValue(mockHistory);

      await program.parseAsync(['node', 'test', 'history', '--limit', '5']);

      expect(history.getHistory).toHaveBeenCalledWith({ limit: 5 });
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Showing 5 most recent request(s)'));
    });

    test('should use default limit of 10', async () => {
      history.getHistory.mockReturnValue([]);

      await program.parseAsync(['node', 'test', 'history']);

      expect(history.getHistory).toHaveBeenCalledWith({ limit: 10 });
    });

    test('should handle invalid limit gracefully', async () => {
      history.getHistory.mockReturnValue([]);

      await program.parseAsync(['node', 'test', 'history', '--limit', 'invalid']);

      // parseInt('invalid') returns NaN, so it should fall back to 10
      expect(history.getHistory).toHaveBeenCalledWith({ limit: 10 });
    });
  });

  describe('timestamp formatting', () => {
    test('should format ISO timestamp to locale string', async () => {
      const mockHistory = [
        {
          timestamp: '2024-01-15T10:30:00.000Z',
          method: 'GET',
          status: 200,
          durationMs: 150,
          url: 'https://api.example.com/users'
        }
      ];

      history.getHistory.mockReturnValue(mockHistory);

      await program.parseAsync(['node', 'test', 'history']);

      const tableCall = printer.printTable.mock.calls[0];
      const rows = tableCall[1];
      const timeColumn = rows[0][0];

      // Check that timestamp was formatted (not ISO string)
      expect(timeColumn).not.toBe('2024-01-15T10:30:00.000Z');
      // Should contain some formatted date string
      expect(typeof timeColumn).toBe('string');
      expect(timeColumn.length).toBeGreaterThan(0);
    });
  });

  describe('URL truncation', () => {
    test('should truncate long URLs to 50 characters', async () => {
      const longUrl = 'https://api.example.com/very/long/path/that/exceeds/fifty/characters/definitely/yes';
      const mockHistory = [
        {
          timestamp: '2024-01-15T10:30:00.000Z',
          method: 'GET',
          status: 200,
          durationMs: 150,
          url: longUrl
        }
      ];

      history.getHistory.mockReturnValue(mockHistory);

      await program.parseAsync(['node', 'test', 'history']);

      const tableCall = printer.printTable.mock.calls[0];
      const rows = tableCall[1];
      const urlColumn = rows[0][4];

      expect(urlColumn).toHaveLength(53); // 50 chars + '...'
      expect(urlColumn).toContain('...');
      expect(urlColumn).toBe(longUrl.substring(0, 50) + '...');
    });

    test('should not truncate short URLs', async () => {
      const shortUrl = 'https://api.example.com/users';
      const mockHistory = [
        {
          timestamp: '2024-01-15T10:30:00.000Z',
          method: 'GET',
          status: 200,
          durationMs: 150,
          url: shortUrl
        }
      ];

      history.getHistory.mockReturnValue(mockHistory);

      await program.parseAsync(['node', 'test', 'history']);

      const tableCall = printer.printTable.mock.calls[0];
      const rows = tableCall[1];
      const urlColumn = rows[0][4];

      expect(urlColumn).toBe(shortUrl);
      expect(urlColumn).not.toContain('...');
    });

    test('should handle exactly 50 character URL', async () => {
      // Create a URL exactly 50 characters long
      const exactUrl = 'https://api.example.com/path/that/is/fifty/chars';
      const mockHistory = [
        {
          timestamp: '2024-01-15T10:30:00.000Z',
          method: 'GET',
          status: 200,
          durationMs: 150,
          url: exactUrl
        }
      ];

      history.getHistory.mockReturnValue(mockHistory);

      await program.parseAsync(['node', 'test', 'history']);

      const tableCall = printer.printTable.mock.calls[0];
      const rows = tableCall[1];
      const urlColumn = rows[0][4];

      expect(urlColumn).toBe(exactUrl);
      expect(urlColumn).not.toContain('...');
    });
  });

  describe('status coloring', () => {
    test('should use green for success status codes', async () => {
      const mockHistory = [
        {
          timestamp: '2024-01-15T10:30:00.000Z',
          method: 'GET',
          status: 200,
          durationMs: 150,
          url: 'https://api.example.com/users'
        }
      ];

      history.getHistory.mockReturnValue(mockHistory);

      await program.parseAsync(['node', 'test', 'history']);

      expect(chalk.green).toHaveBeenCalledWith(200);
    });

    test('should use red for error status codes', async () => {
      const mockHistory = [
        {
          timestamp: '2024-01-15T10:30:00.000Z',
          method: 'GET',
          status: 404,
          durationMs: 150,
          url: 'https://api.example.com/users'
        }
      ];

      history.getHistory.mockReturnValue(mockHistory);

      await program.parseAsync(['node', 'test', 'history']);

      expect(chalk.red).toHaveBeenCalledWith(404);
    });

    test('should use red for 500 status codes', async () => {
      const mockHistory = [
        {
          timestamp: '2024-01-15T10:30:00.000Z',
          method: 'GET',
          status: 500,
          durationMs: 150,
          url: 'https://api.example.com/users'
        }
      ];

      history.getHistory.mockReturnValue(mockHistory);

      await program.parseAsync(['node', 'test', 'history']);

      expect(chalk.red).toHaveBeenCalledWith(500);
    });

    test('should use green for 3xx status codes', async () => {
      const mockHistory = [
        {
          timestamp: '2024-01-15T10:30:00.000Z',
          method: 'GET',
          status: 301,
          durationMs: 150,
          url: 'https://api.example.com/users'
        }
      ];

      history.getHistory.mockReturnValue(mockHistory);

      await program.parseAsync(['node', 'test', 'history']);

      expect(chalk.green).toHaveBeenCalledWith(301);
    });
  });

  describe('method filtering', () => {
    test('should filter history by method', async () => {
      const mockHistory = [
        {
          timestamp: '2024-01-15T10:30:00.000Z',
          method: 'GET',
          status: 200,
          durationMs: 150,
          url: 'https://api.example.com/users'
        },
        {
          timestamp: '2024-01-15T10:25:00.000Z',
          method: 'POST',
          status: 201,
          durationMs: 250,
          url: 'https://api.example.com/users'
        },
        {
          timestamp: '2024-01-15T10:20:00.000Z',
          method: 'GET',
          status: 200,
          durationMs: 120,
          url: 'https://api.example.com/posts'
        }
      ];

      history.getHistory.mockReturnValue(mockHistory);

      await program.parseAsync(['node', 'test', 'history', '--method', 'GET']);

      const tableCall = printer.printTable.mock.calls[0];
      const rows = tableCall[1];

      expect(rows).toHaveLength(2);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Showing 2 most recent request(s)'));
    });

    test('should handle lowercase method filter', async () => {
      const mockHistory = [
        {
          timestamp: '2024-01-15T10:30:00.000Z',
          method: 'GET',
          status: 200,
          durationMs: 150,
          url: 'https://api.example.com/users'
        },
        {
          timestamp: '2024-01-15T10:25:00.000Z',
          method: 'POST',
          status: 201,
          durationMs: 250,
          url: 'https://api.example.com/users'
        }
      ];

      history.getHistory.mockReturnValue(mockHistory);

      await program.parseAsync(['node', 'test', 'history', '--method', 'post']);

      const tableCall = printer.printTable.mock.calls[0];
      const rows = tableCall[1];

      expect(rows).toHaveLength(1);
    });

    test('should show empty message when method filter returns no results', async () => {
      const mockHistory = [
        {
          timestamp: '2024-01-15T10:30:00.000Z',
          method: 'GET',
          status: 200,
          durationMs: 150,
          url: 'https://api.example.com/users'
        }
      ];

      history.getHistory.mockReturnValue(mockHistory);

      await program.parseAsync(['node', 'test', 'history', '--method', 'DELETE']);

      expect(printer.printTable).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No history yet'));
    });
  });

  describe('status filtering', () => {
    test('should filter history by status code', async () => {
      const mockHistory = [
        {
          timestamp: '2024-01-15T10:30:00.000Z',
          method: 'GET',
          status: 200,
          durationMs: 150,
          url: 'https://api.example.com/users'
        },
        {
          timestamp: '2024-01-15T10:25:00.000Z',
          method: 'POST',
          status: 201,
          durationMs: 250,
          url: 'https://api.example.com/users'
        },
        {
          timestamp: '2024-01-15T10:20:00.000Z',
          method: 'GET',
          status: 404,
          durationMs: 120,
          url: 'https://api.example.com/missing'
        }
      ];

      history.getHistory.mockReturnValue(mockHistory);

      await program.parseAsync(['node', 'test', 'history', '--status', '200']);

      const tableCall = printer.printTable.mock.calls[0];
      const rows = tableCall[1];

      expect(rows).toHaveLength(1);
    });

    test('should show empty message when status filter returns no results', async () => {
      const mockHistory = [
        {
          timestamp: '2024-01-15T10:30:00.000Z',
          method: 'GET',
          status: 200,
          durationMs: 150,
          url: 'https://api.example.com/users'
        }
      ];

      history.getHistory.mockReturnValue(mockHistory);

      await program.parseAsync(['node', 'test', 'history', '--status', '500']);

      expect(printer.printTable).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No history yet'));
    });
  });

  describe('combined filters', () => {
    test('should apply both method and status filters', async () => {
      const mockHistory = [
        {
          timestamp: '2024-01-15T10:30:00.000Z',
          method: 'GET',
          status: 200,
          durationMs: 150,
          url: 'https://api.example.com/users'
        },
        {
          timestamp: '2024-01-15T10:25:00.000Z',
          method: 'POST',
          status: 201,
          durationMs: 250,
          url: 'https://api.example.com/users'
        },
        {
          timestamp: '2024-01-15T10:20:00.000Z',
          method: 'GET',
          status: 404,
          durationMs: 120,
          url: 'https://api.example.com/missing'
        }
      ];

      history.getHistory.mockReturnValue(mockHistory);

      await program.parseAsync(['node', 'test', 'history', '--method', 'GET', '--status', '200']);

      const tableCall = printer.printTable.mock.calls[0];
      const rows = tableCall[1];

      expect(rows).toHaveLength(1);
    });
  });

  describe('color formatting', () => {
    test('should use yellow for method names', async () => {
      const mockHistory = [
        {
          timestamp: '2024-01-15T10:30:00.000Z',
          method: 'PUT',
          status: 200,
          durationMs: 150,
          url: 'https://api.example.com/users'
        }
      ];

      history.getHistory.mockReturnValue(mockHistory);

      await program.parseAsync(['node', 'test', 'history']);

      expect(chalk.yellow).toHaveBeenCalledWith('PUT');
    });

    test('should use gray for timestamps', async () => {
      const mockHistory = [
        {
          timestamp: '2024-01-15T10:30:00.000Z',
          method: 'GET',
          status: 200,
          durationMs: 150,
          url: 'https://api.example.com/users'
        }
      ];

      history.getHistory.mockReturnValue(mockHistory);

      await program.parseAsync(['node', 'test', 'history']);

      // chalk.gray should be called for the formatted timestamp
      expect(chalk.gray).toHaveBeenCalled();
    });

    test('should use gray for duration', async () => {
      const mockHistory = [
        {
          timestamp: '2024-01-15T10:30:00.000Z',
          method: 'GET',
          status: 200,
          durationMs: 150,
          url: 'https://api.example.com/users'
        }
      ];

      history.getHistory.mockReturnValue(mockHistory);

      await program.parseAsync(['node', 'test', 'history']);

      expect(chalk.gray).toHaveBeenCalledWith('150ms');
    });
  });

  describe('edge cases', () => {
    test('should handle very long duration values', async () => {
      const mockHistory = [
        {
          timestamp: '2024-01-15T10:30:00.000Z',
          method: 'GET',
          status: 200,
          durationMs: 99999,
          url: 'https://api.example.com/users'
        }
      ];

      history.getHistory.mockReturnValue(mockHistory);

      await program.parseAsync(['node', 'test', 'history']);

      expect(chalk.gray).toHaveBeenCalledWith('99999ms');
    });

    test('should handle zero duration', async () => {
      const mockHistory = [
        {
          timestamp: '2024-01-15T10:30:00.000Z',
          method: 'GET',
          status: 200,
          durationMs: 0,
          url: 'https://api.example.com/users'
        }
      ];

      history.getHistory.mockReturnValue(mockHistory);

      await program.parseAsync(['node', 'test', 'history']);

      expect(chalk.gray).toHaveBeenCalledWith('0ms');
    });

    test('should handle status code at boundary (399)', async () => {
      const mockHistory = [
        {
          timestamp: '2024-01-15T10:30:00.000Z',
          method: 'GET',
          status: 399,
          durationMs: 150,
          url: 'https://api.example.com/users'
        }
      ];

      history.getHistory.mockReturnValue(mockHistory);

      await program.parseAsync(['node', 'test', 'history']);

      expect(chalk.green).toHaveBeenCalledWith(399);
    });

    test('should handle status code at boundary (400)', async () => {
      const mockHistory = [
        {
          timestamp: '2024-01-15T10:30:00.000Z',
          method: 'GET',
          status: 400,
          durationMs: 150,
          url: 'https://api.example.com/users'
        }
      ];

      history.getHistory.mockReturnValue(mockHistory);

      await program.parseAsync(['node', 'test', 'history']);

      expect(chalk.red).toHaveBeenCalledWith(400);
    });
  });
});
