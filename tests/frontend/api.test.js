const fs = require('fs');
const path = require('path');
const apiJsContent = fs.readFileSync(path.join(__dirname, '../../js/api.js'), 'utf8');
const vm = require('vm');

const context = vm.createContext({
    fetch: jest.fn(),
    Toast: { show: jest.fn() },
    FormData: class {}
});

vm.runInContext(apiJsContent, context);

describe('apiFetch', () => {
  beforeEach(() => {
    context.fetch.mockClear();
    context.Toast.show.mockClear();
  });

  it('should return data on successful JSON response', async () => {
    context.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { foo: 'bar' } })
    });

    const result = await context.apiFetch('/test-endpoint');
    expect(result).toEqual({ foo: 'bar' });
  });

  it('should throw an error and show Toast on HTTP error status', async () => {
    context.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not Found' })
    });

    await expect(context.apiFetch('/test-endpoint')).rejects.toThrow('Not Found');
    expect(context.Toast.show).toHaveBeenCalledWith('Not Found', 'error');
  });

  it('should throw an error and show Toast when success is false', async () => {
    context.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, error: 'Custom error message' })
    });

    await expect(context.apiFetch('/test-endpoint')).rejects.toThrow('Custom error message');
    expect(context.Toast.show).toHaveBeenCalledWith('Custom error message', 'error');
  });
});
