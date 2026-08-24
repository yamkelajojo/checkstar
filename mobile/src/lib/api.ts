export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export interface QueryParams {
  [key: string]: string | number | boolean | undefined | null;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown,
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
}

function toQueryString(params: QueryParams): string {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== '');
  if (entries.length === 0) return '';
  const qs = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
  return `?${qs}`;
}

export function createApiClient(config: ApiClientConfig) {
  const fetchFn = config.fetchFn ?? ((...args: Parameters<typeof fetch>) => fetch(...args));

  async function request<T>(
    method: HttpMethod,
    path: string,
    body: unknown,
    auth: boolean,
    params: QueryParams,
  ): Promise<T> {
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

    const response = await fetchFn(`${config.baseUrl}${path}${toQueryString(params)}`, init);

    const payload = await response.json().catch(() => null);

    if (response.status === 401) {
      if (auth && token) config.onUnauthorized();
      throw new ApiError('Unauthorized', response.status, payload);
    }
    if (!response.ok) {
      const message = (payload as { message?: string } | null)?.message ?? `Request failed (${response.status})`;
      throw new ApiError(message, response.status, payload);
    }
    return payload as T;
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