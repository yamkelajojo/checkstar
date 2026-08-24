import { createApiClient, type ApiClient, type QueryParams } from './api';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { storage } from './storage';
import type { ApiAuthResponse, ApiCartSyncResponse, ApiCategory, ApiOrder, ApiPagination, ApiPlaceOrderResponse, ApiProduct, ApiStore, ApiUser } from './types';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.100:8000/api';

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

export function setAuthToken(token: string | null): void {
  currentToken = token;
}

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler = () => {};

export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  onUnauthorized = handler;
}

let client: ApiClient | null = null;

export function getApi(): ApiClient {
  if (!client) {
    client = createApiClient({
      baseUrl: API_BASE_URL,
      getToken: () => currentToken,
      onUnauthorized: () => onUnauthorized(),
    });
  }
  return client;
}

// ---- Auth endpoints ----

export async function login(email: string, password: string): Promise<ApiAuthResponse> {
  return getApi().post<ApiAuthResponse>('/auth/login', { email, password }, false);
}

export async function register(name: string, email: string, password: string, phone?: string): Promise<ApiAuthResponse> {
  return getApi().post<ApiAuthResponse>('/auth/register', { name, email, password, password_confirmation: password, phone }, false);
}

export async function registerRider(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  vehicle_type?: string;
  banking_details?: Record<string, unknown>;
}): Promise<ApiAuthResponse> {
  return getApi().post<ApiAuthResponse>(
    '/auth/register/rider',
    { ...input, password_confirmation: input.password },
    false,
  );
}

export async function fetchCurrentUser(): Promise<ApiUser> {
  const res = await getApi().get<{ user: ApiUser }>('/auth/user', undefined, true);
  return res.user;
}

// ---- Public catalog ---- 

export async function fetchCategories(): Promise<ApiCategory[]> {
  const res = await getApi().get<{ data: ApiCategory[] }>('/categories', undefined, false);
  return res.data;
}

export async function fetchProducts(params: QueryParams): Promise<ApiPagination<ApiProduct>> {
  return getApi().get<ApiPagination<ApiProduct>>('/products', params, false);
}

export async function fetchProductBySlug(slug: string): Promise<ApiProduct> {
  const res = await getApi().get<{ data: ApiProduct }>(`/products/${slug}`, undefined, false);
  return res.data;
}

export async function fetchStores(): Promise<ApiStore[]> {
  const res = await getApi().get<ApiStore[] | { data: ApiStore[] }>('/stores', undefined, false);
  return Array.isArray(res) ? res : res.data;
}

export async function fetchSpecials(params: QueryParams): Promise<ApiPagination<ApiProduct>> {
  return getApi().get<ApiPagination<ApiProduct>>('/specials', params, false);
}

// ---- Orders ----

export async function fetchOrders(): Promise<ApiOrder[]> {
  const res = await getApi().get<{ data: ApiOrder[] }>('/orders', undefined, true);
  return res.data;
}

export async function fetchOrder(id: number | string): Promise<ApiOrder> {
  const res = await getApi().get<{ data: ApiOrder }>(`/orders/${id}`, undefined, true);
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
  return getApi().post<ApiPlaceOrderResponse>('/orders', input, true);
}

export async function syncCart(items: { product_id: number; quantity: number }[]): Promise<ApiCartSyncResponse> {
  return getApi().post<ApiCartSyncResponse>('/cart/sync', { items }, true);
}

export async function cancelOrder(id: number | string, reason: string): Promise<ApiOrder> {
  const res = await getApi().post<{ data: ApiOrder }>(`/orders/${id}/cancel`, { reason }, true);
  return res.data;
}

export async function confirmDelivery(id: number | string): Promise<ApiOrder> {
  const res = await getApi().post<{ data: ApiOrder }>(`/orders/${id}/confirm`, {}, true);
  return res.data;
}

export async function reviewOrder(id: number | string, rating: number, comment?: string): Promise<ApiOrder> {
  const res = await getApi().post<{ data: ApiOrder }>(`/orders/${id}/review`, { rating, comment }, true);
  return res.data;
}

// ---- Rider ----

export async function toggleAvailability(): Promise<{ message: string }> {
  return getApi().post<{ message: string }>('/rider/toggle-availability', {}, true);
}

export async function fetchAvailableOrders(): Promise<ApiOrder[]> {
  const res = await getApi().get<{ data: ApiOrder[] }>('/rider/available-orders', undefined, true);
  return res.data;
}

export async function claimOrder(id: number | string): Promise<ApiOrder> {
  const res = await getApi().post<{ data: ApiOrder }>(`/rider/claim/${id}`, {}, true);
  return res.data;
}

export async function fetchActiveDeliveries(): Promise<ApiOrder[]> {
  const res = await getApi().get<{ data: ApiOrder[] }>('/rider/active-deliveries', undefined, true);
  return res.data;
}

export async function markItemsBought(id: number | string, itemIds: number[]): Promise<ApiOrder> {
  const res = await getApi().post<{ data: ApiOrder }>(`/rider/items-bought/${id}`, { item_ids: itemIds }, true);
  return res.data;
}

export async function markOutForDelivery(id: number | string): Promise<ApiOrder> {
  const res = await getApi().post<{ data: ApiOrder }>(`/rider/out-for-delivery/${id}`, {}, true);
  return res.data;
}

export async function markDelivered(id: number | string): Promise<ApiOrder> {
  const res = await getApi().post<{ data: ApiOrder }>(`/rider/delivered/${id}`, {}, true);
  return res.data;
}

export async function fetchRiderStats(): Promise<{ total_deliveries: number; average_rating: number | null; xp: number; level: number }> {
  return getApi().get('/rider/stats', undefined, true);
}

export async function fetchRiderHistory(): Promise<ApiOrder[]> {
  const res = await getApi().get<{ data: ApiOrder[] }>('/rider/history', undefined, true);
  return res.data;
}