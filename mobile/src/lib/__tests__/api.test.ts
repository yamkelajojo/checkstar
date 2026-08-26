import { createApiClient, ApiError, apiErrorReason, DEFAULT_RETRY_OPTIONS, type RetryOptions } from '../api';

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

  it('surfaces the parsed body (message and reason) on a non-2xx conflict', async () => {
    const api = createApiClient({
      baseUrl: 'https://x.test',
      getToken: () => 'tok',
      onUnauthorized: jest.fn(),
      fetchFn: jsonFetch(409, { message: 'Order cannot be cancelled', reason: 'order_not_cancellable', status: 409 }) as unknown as typeof fetch,
    });
    const error = await api.post('/orders/42/cancel', {}).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    const apiError = error as ApiError;
    expect(apiError.status).toBe(409);
    expect(apiError.message).toBe('Order cannot be cancelled');
    expect(apiError.payload).toMatchObject({ reason: 'order_not_cancellable' });
    expect(apiErrorReason(error)).toBe('order_not_cancellable');
  });

  it('returns null from apiErrorReason for non-ApiError values and missing reasons', () => {
    expect(apiErrorReason(new Error('boom'))).toBeNull();
    expect(apiErrorReason(null)).toBeNull();
    expect(apiErrorReason(new ApiError('no body', 500, null))).toBeNull();
  });
});

describe('retry logic', () => {
  // Use real timers with small delays for fast, reliable tests
  // Fake timers have issues with async/await and Promise scheduling

  it('retries on 503 and succeeds on second attempt', async () => {
    let callCount = 0;
    const fetchFn = jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve(jsonResponse(503, { message: 'Service unavailable' }));
      return Promise.resolve(jsonResponse(200, { data: 'ok' }));
    });

    const api = createApiClient({
      baseUrl: 'https://x.test',
      getToken: () => null,
      onUnauthorized: jest.fn(),
      fetchFn,
      retryOptions: { maxRetries: 3, baseDelayMs: 10, maxDelayMs: 50 },
    });

    const result = await api.get('/test', {}, false);
    expect(result).toEqual({ data: 'ok' });
    expect(callCount).toBe(2);
  });

  it('retries on network error and succeeds', async () => {
    let callCount = 0;
    const fetchFn = jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.reject(new Error('network error'));
      return Promise.resolve(jsonResponse(200, { data: 'ok' }));
    });

    const api = createApiClient({
      baseUrl: 'https://x.test',
      getToken: () => null,
      onUnauthorized: jest.fn(),
      fetchFn,
      retryOptions: { maxRetries: 3, baseDelayMs: 10, maxDelayMs: 50 },
    });

    const result = await api.get('/test', {}, false);
    expect(result).toEqual({ data: 'ok' });
    expect(callCount).toBe(2);
  });

  it('gives up after maxRetries and throws ApiError with isRetryable', async () => {
    const fetchFn = jest.fn().mockImplementation(() => Promise.resolve(jsonResponse(503, { message: 'Service unavailable' })));

    const api = createApiClient({
      baseUrl: 'https://x.test',
      getToken: () => null,
      onUnauthorized: jest.fn(),
      fetchFn,
      retryOptions: { maxRetries: 2, baseDelayMs: 10, maxDelayMs: 50 },
    });

    let error: unknown;
    try {
      await api.get('/test', {}, false);
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).isRetryable).toBe(true);
    expect(fetchFn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it('does not retry on 400 (non-retryable status)', async () => {
    const fetchFn = jest.fn().mockImplementation(() => Promise.resolve(jsonResponse(400, { message: 'Bad request' })));

    const api = createApiClient({
      baseUrl: 'https://x.test',
      getToken: () => null,
      onUnauthorized: jest.fn(),
      fetchFn,
      retryOptions: { maxRetries: 3, baseDelayMs: 10, maxDelayMs: 50 },
    });

    await expect(api.get('/test', {}, false)).rejects.toThrow(ApiError);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('retries on timeout (AbortError)', async () => {
    let callCount = 0;
    const fetchFn = jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        const error = new DOMException('Aborted', 'AbortError');
        return Promise.reject(error);
      }
      return Promise.resolve(jsonResponse(200, { data: 'ok' }));
    });

    const api = createApiClient({
      baseUrl: 'https://x.test',
      getToken: () => null,
      onUnauthorized: jest.fn(),
      fetchFn,
      retryOptions: { maxRetries: 3, baseDelayMs: 10, maxDelayMs: 50 },
      requestTimeoutMs: 50,
    });

    const result = await api.get('/test', {}, false);
    expect(result).toEqual({ data: 'ok' });
    expect(callCount).toBe(2);
  });

  it('includes jitter in backoff calculation', async () => {
    const delays: number[] = [];
    let callCount = 0;
    const fetchFn = jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount < 3) return Promise.resolve(jsonResponse(503, { message: 'Service unavailable' }));
      return Promise.resolve(jsonResponse(200, { data: 'ok' }));
    });

    const api = createApiClient({
      baseUrl: 'https://x.test',
      getToken: () => null,
      onUnauthorized: jest.fn(),
      fetchFn,
      retryOptions: { maxRetries: 3, baseDelayMs: 100, maxDelayMs: 1000 },
      requestTimeoutMs: 60_000, // Long timeout so it doesn't trigger timeout retry
    });

    const promise = api.get('/test', {}, false);

    // Capture ONLY the sleep delays (filter out request timeout which is 60000)
    const originalSetTimeout = globalThis.setTimeout;
    globalThis.setTimeout = jest.fn((cb: () => void, delay: number) => {
      if (delay < 10_000) { // Only capture retry delays, not request timeout
        delays.push(delay);
      }
      return originalSetTimeout(cb, delay);
    }) as unknown as typeof setTimeout;

    await promise;

    globalThis.setTimeout = originalSetTimeout;

    // First retry delay should be around baseDelayMs (100) + jitter
    // Second retry delay should be around 2 * baseDelayMs (200) + jitter
    expect(delays.length).toBeGreaterThanOrEqual(2);
    expect(delays[0]).toBeGreaterThanOrEqual(90); // 100 * 0.9 (with jitter)
    expect(delays[0]).toBeLessThanOrEqual(120); // 100 * 1.2
    expect(delays[1]).toBeGreaterThanOrEqual(180); // 200 * 0.9
    expect(delays[1]).toBeLessThanOrEqual(240); // 200 * 1.2
  });
});