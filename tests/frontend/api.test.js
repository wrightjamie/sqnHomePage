import { apiFetch } from '../../js/api.js';
import { Toast } from '../../js/components/Toast.js';

// Mock Toast module
jest.mock('../../js/components/Toast.js', () => ({
    Toast: { show: jest.fn() }
}));

// Mock fetch
global.fetch = jest.fn();

describe('apiFetch', () => {
  beforeEach(() => {
    global.fetch.mockClear();
    Toast.show.mockClear();
  });

  it('should return data on successful JSON response', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { foo: 'bar' } })
    });

    const result = await apiFetch('/test-endpoint');
    expect(result).toEqual({ foo: 'bar' });
  });

  it('should throw an error and show Toast on HTTP error status', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not Found' })
    });

    await expect(apiFetch('/test-endpoint')).rejects.toThrow('Not Found');
    expect(Toast.show).toHaveBeenCalledWith('Not Found', 'error');
  });

  it('should throw an error and show Toast when success is false', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, error: 'Custom error message' })
    });

    await expect(apiFetch('/test-endpoint')).rejects.toThrow('Custom error message');
    expect(Toast.show).toHaveBeenCalledWith('Custom error message', 'error');
  });
});
