/**
 * @jest-environment jsdom
 */

// Read the js/api.js file content so we can test the function without ES modules
const fs = require('fs');
const path = require('path');
const apiJsCode = fs.readFileSync(path.resolve(__dirname, '../../js/api.js'), 'utf8');

// Evaluate the script to bring apiFetch into scope
eval(apiJsCode);

describe('apiFetch', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should return data on successful unwrapped response', async () => {
    const mockResponse = { success: true, data: { key: 'value' } };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await apiFetch('/test-endpoint');
    expect(result).toEqual({ key: 'value' });
    expect(global.fetch).toHaveBeenCalledWith('/test-endpoint', {
      method: 'GET',
      credentials: 'include',
    });
  });

  test('should throw error on unsuccessful response', async () => {
    const mockResponse = { success: false, error: 'Test error message' };
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => mockResponse,
    });

    await expect(apiFetch('/test-endpoint')).rejects.toThrow('Test error message');
  });

  test('should handle JSON payload for POST requests', async () => {
    const mockResponse = { success: true, data: { id: 1 } };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const payload = { test: 123 };
    const result = await apiFetch('/test-endpoint', 'POST', payload);

    expect(result).toEqual({ id: 1 });
    expect(global.fetch).toHaveBeenCalledWith('/test-endpoint', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  });
});
