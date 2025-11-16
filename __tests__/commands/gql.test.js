const http = require('../../src/core/http');
const env = require('../../src/core/env');
const history = require('../../src/core/history');
const printer = require('../../src/core/printer');
const fs = require('fs');
const path = require('path');

// Mock all core modules
jest.mock('../../src/core/http');
jest.mock('../../src/core/env');
jest.mock('../../src/core/history');
jest.mock('../../src/core/printer');
jest.mock('fs');
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
const gqlModule = require('../../src/commands/gql');
const { Command } = require('commander');

// Mock console and process.exit
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

  // Reset fs mock - use mockImplementation instead of reassignment
  fs.readFileSync.mockReset();
});

afterEach(() => {
  console.log = originalConsoleLog;
  process.exit = originalProcessExit;
});

describe('GraphQL Command', () => {
  describe('Inline Query', () => {
    it('should send a GraphQL query with inline query string', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        durationMs: 150,
        data: {
          data: {
            user: { id: '1', name: 'John' }
          }
        }
      };

      http.sendRequest.mockResolvedValue(mockResponse);

      const program = new Command();
      program.exitOverride();
      gqlModule(program);

      await program.parseAsync([
        'gql',
        '--endpoint', 'https://api.example.com/graphql',
        '--query', '{ user(id: 1) { id name } }'
      ], { from: 'user' });

      expect(http.sendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: 'https://api.example.com/graphql',
          headers: {
            'Content-Type': 'application/json'
          },
          data: JSON.stringify({
            query: '{ user(id: 1) { id name } }',
            variables: {}
          })
        })
      );

      expect(printer.printSuccess).toHaveBeenCalledWith(
        mockResponse,
        'POST',
        'https://api.example.com/graphql'
      );

      expect(history.recordHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: 'https://api.example.com/graphql',
          status: 200,
          durationMs: 150,
          env: null
        })
      );
    });
  });

  describe('File-based Query', () => {
    it('should load query from file', async () => {
      const fileQuery = `
        query GetUser($id: ID!) {
          user(id: $id) {
            id
            name
            email
          }
        }
      `;

      fs.readFileSync.mockReturnValue(fileQuery);

      const mockResponse = {
        status: 200,
        statusText: 'OK',
        durationMs: 200,
        data: {
          data: {
            user: { id: '1', name: 'Jane', email: 'jane@example.com' }
          }
        }
      };

      http.sendRequest.mockResolvedValue(mockResponse);

      const program = new Command();
      program.exitOverride();
      gqlModule(program);

      await program.parseAsync([
        'gql',
        '--endpoint', 'https://api.example.com/graphql',
        '--file', 'query.graphql'
      ], { from: 'user' });

      expect(fs.readFileSync).toHaveBeenCalledWith(
        path.resolve(process.cwd(), 'query.graphql'),
        'utf-8'
      );

      expect(http.sendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          data: JSON.stringify({
            query: fileQuery,
            variables: {}
          })
        })
      );
    });

    it('should prefer file over inline query when both provided', async () => {
      const fileQuery = 'query FromFile { users { id } }';
      fs.readFileSync.mockReturnValue(fileQuery);

      const mockResponse = {
        status: 200,
        statusText: 'OK',
        durationMs: 100,
        data: { data: { users: [] } }
      };

      http.sendRequest.mockResolvedValue(mockResponse);

      const program = new Command();
      program.exitOverride();
      gqlModule(program);

      await program.parseAsync([
        'gql',
        '--endpoint', 'https://api.example.com/graphql',
        '--query', 'query Inline { posts { id } }',
        '--file', 'query.gql'
      ], { from: 'user' });

      expect(consoleOutput.some(line => line.includes('Warning'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('Using --file'))).toBe(true);

      expect(http.sendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          data: JSON.stringify({
            query: fileQuery,
            variables: {}
          })
        })
      );
    });
  });

  describe('Variables', () => {
    it('should parse and include variables in request', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        durationMs: 120,
        data: { data: { user: { id: '5', name: 'Bob' } } }
      };

      http.sendRequest.mockResolvedValue(mockResponse);

      const program = new Command();
      program.exitOverride();
      gqlModule(program);

      await program.parseAsync([
        'gql',
        '--endpoint', 'https://api.example.com/graphql',
        '--query', 'query GetUser($id: ID!) { user(id: $id) { id name } }',
        '--variables', '{"id": "5"}'
      ], { from: 'user' });

      expect(http.sendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          data: JSON.stringify({
            query: 'query GetUser($id: ID!) { user(id: $id) { id name } }',
            variables: { id: '5' }
          })
        })
      );
    });

    it('should handle complex variables', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        durationMs: 130,
        data: { data: { createUser: { id: '10' } } }
      };

      http.sendRequest.mockResolvedValue(mockResponse);

      const program = new Command();
      program.exitOverride();
      gqlModule(program);

      const variables = JSON.stringify({
        input: {
          name: 'Alice',
          email: 'alice@example.com',
          roles: ['admin', 'user'],
          metadata: { verified: true }
        }
      });

      await program.parseAsync([
        'gql',
        '--endpoint', 'https://api.example.com/graphql',
        '--query', 'mutation CreateUser($input: UserInput!) { createUser(input: $input) { id } }',
        '--variables', variables
      ], { from: 'user' });

      const calledData = JSON.parse(http.sendRequest.mock.calls[0][0].data);
      expect(calledData.variables).toEqual({
        input: {
          name: 'Alice',
          email: 'alice@example.com',
          roles: ['admin', 'user'],
          metadata: { verified: true }
        }
      });
    });
  });

  describe('Headers', () => {
    it('should include custom headers in request', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        durationMs: 110,
        data: { data: {} }
      };

      http.sendRequest.mockResolvedValue(mockResponse);

      const program = new Command();
      program.exitOverride();
      gqlModule(program);

      await program.parseAsync([
        'gql',
        '--endpoint', 'https://api.example.com/graphql',
        '--query', '{ users { id } }',
        '-H', 'Authorization: Bearer token123',
        '-H', 'X-Request-ID: abc-123'
      ], { from: 'user' });

      expect(http.sendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer token123',
            'X-Request-ID': 'abc-123'
          }
        })
      );
    });

    it('should handle headers with colons in value', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        durationMs: 100,
        data: { data: {} }
      };

      http.sendRequest.mockResolvedValue(mockResponse);

      const program = new Command();
      program.exitOverride();
      gqlModule(program);

      await program.parseAsync([
        'gql',
        '--endpoint', 'https://api.example.com/graphql',
        '--query', '{ users { id } }',
        '-H', 'Authorization: Bearer token:with:colons'
      ], { from: 'user' });

      expect(http.sendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer token:with:colons'
          }
        })
      );
    });
  });

  describe('Environment Interpolation', () => {
    it('should interpolate request with environment variables', async () => {
      const mockEnv = {
        GRAPHQL_ENDPOINT: 'https://api.example.com/graphql',
        AUTH_TOKEN: 'env-token'
      };

      const mockInterpolatedRequest = {
        method: 'POST',
        url: 'https://api.example.com/graphql',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer env-token'
        },
        data: JSON.stringify({
          query: '{ users { id } }',
          variables: {}
        })
      };

      const mockResponse = {
        status: 200,
        statusText: 'OK',
        durationMs: 140,
        data: { data: { users: [] } }
      };

      env.getEnv.mockReturnValue(mockEnv);
      env.interpolateRequest.mockReturnValue(mockInterpolatedRequest);
      http.sendRequest.mockResolvedValue(mockResponse);

      const program = new Command();
      program.exitOverride();
      gqlModule(program);

      await program.parseAsync([
        'gql',
        '--endpoint', '{{GRAPHQL_ENDPOINT}}',
        '--query', '{ users { id } }',
        '-H', 'Authorization: Bearer {{AUTH_TOKEN}}',
        '--env', 'production'
      ], { from: 'user' });

      expect(env.getEnv).toHaveBeenCalledWith('production');
      expect(env.interpolateRequest).toHaveBeenCalled();
      expect(http.sendRequest).toHaveBeenCalledWith(mockInterpolatedRequest);

      expect(history.recordHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          env: 'production'
        })
      );
    });
  });

  describe('GraphQL Errors in Response', () => {
    it('should display GraphQL errors when present in response', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        durationMs: 100,
        data: {
          data: null,
          errors: [
            { message: 'Cannot query field "invalid" on type "User"' },
            { message: 'Variable "$id" is not defined' }
          ]
        }
      };

      http.sendRequest.mockResolvedValue(mockResponse);

      const program = new Command();
      program.exitOverride();
      gqlModule(program);

      await program.parseAsync([
        'gql',
        '--endpoint', 'https://api.example.com/graphql',
        '--query', '{ user { invalid } }'
      ], { from: 'user' });

      expect(consoleOutput.some(line => line.includes('GraphQL Errors'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('Cannot query field'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('Variable "$id"'))).toBe(true);

      // Should still print success (HTTP was successful)
      expect(printer.printSuccess).toHaveBeenCalled();
    });

    it('should handle GraphQL errors without message field', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        durationMs: 100,
        data: {
          errors: [
            { code: 'FORBIDDEN', path: ['user', 'email'] }
          ]
        }
      };

      http.sendRequest.mockResolvedValue(mockResponse);

      const program = new Command();
      program.exitOverride();
      gqlModule(program);

      await program.parseAsync([
        'gql',
        '--endpoint', 'https://api.example.com/graphql',
        '--query', '{ user { email } }'
      ], { from: 'user' });

      expect(consoleOutput.some(line => line.includes('GraphQL Errors'))).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should exit with error when neither query nor file is provided', async () => {
      const program = new Command();
      gqlModule(program);

      try {
        await program.parseAsync([
          'gql',
          '--endpoint', 'https://api.example.com/graphql'
        ], { from: 'user' });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Process exited with code 1');
        expect(consoleOutput.some(line => line.includes('Either --query or --file must be provided'))).toBe(true);
      }
    });

    it('should exit with error for invalid JSON in variables', async () => {
      const program = new Command();
      gqlModule(program);

      try {
        await program.parseAsync([
          'gql',
          '--endpoint', 'https://api.example.com/graphql',
          '--query', '{ users { id } }',
          '--variables', 'not-valid-json'
        ], { from: 'user' });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Process exited with code 1');
        expect(consoleOutput.some(line => line.includes('Invalid JSON in --variables'))).toBe(true);
      }
    });

    it('should exit with error when file not found', async () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });

      const program = new Command();
      gqlModule(program);

      try {
        await program.parseAsync([
          'gql',
          '--endpoint', 'https://api.example.com/graphql',
          '--file', 'nonexistent.graphql'
        ], { from: 'user' });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Process exited with code 1');
        expect(consoleOutput.some(line => line.includes('Error reading file'))).toBe(true);
      }
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      networkError.code = 'ENOTFOUND';

      http.sendRequest.mockRejectedValue(networkError);

      const program = new Command();
      gqlModule(program);

      try {
        await program.parseAsync([
          'gql',
          '--endpoint', 'https://invalid-domain.com/graphql',
          '--query', '{ users { id } }'
        ], { from: 'user' });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Process exited with code 2');
        expect(printer.printError).toHaveBeenCalledWith(
          networkError,
          'POST',
          'https://invalid-domain.com/graphql'
        );
      }
    });

    it('should handle request timeout', async () => {
      const timeoutError = new Error('Request timeout after 30000ms');
      timeoutError.code = 'ECONNABORTED';

      http.sendRequest.mockRejectedValue(timeoutError);

      const program = new Command();
      gqlModule(program);

      try {
        await program.parseAsync([
          'gql',
          '--endpoint', 'https://api.example.com/graphql',
          '--query', '{ slowQuery { id } }'
        ], { from: 'user' });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Process exited with code 2');
        expect(printer.printError).toHaveBeenCalled();
      }
    });

    it('should handle unknown environment error', async () => {
      env.getEnv.mockImplementation(() => {
        throw new Error('Unknown environment "invalid". No environments have been defined yet.');
      });

      const program = new Command();
      gqlModule(program);

      try {
        await program.parseAsync([
          'gql',
          '--endpoint', 'https://api.example.com/graphql',
          '--query', '{ users { id } }',
          '--env', 'invalid'
        ], { from: 'user' });
        fail('Should have thrown an error');
      } catch (error) {
        expect(env.getEnv).toHaveBeenCalledWith('invalid');
      }
    });
  });

  describe('History Recording', () => {
    it('should record history without env when not provided', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        durationMs: 100,
        data: { data: {} }
      };

      http.sendRequest.mockResolvedValue(mockResponse);

      const program = new Command();
      program.exitOverride();
      gqlModule(program);

      await program.parseAsync([
        'gql',
        '--endpoint', 'https://api.example.com/graphql',
        '--query', '{ users { id } }'
      ], { from: 'user' });

      expect(history.recordHistory).toHaveBeenCalledWith({
        method: 'POST',
        url: 'https://api.example.com/graphql',
        status: 200,
        durationMs: 100,
        env: null
      });
    });

    it('should record history with env when provided', async () => {
      const mockEnv = { API_URL: 'https://api.example.com' };
      const mockInterpolatedRequest = {
        method: 'POST',
        url: 'https://api.example.com/graphql',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ query: '{ users { id } }', variables: {} })
      };

      const mockResponse = {
        status: 200,
        statusText: 'OK',
        durationMs: 150,
        data: { data: {} }
      };

      env.getEnv.mockReturnValue(mockEnv);
      env.interpolateRequest.mockReturnValue(mockInterpolatedRequest);
      http.sendRequest.mockResolvedValue(mockResponse);

      const program = new Command();
      program.exitOverride();
      gqlModule(program);

      await program.parseAsync([
        'gql',
        '--endpoint', '{{API_URL}}/graphql',
        '--query', '{ users { id } }',
        '--env', 'staging'
      ], { from: 'user' });

      expect(history.recordHistory).toHaveBeenCalledWith({
        method: 'POST',
        url: 'https://api.example.com/graphql',
        status: 200,
        durationMs: 150,
        env: 'staging'
      });
    });
  });

  describe('Mutations', () => {
    it('should handle GraphQL mutations', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        durationMs: 180,
        data: {
          data: {
            deleteUser: { success: true }
          }
        }
      };

      http.sendRequest.mockResolvedValue(mockResponse);

      const program = new Command();
      program.exitOverride();
      gqlModule(program);

      await program.parseAsync([
        'gql',
        '--endpoint', 'https://api.example.com/graphql',
        '--query', 'mutation DeleteUser($id: ID!) { deleteUser(id: $id) { success } }',
        '--variables', '{"id": "123"}'
      ], { from: 'user' });

      const calledData = JSON.parse(http.sendRequest.mock.calls[0][0].data);
      expect(calledData.query).toContain('mutation');
      expect(calledData.variables).toEqual({ id: '123' });
    });
  });
});
