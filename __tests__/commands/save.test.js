/**
 * Tests for save command
 */

const { Command } = require('commander');
const chalk = require('chalk');
const saveCommand = require('../../src/commands/save');
const storage = require('../../src/core/storage');

// Mock chalk to avoid color codes in test output
jest.mock('chalk', () => ({
  red: jest.fn((text) => text),
  green: jest.fn((text) => text),
  yellow: jest.fn((text) => text),
  gray: jest.fn((text) => text),
  cyan: jest.fn((text) => text),
}));

// Mock storage module
jest.mock('../../src/core/storage');

describe('save command', () => {
  let program;
  let consoleLogSpy;
  let processExitSpy;

  beforeEach(() => {
    // Create a fresh commander instance
    program = new Command();
    program.exitOverride(); // Prevent actual process exit in tests

    // Register the save command
    saveCommand(program);

    // Spy on console.log
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    // Spy on process.exit
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation();

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('basic functionality', () => {
    test('should save a new request with minimal options', async () => {
      storage.getRequestByName.mockReturnValue(null);
      storage.saveRequest.mockImplementation(() => {});

      await program.parseAsync(['node', 'test', 'save', 'my-request', '--url', 'https://example.com']);

      expect(storage.saveRequest).toHaveBeenCalledWith({
        name: 'my-request',
        method: 'GET',
        url: 'https://example.com',
        headers: [],
        data: ''
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Saved request'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('my-request'));
    });

    test('should save request with custom method', async () => {
      storage.getRequestByName.mockReturnValue(null);
      storage.saveRequest.mockImplementation(() => {});

      await program.parseAsync(['node', 'test', 'save', 'post-request', '--url', 'https://api.example.com', '--method', 'POST']);

      expect(storage.saveRequest).toHaveBeenCalledWith({
        name: 'post-request',
        method: 'POST',
        url: 'https://api.example.com',
        headers: [],
        data: ''
      });
    });

    test('should save request with headers', async () => {
      storage.getRequestByName.mockReturnValue(null);
      storage.saveRequest.mockImplementation(() => {});

      await program.parseAsync([
        'node', 'test', 'save', 'auth-request',
        '--url', 'https://api.example.com',
        '-H', 'Authorization: Bearer token123',
        '-H', 'Content-Type: application/json'
      ]);

      expect(storage.saveRequest).toHaveBeenCalledWith({
        name: 'auth-request',
        method: 'GET',
        url: 'https://api.example.com',
        headers: ['Authorization: Bearer token123', 'Content-Type: application/json'],
        data: ''
      });
    });

    test('should save request with body data', async () => {
      storage.getRequestByName.mockReturnValue(null);
      storage.saveRequest.mockImplementation(() => {});

      const bodyData = '{"name":"test","value":123}';

      await program.parseAsync([
        'node', 'test', 'save', 'create-user',
        '--url', 'https://api.example.com/users',
        '--method', 'POST',
        '--data', bodyData
      ]);

      expect(storage.saveRequest).toHaveBeenCalledWith({
        name: 'create-user',
        method: 'POST',
        url: 'https://api.example.com/users',
        headers: [],
        data: bodyData
      });
    });

    test('should save complete request with all options', async () => {
      storage.getRequestByName.mockReturnValue(null);
      storage.saveRequest.mockImplementation(() => {});

      const bodyData = '{"title":"test"}';

      await program.parseAsync([
        'node', 'test', 'save', 'full-request',
        '--url', 'https://api.example.com/posts',
        '--method', 'PUT',
        '-H', 'Authorization: Bearer token',
        '-H', 'Content-Type: application/json',
        '--data', bodyData
      ]);

      expect(storage.saveRequest).toHaveBeenCalledWith({
        name: 'full-request',
        method: 'PUT',
        url: 'https://api.example.com/posts',
        headers: ['Authorization: Bearer token', 'Content-Type: application/json'],
        data: bodyData
      });
    });
  });

  describe('overwriting existing requests', () => {
    test('should warn when overwriting existing request', async () => {
      const existingRequest = {
        name: 'existing-request',
        method: 'GET',
        url: 'https://old-url.com',
        headers: [],
        data: ''
      };

      storage.getRequestByName.mockReturnValue(existingRequest);
      storage.saveRequest.mockImplementation(() => {});

      await program.parseAsync([
        'node', 'test', 'save', 'existing-request',
        '--url', 'https://new-url.com'
      ]);

      expect(storage.getRequestByName).toHaveBeenCalledWith('existing-request');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('already exists'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Overwriting'));
      expect(storage.saveRequest).toHaveBeenCalled();
    });

    test('should still save when overwriting', async () => {
      storage.getRequestByName.mockReturnValue({ name: 'test', method: 'GET', url: 'old' });
      storage.saveRequest.mockImplementation(() => {});

      await program.parseAsync([
        'node', 'test', 'save', 'test',
        '--url', 'https://new-url.com',
        '--method', 'POST'
      ]);

      expect(storage.saveRequest).toHaveBeenCalledWith({
        name: 'test',
        method: 'POST',
        url: 'https://new-url.com',
        headers: [],
        data: ''
      });
    });
  });

  describe('validation and error handling', () => {
    test('should error when URL is missing', async () => {
      try {
        await program.parseAsync(['node', 'test', 'save', 'my-request']);
      } catch (err) {
        // Commander will throw when exitOverride is used
      }

      expect(processExitSpy).toHaveBeenCalledWith(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('--url is required'));
    });

    test('should warn when name contains spaces', async () => {
      storage.getRequestByName.mockReturnValue(null);
      storage.saveRequest.mockImplementation(() => {});

      await program.parseAsync([
        'node', 'test', 'save', 'my request name',
        '--url', 'https://example.com'
      ]);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('contains spaces'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('may cause issues'));

      // Should still save despite the warning
      expect(storage.saveRequest).toHaveBeenCalled();
    });

    test('should convert method to uppercase', async () => {
      storage.getRequestByName.mockReturnValue(null);
      storage.saveRequest.mockImplementation(() => {});

      await program.parseAsync([
        'node', 'test', 'save', 'test-request',
        '--url', 'https://example.com',
        '--method', 'post'
      ]);

      expect(storage.saveRequest).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('summary output', () => {
    test('should display summary after saving', async () => {
      storage.getRequestByName.mockReturnValue(null);
      storage.saveRequest.mockImplementation(() => {});

      await program.parseAsync([
        'node', 'test', 'save', 'summary-test',
        '--url', 'https://api.example.com',
        '--method', 'POST',
        '-H', 'Authorization: Bearer token',
        '--data', '{"test":"data"}'
      ]);

      // Check for success message
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Saved request'));

      // Check for summary details
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Method: POST'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('URL: https://api.example.com'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Headers: 1'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Body:'));
    });

    test('should not show headers count if no headers', async () => {
      storage.getRequestByName.mockReturnValue(null);
      storage.saveRequest.mockImplementation(() => {});

      await program.parseAsync([
        'node', 'test', 'save', 'no-headers',
        '--url', 'https://example.com'
      ]);

      const headersLog = consoleLogSpy.mock.calls.find(call =>
        call[0].includes('Headers:')
      );

      expect(headersLog).toBeUndefined();
    });

    test('should truncate long body data in summary', async () => {
      storage.getRequestByName.mockReturnValue(null);
      storage.saveRequest.mockImplementation(() => {});

      const longBody = 'a'.repeat(100);

      await program.parseAsync([
        'node', 'test', 'save', 'long-body',
        '--url', 'https://example.com',
        '--data', longBody
      ]);

      const bodyLog = consoleLogSpy.mock.calls.find(call =>
        call[0].includes('Body:')
      );

      expect(bodyLog).toBeDefined();
      expect(bodyLog[0]).toContain('...');
    });
  });

  describe('edge cases', () => {
    test('should handle URL with placeholders', async () => {
      storage.getRequestByName.mockReturnValue(null);
      storage.saveRequest.mockImplementation(() => {});

      await program.parseAsync([
        'node', 'test', 'save', 'template-request',
        '--url', '{{BASE_URL}}/api/users'
      ]);

      expect(storage.saveRequest).toHaveBeenCalledWith(
        expect.objectContaining({ url: '{{BASE_URL}}/api/users' })
      );
    });

    test('should handle multiple headers', async () => {
      storage.getRequestByName.mockReturnValue(null);
      storage.saveRequest.mockImplementation(() => {});

      await program.parseAsync([
        'node', 'test', 'save', 'multi-header',
        '--url', 'https://example.com',
        '-H', 'Header1: value1',
        '-H', 'Header2: value2',
        '-H', 'Header3: value3'
      ]);

      expect(storage.saveRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: ['Header1: value1', 'Header2: value2', 'Header3: value3']
        })
      );
    });

    test('should handle empty data option', async () => {
      storage.getRequestByName.mockReturnValue(null);
      storage.saveRequest.mockImplementation(() => {});

      await program.parseAsync([
        'node', 'test', 'save', 'no-data',
        '--url', 'https://example.com'
      ]);

      expect(storage.saveRequest).toHaveBeenCalledWith(
        expect.objectContaining({ data: '' })
      );
    });

    test('should handle special characters in request name', async () => {
      storage.getRequestByName.mockReturnValue(null);
      storage.saveRequest.mockImplementation(() => {});

      await program.parseAsync([
        'node', 'test', 'save', 'test-request_123',
        '--url', 'https://example.com'
      ]);

      expect(storage.saveRequest).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'test-request_123' })
      );
    });
  });
});
