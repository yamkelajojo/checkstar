export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export interface QueryParams {
  [key: string]: string | number | boolean | undefined | null;
}

export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableStatuses: number[];
  retryableErrors: string[];
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 500,
  maxDelayMs: 5000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['network', 'timeout', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT'],
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown,
    public readonly isRetryable: boolean = false,
    public readonly isOffline: boolean = false,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Machine-readable reason code from an error response body (e.g. the
 * `reason` on a 409 cancel conflict), or null when there is none.
 */
export function apiErrorReason(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  const reason = (error.payload as { reason?: unknown } | null)?.reason;
  return typeof reason === 'string' ? reason : null;
}

export interface ApiClientConfig {
  baseUrl: string;
  getToken: () => string | null;
  onUnauthorized: () => void;
  fetchFn?: typeof fetch;
  retryOptions?: Partial<RetryOptions>;
  requestTimeoutMs?: number;
  isOnline?: () => boolean;
}

function toQueryString(params: QueryParams): string {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== '');
  if (entries.length === 0) return '';
  const qs = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
  return `?${qs}`;
}

function isRetryableError(error: unknown, retryOptions: RetryOptions): boolean {
  if (error instanceof ApiError) {
    if (error.isRetryable) return true;
    if (retryOptions.retryableStatuses.includes(error.status)) return true;
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return retryOptions.retryableErrors.some((e) => message.includes(e.toLowerCase()));
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateBackoff(attempt: number, options: RetryOptions): number {
  const delay = Math.min(options.baseDelayMs * Math.pow(2, attempt), options.maxDelayMs);
  const jitter = delay * 0.1 * Math.random();
  return delay + jitter;
}

export function createApiClient(config: ApiClientConfig) {
  const fetchFn = config.fetchFn ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
  const retryOptions: RetryOptions = { ...DEFAULT_RETRY_OPTIONS, ...config.retryOptions };
  const requestTimeoutMs = config.requestTimeoutMs ?? 30_000;
  const isOnline = config.isOnline ?? (() => true);

  async function request<T>(
    method: HttpMethod,
    path: string,
    body: unknown,
    auth: boolean,
    params: QueryParams,
    attempt = 0,
  ): Promise<T> {
    // Check if online before making request (only for non-retry attempts)
    if (attempt === 0 && !isOnline()) {
      throw new ApiError('No internet connection', 0, null, true, true);
    }

    const token = auth ? config.getToken() : null;
    const headers: Record<string, string> = {};
    let hasHeaders = false;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      hasHeaders = true;
    }
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      hasHeaders = true;
    }

    const init: RequestInit = { method };
    if (hasHeaders) init.headers = headers;
    if (body !== undefined) init.body = JSON.stringify(body);

    const url = `${config.baseUrl}${path}${toQueryString(params)}`;
    // Debug: surface actual URL being fetched (visible in Metro logs)
    if (attempt === 0) {
      console.log(`[API] ${method} ${url} auth=${auth} online=${isOnline()}`);
    }

    let controller: AbortController | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
      controller = new AbortController();
      timeoutId = setTimeout(() => controller?.abort(), requestTimeoutMs);

      const response = await fetchFn(url, { ...init, signal: controller.signal });
      clearTimeout(timeoutId!);
      timeoutId = null;

      const payload = await response.json().catch(() => null);

      if (response.status === 401) {
        if (auth && token) config.onUnauthorized();
        throw new ApiError('Unauthorized', response.status, payload);
      }

      if (!response.ok) {
        const message = (payload as { message?: string } | null)?.message ?? `Request failed (${response.status})`;
        const isRetryable = retryOptions.retryableStatuses.includes(response.status);
        const error = new ApiError(message, response.status, payload, isRetryable);

        if (isRetryable && attempt < retryOptions.maxRetries) {
          await sleep(calculateBackoff(attempt, retryOptions));
          return request(method, path, body, auth, params, attempt + 1);
        }
        throw error;
      }
      return payload as T;
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);

      if (error instanceof DOMException && error.name === 'AbortError') {
        const timeoutError = new ApiError('Request timeout', 408, null, true);
        if (attempt < retryOptions.maxRetries) {
          await sleep(calculateBackoff(attempt, retryOptions));
          return request(method, path, body, auth, params, attempt + 1);
        }
        throw timeoutError;
      }

      if (error instanceof ApiError) throw error;

      const isRetryable = isRetryableError(error, retryOptions);
      const isOffline = !isOnline();
      console.log(`[API] fetch failed: ${error instanceof Error ? error.message : String(error)} url=${url} offline=${isOffline} online=${isOnline()}`);
      const apiError = new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0,
        null,
        isRetryable,
        isOffline,
      );

      if (isRetryable && attempt < retryOptions.maxRetries) {
        await sleep(calculateBackoff(attempt, retryOptions));
        return request(method, path, body, auth, params, attempt + 1);
      }
      throw apiError;
    }
  }

  return {
    get: <T>(path: string, params?: QueryParams, auth = false) =>
      request<T>('GET', path, undefined, auth, params ?? {}),
    post: <T>(path: string, body?: unknown, auth = true, params?: QueryParams) =>
      request<T>('POST', path, body, auth, params ?? {}),
    patch: <T>(path: string, body?: unknown, auth = true) =>
      request<T>('PATCH', path, body, auth, {}),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;