import { createApiClient, type ApiClient, type QueryParams, type RetryOptions } from './api';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { storage, STORAGE_KEYS } from './storage';
import { isOnline } from './networkStatus';
import type { ApiAuthResponse, ApiCartSyncResponse, ApiCategory, ApiOrder, ApiPagination, ApiPlaceOrderResponse, ApiProduct, ApiStore, ApiUser } from './types';
import Constants from 'expo-constants';

// Default fallback - user MUST configure this for their physical device
// 10.0.2.2 only works on Android emulator
const DEFAULT_API_URL = 'http://10.0.2.2:8000/api';

/**
 * Extract the Metro bundler host IP from the Expo manifest.
 * When running via `exp://192.168.x.x:8081`, the manifest contains the host.
 * Returns the IP address or null if not detectable.
 * Supports both legacy Constants.manifest (SDK <53) and Constants.expoConfig (SDK 54+).
 */
function getMetroHostIp(): string | null {
  try {
    const candidates: (string | undefined)[] = [
      // SDK <53 legacy
      (Constants as any).manifest?.debuggerHost,
      (Constants as any).manifest?.hostUri,
      (Constants as any).manifest?.bundleUrl,
      // SDK 54+ via expoConfig
      (Constants as any).expoConfig?.hostUri,
      (Constants as any).expoConfig?.extra?.hostUri,
      // manifest2 (Expo Go)
      (Constants as any).manifest2?.extra?.expoGo?.debuggerHost,
      (Constants as any).manifest2?.extra?.expoGo?.developer?.host,
    ];

    for (const raw of candidates) {
      if (!raw) continue;
      try {
        // raw may be "192.168.0.149:8081" or "exp://192.168.0.149:8081" or full URL
        if (raw.includes('://')) {
          const url = new URL(raw);
          const host = url.hostname;
          if (host && host !== 'localhost' && host !== '127.0.0.1' && host !== '10.0.2.2') {
            return host;
          }
        } else {
          const host = raw.split(':')[0];
          if (host && host !== 'localhost' && host !== '127.0.0.1' && host !== '10.0.2.2') {
            // basic IP/host validation
            if (host.includes('.') || host.includes(':')) return host;
          }
        }
      } catch {}
    }

    // Last fallback: try bundleUrl as URL string
    const bundleUrl = (Constants as any).manifest?.bundleUrl;
    if (bundleUrl) {
      const url = new URL(bundleUrl);
      const host = url.hostname;
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return host;
      }
    }
  } catch {}
  return null;
}

/**
 * Auto-detect the API base URL.
 * Priority:
 * 1. Stored user preference (AsyncStorage)
 * 2. Auto-detected from Metro host (physical device) — preferred on device
 * 3. EXPO_PUBLIC_API_URL env var
 * 4. Platform-specific defaults (emulator/simulator)
 *
 * Note: EXPO_PUBLIC_API_URL is intentionally AFTER metro detection so that
 * `http://10.0.2.2:8000/api` (emulator-only) doesn't break physical devices.
 * If EXPO_PUBLIC_API_URL is a LAN IP (192.168.x.x) it will still be used as fallback.
 */
async function getConfiguredApiUrl(): Promise<string> {
  // 1. Check stored preference
  try {
    const stored = await storage.get<string>(STORAGE_KEYS.apiBaseUrl);
    if (stored) return stored;
  } catch {}

  // 2. Auto-detect from Metro host (physical device) — must run before env var
  const metroIp = getMetroHostIp();
  if (metroIp) {
    return `http://${metroIp}:8000/api`;
  }

  // 3. Check env var (fallback if auto-detect failed)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 4. Platform-specific defaults
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api'; // Android emulator
  }
  if (Platform.OS === 'ios') {
    return 'http://localhost:8000/api'; // iOS simulator
  }

  // 5. Fallback
  return DEFAULT_API_URL;
}

export async function setApiBaseUrl(url: string): Promise<void> {
  await storage.set(STORAGE_KEYS.apiBaseUrl, url);
}

export async function getApiBaseUrl(): Promise<string> {
  return getConfiguredApiUrl();
}

// Lazy initialization - will be resolved on first API call
let apiBaseUrlPromise: Promise<string> | null = null;
function getApiBaseUrlPromise(): Promise<string> {
  if (!apiBaseUrlPromise) {
    apiBaseUrlPromise = getConfiguredApiUrl();
  }
  return apiBaseUrlPromise;
}

const TOKEN_KEY = 'checkstar.auth.token';

// expo-secure-store has no web implementation, so the auth token falls back
// to AsyncStorage (storage) on web.
export const tokenStorage =
  Platform.OS === 'web'
    ? {
        async get(): Promise<string | null> {
          return storage.get<string>(TOKEN_KEY);
        },
        async set(token: string): Promise<void> {
          await storage.set(TOKEN_KEY, token);
        },
        async clear(): Promise<void> {
          await storage.remove(TOKEN_KEY);
        },
      }
    : {
        async get(): Promise<string | null> {
          return SecureStore.getItemAsync(TOKEN_KEY);
        },
        async set(token: string): Promise<void> {
          await SecureStore.setItemAsync(TOKEN_KEY, token);
        },
        async clear(): Promise<void> {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
        },
      };

// Mutable bearer token, kept in sync by the session store on login/logout/boot.
let currentToken: string | null = null;
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

export function setAuthToken(token: string | null): void {
  currentToken = token;
}

async function refreshAccessToken(): Promise<string | null> {
  // If already refreshing, wait for the existing refresh
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const token = await tokenStorage.get();
      if (!token) return null;

      // Call the refresh endpoint
      const baseUrl = await getApiBaseUrlPromise();
      const response = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const newToken = data.token ?? data.access_token ?? null;

      if (newToken) {
        currentToken = newToken;
        await tokenStorage.set(newToken);
      }
      return newToken;
    } catch {
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler = () => {};

export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  onUnauthorized = handler;
}

let client: ApiClient | null = null;

export async function getApi(): Promise<ApiClient> {
  if (!client) {
    const baseUrl = await getApiBaseUrlPromise();
    client = createApiClient({
      baseUrl,
      getToken: () => currentToken,
      onUnauthorized: async () => {
        // Try to refresh token on 401
        const newToken = await refreshAccessToken();
        if (!newToken) {
          onUnauthorized();
        }
      },
      retryOptions: {
        maxRetries: 3,
        baseDelayMs: 500,
        maxDelayMs: 5000,
      },
      requestTimeoutMs: 30_000,
      isOnline,
    });
  }
  return client;
}

// Reset client when API URL changes
export async function resetApiClient(): Promise<void> {
  client = null;
  apiBaseUrlPromise = null;
  await getApi(); // Re-initialize
}

// Force token refresh (call after successful login or when needed)
export async function forceTokenRefresh(): Promise<string | null> {
  return refreshAccessToken();
}

// ---- Auth endpoints ----

export async function login(email: string, password: string): Promise<ApiAuthResponse> {
  const api = await getApi();
  return api.post<ApiAuthResponse>('/auth/login', { email, password }, false);
}

export async function register(name: string, email: string, password: string, phone?: string): Promise<ApiAuthResponse> {
  const api = await getApi();
  return api.post<ApiAuthResponse>('/auth/register', { name, email, password, password_confirmation: password, phone }, false);
}

export async function registerRider(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  vehicle_type?: string;
  banking_details?: Record<string, unknown>;
}): Promise<ApiAuthResponse> {
  const api = await getApi();
  return api.post<ApiAuthResponse>(
    '/auth/register/rider',
    { ...input, password_confirmation: input.password },
    false,
  );
}

export async function fetchCurrentUser(): Promise<ApiUser> {
  const api = await getApi();
  const res = await api.get<{ user: ApiUser }>('/auth/user', undefined, true);
  return res.user;
}

// ---- Public catalog ----

export async function fetchCategories(): Promise<ApiCategory[]> {
  const api = await getApi();
  const res = await api.get<{ data: ApiCategory[] }>('/categories', undefined, false);
  return res.data;
}

export async function fetchProducts(params: QueryParams): Promise<ApiPagination<ApiProduct>> {
  const api = await getApi();
  return api.get<ApiPagination<ApiProduct>>('/products', params, false);
}

export async function fetchProductBySlug(slug: string): Promise<ApiProduct> {
  const api = await getApi();
  const res = await api.get<{ data: ApiProduct }>(`/products/${slug}`, undefined, false);
  return res.data;
}

export async function fetchStores(): Promise<ApiStore[]> {
  const api = await getApi();
  const res = await api.get<ApiStore[] | { data: ApiStore[] }>('/stores', undefined, false);
  return Array.isArray(res) ? res : res.data;
}

export async function fetchSpecials(params: QueryParams): Promise<ApiPagination<ApiProduct>> {
  const api = await getApi();
  return api.get<ApiPagination<ApiProduct>>('/specials', params, false);
}

// ---- Orders ----

export async function fetchOrders(): Promise<ApiOrder[]> {
  const api = await getApi();
  const res = await api.get<{ data: ApiOrder[] }>('/orders', undefined, true);
  return res.data;
}

export async function fetchOrder(id: number | string): Promise<ApiOrder> {
  const api = await getApi();
  const res = await api.get<{ data: ApiOrder }>(`/orders/${id}`, undefined, true);
  return res.data;
}

export async function placeOrder(input: {
  items: { product_id: number; quantity: number }[];
  delivery_address: string;
  delivery_latitude: number;
  delivery_longitude: number;
  delivery_notes?: string;
  payment_method?: 'cash_on_delivery';
}): Promise<ApiPlaceOrderResponse> {
  const api = await getApi();
  return api.post<ApiPlaceOrderResponse>('/orders', input, true);
}

export async function syncCart(items: { product_id: number; quantity: number }[]): Promise<ApiCartSyncResponse> {
  const api = await getApi();
  return api.post<ApiCartSyncResponse>('/cart/sync', { items }, true);
}

export async function cancelOrder(id: number | string, reason: string): Promise<ApiOrder> {
  const api = await getApi();
  const res = await api.post<{ data: ApiOrder }>(`/orders/${id}/cancel`, { reason }, true);
  return res.data;
}

export async function confirmDelivery(id: number | string): Promise<ApiOrder> {
  const api = await getApi();
  const res = await api.post<{ data: ApiOrder }>(`/orders/${id}/confirm`, {}, true);
  return res.data;
}

export async function reviewOrder(id: number | string, rating: number, comment?: string): Promise<ApiOrder> {
  const api = await getApi();
  const res = await api.post<{ data: ApiOrder }>(`/orders/${id}/review`, { rating, comment }, true);
  return res.data;
}

// ---- Rider ----

export async function toggleAvailability(): Promise<{ message: string }> {
  const api = await getApi();
  return api.post<{ message: string }>('/rider/toggle-availability', {}, true);
}

export async function fetchAvailableOrders(): Promise<ApiOrder[]> {
  const api = await getApi();
  const res = await api.get<{ data: ApiOrder[] }>('/rider/available-orders', undefined, true);
  return res.data;
}

export async function claimOrder(id: number | string): Promise<ApiOrder> {
  const api = await getApi();
  const res = await api.post<{ data: ApiOrder }>(`/rider/claim/${id}`, {}, true);
  return res.data;
}

export async function fetchActiveDeliveries(): Promise<ApiOrder[]> {
  const api = await getApi();
  const res = await api.get<{ data: ApiOrder[] }>('/rider/active-deliveries', undefined, true);
  return res.data;
}

export async function markItemsBought(id: number | string, itemIds: number[]): Promise<ApiOrder> {
  const api = await getApi();
  const res = await api.post<{ data: ApiOrder }>(`/rider/items-bought/${id}`, { item_ids: itemIds }, true);
  return res.data;
}

export async function markOutForDelivery(id: number | string): Promise<ApiOrder> {
  const api = await getApi();
  const res = await api.post<{ data: ApiOrder }>(`/rider/out-for-delivery/${id}`, {}, true);
  return res.data;
}

export async function markDelivered(id: number | string): Promise<ApiOrder> {
  const api = await getApi();
  const res = await api.post<{ data: ApiOrder }>(`/rider/delivered/${id}`, {}, true);
  return res.data;
}

export async function fetchRiderStats(): Promise<{ total_deliveries: number; average_rating: number | null; xp: number; level: number }> {
  const api = await getApi();
  return api.get('/rider/stats', undefined, true);
}

export async function fetchRiderHistory(): Promise<ApiOrder[]> {
  const api = await getApi();
  const res = await api.get<{ data: ApiOrder[] }>('/rider/history', undefined, true);
  return res.data;
}