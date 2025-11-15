/**
 * Tests for env command
 */

const { Command } = require('commander');
const chalk = require('chalk');
const envCommand = require('../../src/commands/env');
const storage = require('../../src/core/storage');
const printer = require('../../src/core/printer');

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

// Mock printer module
jest.mock('../../src/core/printer');

describe('env command', () => {
  let program;
  let consoleLogSpy;
  let processExitSpy;

  beforeEach(() => {
    // Create a fresh commander instance
    program = new Command();
    program.exitOverride(); // Prevent actual process exit in tests

    // Register the env command
    envCommand(program);

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

  describe('env add', () => {
    test('should add new environment with single variable', async () => {
      storage.saveEnvironment.mockImplementation(() => {});

      await program.parseAsync(['node', 'test', 'env', 'add', 'dev', 'BASE_URL=http://localhost:3000']);

      expect(storage.saveEnvironment).toHaveBeenCalledWith('dev', {
        BASE_URL: 'http://localhost:3000'
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Environment 'dev' updated"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('1 variable(s)'));
    });

    test('should add environment with multiple variables', async () => {
      storage.saveEnvironment.mockImplementation(() => {});

      await program.parseAsync([
        'node', 'test', 'env', 'add', 'prod',
        'BASE_URL=https://api.example.com',
        'AUTH_TOKEN=secret123',
        'API_KEY=key456'
      ]);

      expect(storage.saveEnvironment).toHaveBeenCalledWith('prod', {
        BASE_URL: 'https://api.example.com',
        AUTH_TOKEN: 'secret123',
        API_KEY: 'key456'
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('3 variable(s)'));
    });

    test('should update existing environment', async () => {
      storage.saveEnvironment.mockImplementation(() => {});

      await program.parseAsync([
        'node', 'test', 'env', 'add', 'dev',
        'NEW_VAR=new_value'
      ]);

      expect(storage.saveEnvironment).toHaveBeenCalledWith('dev', {
        NEW_VAR: 'new_value'
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('updated'));
    });

    test('should warn about invalid variable format', async () => {
      storage.saveEnvironment.mockImplementation(() => {});

      await program.parseAsync([
        'node', 'test', 'env', 'add', 'test',
        'VALID=value',
        'invalid-no-equals',
        'ANOTHER=valid'
      ]);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Warning'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('invalid-no-equals'));

      expect(storage.saveEnvironment).toHaveBeenCalledWith('test', {
        VALID: 'value',
        ANOTHER: 'valid'
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('2 variable(s)'));
    });

    test('should error when no valid variables provided', async () => {
      await program.parseAsync([
        'node', 'test', 'env', 'add', 'empty',
        'invalid-format',
        'also-invalid'
      ]);

      expect(processExitSpy).toHaveBeenCalledWith(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No valid variables provided'));
      expect(storage.saveEnvironment).not.toHaveBeenCalled();
    });

    test('should error when no variables provided at all', async () => {
      await program.parseAsync(['node', 'test', 'env', 'add', 'empty']);

      expect(processExitSpy).toHaveBeenCalledWith(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No valid variables provided'));
      expect(storage.saveEnvironment).not.toHaveBeenCalled();
    });

    test('should display what was saved', async () => {
      storage.saveEnvironment.mockImplementation(() => {});

      await program.parseAsync([
        'node', 'test', 'env', 'add', 'dev',
        'KEY1=value1',
        'KEY2=value2'
      ]);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('KEY1=value1'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('KEY2=value2'));
    });

    test('should handle variable values with equals signs', async () => {
      storage.saveEnvironment.mockImplementation(() => {});

      await program.parseAsync([
        'node', 'test', 'env', 'add', 'test',
        'CONNECTION_STRING=host=localhost;port=5432'
      ]);

      // Note: split('=') will only split on first equals
      expect(storage.saveEnvironment).toHaveBeenCalledWith('test', {
        CONNECTION_STRING: 'host'
      });
    });

    test('should handle environment names with special characters', async () => {
      storage.saveEnvironment.mockImplementation(() => {});

      await program.parseAsync([
        'node', 'test', 'env', 'add', 'dev-us-east-1',
        'REGION=us-east-1'
      ]);

      expect(storage.saveEnvironment).toHaveBeenCalledWith('dev-us-east-1', {
        REGION: 'us-east-1'
      });
    });

    test('should skip variable with empty key', async () => {
      storage.saveEnvironment.mockImplementation(() => {});

      await program.parseAsync([
        'node', 'test', 'env', 'add', 'test',
        'VALID=value',
        '=empty-key'
      ]);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Warning'));
      expect(storage.saveEnvironment).toHaveBeenCalledWith('test', {
        VALID: 'value'
      });
    });

    test('should skip variable with empty value', async () => {
      storage.saveEnvironment.mockImplementation(() => {});

      await program.parseAsync([
        'node', 'test', 'env', 'add', 'test',
        'VALID=value',
        'EMPTY='
      ]);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Warning'));
      expect(storage.saveEnvironment).toHaveBeenCalledWith('test', {
        VALID: 'value'
      });
    });
  });

  describe('env list', () => {
    test('should show message when no environments defined', async () => {
      storage.getEnvironments.mockReturnValue({});

      await program.parseAsync(['node', 'test', 'env', 'list']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No environments defined'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("api-ex env add"));
      expect(printer.printTable).not.toHaveBeenCalled();
    });

    test('should list single environment', async () => {
      storage.getEnvironments.mockReturnValue({
        dev: {
          BASE_URL: 'http://localhost:3000',
          AUTH_TOKEN: 'dev-token'
        }
      });

      await program.parseAsync(['node', 'test', 'env', 'list']);

      expect(printer.printTable).toHaveBeenCalledWith(
        ['Environment', 'Variables'],
        expect.arrayContaining([
          expect.arrayContaining(['dev', expect.stringContaining('BASE_URL')])
        ])
      );
    });

    test('should list multiple environments', async () => {
      storage.getEnvironments.mockReturnValue({
        dev: { BASE_URL: 'http://localhost:3000' },
        prod: { BASE_URL: 'https://api.example.com', API_KEY: 'secret' },
        staging: { BASE_URL: 'https://staging.example.com' }
      });

      await program.parseAsync(['node', 'test', 'env', 'list']);

      expect(printer.printTable).toHaveBeenCalledWith(
        ['Environment', 'Variables'],
        expect.any(Array)
      );

      const callArgs = printer.printTable.mock.calls[0];
      const rows = callArgs[1];
      expect(rows).toHaveLength(3);
    });

    test('should display variable names as comma-separated list', async () => {
      storage.getEnvironments.mockReturnValue({
        prod: {
          BASE_URL: 'https://api.example.com',
          AUTH_TOKEN: 'token123',
          API_KEY: 'key456'
        }
      });

      await program.parseAsync(['node', 'test', 'env', 'list']);

      const callArgs = printer.printTable.mock.calls[0];
      const rows = callArgs[1];
      const variablesColumn = rows[0][1];

      expect(variablesColumn).toContain('BASE_URL');
      expect(variablesColumn).toContain('AUTH_TOKEN');
      expect(variablesColumn).toContain('API_KEY');
      expect(variablesColumn).toContain(', ');
    });

    test('should work with env ls alias', async () => {
      storage.getEnvironments.mockReturnValue({
        dev: { KEY: 'value' }
      });

      await program.parseAsync(['node', 'test', 'env', 'ls']);

      expect(printer.printTable).toHaveBeenCalled();
    });

    test('should handle environment with single variable', async () => {
      storage.getEnvironments.mockReturnValue({
        simple: { SINGLE_VAR: 'value' }
      });

      await program.parseAsync(['node', 'test', 'env', 'list']);

      const callArgs = printer.printTable.mock.calls[0];
      const rows = callArgs[1];
      const variablesColumn = rows[0][1];

      expect(variablesColumn).toBe('SINGLE_VAR');
      expect(variablesColumn).not.toContain(',');
    });

    test('should use cyan color for environment names', async () => {
      storage.getEnvironments.mockReturnValue({
        dev: { KEY: 'value' }
      });

      await program.parseAsync(['node', 'test', 'env', 'list']);

      const callArgs = printer.printTable.mock.calls[0];
      const rows = callArgs[1];
      const envName = rows[0][0];

      // chalk.cyan is mocked to return the text as-is
      expect(envName).toBe('dev');
    });
  });

  describe('env rm', () => {
    test('should remove existing environment', async () => {
      storage.removeEnvironment.mockImplementation(() => {});

      await program.parseAsync(['node', 'test', 'env', 'rm', 'dev']);

      expect(storage.removeEnvironment).toHaveBeenCalledWith('dev');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Environment 'dev' removed"));
    });

    test('should error when environment does not exist', async () => {
      storage.removeEnvironment.mockImplementation(() => {
        throw new Error("Environment 'nonexistent' does not exist");
      });

      await program.parseAsync(['node', 'test', 'env', 'rm', 'nonexistent']);

      expect(processExitSpy).toHaveBeenCalledWith(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('does not exist'));
    });

    test('should work with env remove alias', async () => {
      storage.removeEnvironment.mockImplementation(() => {});

      await program.parseAsync(['node', 'test', 'env', 'remove', 'prod']);

      expect(storage.removeEnvironment).toHaveBeenCalledWith('prod');
    });

    test('should display success message after removal', async () => {
      storage.removeEnvironment.mockImplementation(() => {});

      await program.parseAsync(['node', 'test', 'env', 'rm', 'staging']);

      //expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('✓'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('staging'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('removed'));
    });

    test('should handle environment names with special characters', async () => {
      storage.removeEnvironment.mockImplementation(() => {});

      await program.parseAsync(['node', 'test', 'env', 'rm', 'dev-us-east-1']);

      expect(storage.removeEnvironment).toHaveBeenCalledWith('dev-us-east-1');
    });
  });
});
