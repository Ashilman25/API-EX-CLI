const axios = require('axios');
const http = require('../../src/core/http');

// Mock axios
jest.mock('axios');

describe('HTTP Module', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('sendRequest() - Validation', () => {
    it('should throw error when config is not provided', async () => {
      await expect(http.sendRequest()).rejects.toThrow('Request configuration is required');
    });

    it('should throw error when config is null', async () => {
      await expect(http.sendRequest(null)).rejects.toThrow('Request configuration is required');
    });

    it('should throw error when method is missing', async () => {
      await expect(http.sendRequest({ url: 'http://example.com' }))
        .rejects.toThrow('Request method is required');
    });

    it('should throw error when url is missing', async () => {
      await expect(http.sendRequest({ method: 'GET' }))
        .rejects.toThrow('Request URL is required');
    });
  });

  describe('sendRequest() - Successful Requests', () => {
    it('should send successful GET request', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        data: { message: 'Success' }
      };

      axios.mockResolvedValue(mockResponse);

      const result = await http.sendRequest({
        method: 'GET',
        url: 'http://example.com/api'
      });

      expect(axios).toHaveBeenCalledWith({
        method: 'GET',
        url: 'http://example.com/api',
        headers: {},
        data: undefined,
        timeout: 30000,
        validateStatus: expect.any(Function)
      });

      expect(result.status).toBe(200);
      expect(result.statusText).toBe('OK');
      expect(result.data).toEqual({ message: 'Success' });
      expect(result.headers).toEqual({ 'content-type': 'application/json' });
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should send successful POST request with body', async () => {
      const mockResponse = {
        status: 201,
        statusText: 'Created',
        headers: { 'content-type': 'application/json' },
        data: { id: 123, created: true }
      };

      axios.mockResolvedValue(mockResponse);

      const requestData = { name: 'Test', value: 'data' };

      const result = await http.sendRequest({
        method: 'POST',
        url: 'http://example.com/api/create',
        data: requestData
      });

      expect(axios).toHaveBeenCalledWith({
        method: 'POST',
        url: 'http://example.com/api/create',
        headers: { 'Content-Type': 'application/json' },
        data: requestData,
        timeout: 30000,
        validateStatus: expect.any(Function)
      });

      expect(result.status).toBe(201);
      expect(result.data).toEqual({ id: 123, created: true });
    });

    it('should send request with custom headers', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: {}
      };

      axios.mockResolvedValue(mockResponse);

      await http.sendRequest({
        method: 'GET',
        url: 'http://example.com/api',
        headers: {
          'Authorization': 'Bearer token123',
          'X-Custom-Header': 'value'
        }
      });

      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer token123',
            'X-Custom-Header': 'value'
          }
        })
      );
    });

    it('should send request with custom timeout', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: {}
      };

      axios.mockResolvedValue(mockResponse);

      await http.sendRequest({
        method: 'GET',
        url: 'http://example.com/api',
        timeout: 5000
      });

      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 5000
        })
      );
    });
  });

  describe('sendRequest() - Status Code Handling', () => {
    it('should handle 200 OK response', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { success: true }
      };

      axios.mockResolvedValue(mockResponse);

      const result = await http.sendRequest({
        method: 'GET',
        url: 'http://example.com/api'
      });

      expect(result.status).toBe(200);
      expect(result.statusText).toBe('OK');
    });

    it('should handle 404 Not Found response', async () => {
      const mockResponse = {
        status: 404,
        statusText: 'Not Found',
        headers: {},
        data: { error: 'Resource not found' }
      };

      axios.mockResolvedValue(mockResponse);

      const result = await http.sendRequest({
        method: 'GET',
        url: 'http://example.com/api/missing'
      });

      expect(result.status).toBe(404);
      expect(result.statusText).toBe('Not Found');
      expect(result.data).toEqual({ error: 'Resource not found' });
    });

    it('should handle 500 Internal Server Error response', async () => {
      const mockResponse = {
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        data: { error: 'Server error' }
      };

      axios.mockResolvedValue(mockResponse);

      const result = await http.sendRequest({
        method: 'GET',
        url: 'http://example.com/api'
      });

      expect(result.status).toBe(500);
      expect(result.statusText).toBe('Internal Server Error');
    });

    it('should handle 201 Created response', async () => {
      const mockResponse = {
        status: 201,
        statusText: 'Created',
        headers: { 'location': '/api/resource/123' },
        data: { id: 123 }
      };

      axios.mockResolvedValue(mockResponse);

      const result = await http.sendRequest({
        method: 'POST',
        url: 'http://example.com/api/resource',
        data: { name: 'New Resource' }
      });

      expect(result.status).toBe(201);
      expect(result.statusText).toBe('Created');
    });

    it('should handle 204 No Content response', async () => {
      const mockResponse = {
        status: 204,
        statusText: 'No Content',
        headers: {},
        data: ''
      };

      axios.mockResolvedValue(mockResponse);

      const result = await http.sendRequest({
        method: 'DELETE',
        url: 'http://example.com/api/resource/123'
      });

      expect(result.status).toBe(204);
      expect(result.statusText).toBe('No Content');
    });

    it('should handle 401 Unauthorized response', async () => {
      const mockResponse = {
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        data: { error: 'Authentication required' }
      };

      axios.mockResolvedValue(mockResponse);

      const result = await http.sendRequest({
        method: 'GET',
        url: 'http://example.com/api/protected'
      });

      expect(result.status).toBe(401);
    });

    it('should handle 403 Forbidden response', async () => {
      const mockResponse = {
        status: 403,
        statusText: 'Forbidden',
        headers: {},
        data: { error: 'Access denied' }
      };

      axios.mockResolvedValue(mockResponse);

      const result = await http.sendRequest({
        method: 'GET',
        url: 'http://example.com/api/admin'
      });

      expect(result.status).toBe(403);
    });
  });

  describe('sendRequest() - Error Handling', () => {
    it('should handle network error (no response)', async () => {
      const networkError = new Error('Network Error');
      networkError.request = {}; // Indicates request was made but no response

      axios.mockRejectedValue(networkError);

      await expect(
        http.sendRequest({
          method: 'GET',
          url: 'http://unreachable.example.com'
        })
      ).rejects.toThrow('Unable to reach http://unreachable.example.com');
    });

    it('should handle timeout error', async () => {
      const timeoutError = new Error('timeout of 5000ms exceeded');
      timeoutError.code = 'ECONNABORTED';

      axios.mockRejectedValue(timeoutError);

      await expect(
        http.sendRequest({
          method: 'GET',
          url: 'http://slow.example.com',
          timeout: 5000
        })
      ).rejects.toThrow('Request timeout after 5000ms');
    });

    it('should handle timeout error by message', async () => {
      const timeoutError = new Error('timeout of 30000ms exceeded');

      axios.mockRejectedValue(timeoutError);

      await expect(
        http.sendRequest({
          method: 'GET',
          url: 'http://slow.example.com'
        })
      ).rejects.toThrow('Request timeout after 30000ms');
    });

    it('should handle connection refused', async () => {
      const connectionError = new Error('connect ECONNREFUSED 127.0.0.1:3000');
      connectionError.request = {};

      axios.mockRejectedValue(connectionError);

      await expect(
        http.sendRequest({
          method: 'GET',
          url: 'http://localhost:3000'
        })
      ).rejects.toThrow('Unable to reach http://localhost:3000');
    });

    it('should handle DNS resolution error', async () => {
      const dnsError = new Error('getaddrinfo ENOTFOUND invalid.domain');
      dnsError.request = {};

      axios.mockRejectedValue(dnsError);

      await expect(
        http.sendRequest({
          method: 'GET',
          url: 'http://invalid.domain'
        })
      ).rejects.toThrow('Unable to reach http://invalid.domain');
    });

    it('should handle general request errors', async () => {
      const genericError = new Error('Something went wrong');

      axios.mockRejectedValue(genericError);

      await expect(
        http.sendRequest({
          method: 'GET',
          url: 'http://example.com'
        })
      ).rejects.toThrow('Request failed: Something went wrong');
    });

    it('should handle error with response (edge case)', async () => {
      const errorWithResponse = new Error('Bad Request');
      errorWithResponse.response = {
        status: 400,
        statusText: 'Bad Request'
      };

      axios.mockRejectedValue(errorWithResponse);

      await expect(
        http.sendRequest({
          method: 'POST',
          url: 'http://example.com/api'
        })
      ).rejects.toThrow('HTTP 400: Bad Request');
    });
  });

  describe('sendRequest() - Timing Measurement', () => {
    it('should measure request duration', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: {}
      };

      // Add a small delay to simulate network latency
      axios.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(mockResponse), 50);
        });
      });

      const result = await http.sendRequest({
        method: 'GET',
        url: 'http://example.com/api'
      });

      expect(result.durationMs).toBeGreaterThanOrEqual(50);
      expect(result.durationMs).toBeLessThan(200); // Should be reasonably fast
    });

    it('should include durationMs in response even for fast requests', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: {}
      };

      axios.mockResolvedValue(mockResponse);

      const result = await http.sendRequest({
        method: 'GET',
        url: 'http://example.com/api'
      });

      expect(result).toHaveProperty('durationMs');
      expect(typeof result.durationMs).toBe('number');
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('sendRequest() - Default Values', () => {
    it('should use default timeout of 30000ms when not specified', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: {}
      };

      axios.mockResolvedValue(mockResponse);

      await http.sendRequest({
        method: 'GET',
        url: 'http://example.com/api'
      });

      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 30000
        })
      );
    });

    it('should set default Content-Type when data is provided without headers', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: {}
      };

      axios.mockResolvedValue(mockResponse);

      await http.sendRequest({
        method: 'POST',
        url: 'http://example.com/api',
        data: { key: 'value' }
      });

      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    it('should not override existing Content-Type header', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: {}
      };

      axios.mockResolvedValue(mockResponse);

      await http.sendRequest({
        method: 'POST',
        url: 'http://example.com/api',
        headers: { 'Content-Type': 'text/plain' },
        data: 'plain text data'
      });

      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: { 'Content-Type': 'text/plain' }
        })
      );
    });

    it('should not set Content-Type when no data is provided', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: {}
      };

      axios.mockResolvedValue(mockResponse);

      await http.sendRequest({
        method: 'GET',
        url: 'http://example.com/api'
      });

      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {}
        })
      );
    });

    it('should handle lowercase content-type header', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: {}
      };

      axios.mockResolvedValue(mockResponse);

      await http.sendRequest({
        method: 'POST',
        url: 'http://example.com/api',
        headers: { 'content-type': 'application/xml' },
        data: '<xml>data</xml>'
      });

      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: { 'content-type': 'application/xml' }
        })
      );
    });
  });

  describe('sendRequest() - validateStatus', () => {
    it('should accept all status codes with validateStatus function', async () => {
      const mockResponse = {
        status: 404,
        statusText: 'Not Found',
        headers: {},
        data: {}
      };

      axios.mockResolvedValue(mockResponse);

      await http.sendRequest({
        method: 'GET',
        url: 'http://example.com/api'
      });

      const axiosCall = axios.mock.calls[0][0];
      expect(axiosCall.validateStatus).toBeDefined();
      expect(typeof axiosCall.validateStatus).toBe('function');

      // validateStatus should return true for any status
      expect(axiosCall.validateStatus(200)).toBe(true);
      expect(axiosCall.validateStatus(404)).toBe(true);
      expect(axiosCall.validateStatus(500)).toBe(true);
    });
  });

  describe('sendRequest() - Different HTTP Methods', () => {
    it.each(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])(
      'should handle %s method',
      async (method) => {
        const mockResponse = {
          status: 200,
          statusText: 'OK',
          headers: {},
          data: {}
        };

        axios.mockResolvedValue(mockResponse);

        const result = await http.sendRequest({
          method: method,
          url: 'http://example.com/api'
        });

        expect(result.status).toBe(200);
        expect(axios).toHaveBeenCalledWith(
          expect.objectContaining({
            method: method
          })
        );
      }
    );
  });

  describe('sendRequest() - Response Data Types', () => {
    it('should handle JSON response data', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        data: { key: 'value', nested: { data: true } }
      };

      axios.mockResolvedValue(mockResponse);

      const result = await http.sendRequest({
        method: 'GET',
        url: 'http://example.com/api'
      });

      expect(result.data).toEqual({ key: 'value', nested: { data: true } });
    });

    it('should handle plain text response data', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'text/plain' },
        data: 'Plain text response'
      };

      axios.mockResolvedValue(mockResponse);

      const result = await http.sendRequest({
        method: 'GET',
        url: 'http://example.com/api'
      });

      expect(result.data).toBe('Plain text response');
    });

    it('should handle empty response data', async () => {
      const mockResponse = {
        status: 204,
        statusText: 'No Content',
        headers: {},
        data: ''
      };

      axios.mockResolvedValue(mockResponse);

      const result = await http.sendRequest({
        method: 'DELETE',
        url: 'http://example.com/api/resource'
      });

      expect(result.data).toBe('');
    });

    it('should handle array response data', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        data: [1, 2, 3, 4, 5]
      };

      axios.mockResolvedValue(mockResponse);

      const result = await http.sendRequest({
        method: 'GET',
        url: 'http://example.com/api/list'
      });

      expect(result.data).toEqual([1, 2, 3, 4, 5]);
    });
  });
});
