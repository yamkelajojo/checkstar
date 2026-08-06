import { createApiClient } from '../api';

function jsonResponse(status: number, data: unknown, headers: Record<string, string> = {}): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers,
    json: () => Promise.resolve(data),
  } as unknown as Response;
}

const jsonFetch = (status: number, data: unknown = {}) =>
  jest.fn().mockImplementation((): Promise<Response> => Promise.resolve(jsonResponse(status, data)));

describe('api client', () => {
  it('attaches the Bearer token for authenticated calls when a token is present', async () => {
    let capturedHeaders: HeadersInit | undefined;
    const fetchFn = jest.fn().mockImplementation(async (_url: string, init?: RequestInit) => {
      if (init) capturedHeaders = init.headers;
      return jsonResponse(200, {});
    });
    const api = createApiClient({ baseUrl: 'https://x.test', getToken: () => 'tok-1', onUnauthorized: jest.fn(), fetchFn });
    await api.get('/products', {}, true);
    expect(capturedHeaders).toEqual({ Authorization: 'Bearer tok-1' });
  });

  it('omits the Authorization header for public requests', async () => {
    const fetchFn = jest.fn().mockImplementation(async () => jsonResponse(200, {}));
    const api = createApiClient({ baseUrl: 'https://x.test', getToken: () => 'tok-1', onUnauthorized: jest.fn(), fetchFn });
    await api.get('/products', {}, false);
    const init = fetchFn.mock.calls[0][1] as RequestInit;
    expect(init.headers).toBeUndefined();
  });

  it('sends a JSON body and correct headers on POST', async () => {
    const fetchFn = jest.fn().mockImplementation(async () => jsonResponse(200, {}));
    const api = createApiClient({ baseUrl: 'https://x.test', getToken: () => 'tok-1', onUnauthorized: jest.fn(), fetchFn });
    await api.post('/orders', { address: '1 Main' }, true);
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://x.test/orders');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/json',
      Authorization: 'Bearer tok-1',
    });
    expect(JSON.parse(init.body as string)).toEqual({ address: '1 Main' });
  });

  it('appends query parameters, skipping empty ones', async () => {
    const fetchFn = jest.fn().mockImplementation(async () => jsonResponse(200, {}));
    const api = createApiClient({ baseUrl: 'https://x.test', getToken: () => null, onUnauthorized: jest.fn(), fetchFn });
    await api.get('/products', { store_id: 3, search: undefined }, false);
    const url = fetchFn.mock.calls[0][0] as string;
    expect(url).toBe('https://x.test/products?store_id=3');
  });

  it('calls onUnauthorized and throws when an authenticated request gets a 401', async () => {
    const onUnauthorized = jest.fn();
    const api = createApiClient({ baseUrl: 'https://x.test', getToken: () => 'tok', onUnauthorized, fetchFn: jsonFetch(401) as unknown as typeof fetch });
    await expect(api.get('/me', {}, true)).rejects.toThrow();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('does not call onUnauthorized for a public 401 (guest browsing unaffected)', async () => {
    const onUnauthorized = jest.fn();
    const api = createApiClient({ baseUrl: 'https://x.test', getToken: () => null, onUnauthorized, fetchFn: jsonFetch(401) as unknown as typeof fetch });
    await expect(api.get('/products', {}, false)).rejects.toThrow();
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('returns the parsed JSON body on success', async () => {
    const api = createApiClient({ baseUrl: 'https://x.test', getToken: () => null, onUnauthorized: jest.fn(), fetchFn: jsonFetch(200, { data: [1, 2] }) as unknown as typeof fetch });
    const body = await api.get<{ data: number[] }>('/products', {}, false);
    expect(body.data).toEqual([1, 2]);
  });
});