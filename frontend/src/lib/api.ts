import type { Category, Product, Store, Order, Rider, Special, Recipe, CommunityPost, CareerListing, User, CartItem, Paginated, OrderPlacementResult } from '@/types'

const BASE = '/api'

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function apiErrorReason(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null
  const reason = (error.payload as { reason?: unknown } | null)?.reason
  return typeof reason === 'string' ? reason : null
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method || 'GET').toUpperCase()
  const headers: Record<string, string> = { 'Accept': 'application/json', ...init?.headers as Record<string, string> }

  if (method !== 'GET') {
    const xsrfToken = getCookie('XSRF-TOKEN')
    if (xsrfToken) headers['X-XSRF-TOKEN'] = xsrfToken
  }

  if (!(init?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${BASE}${path}`, { credentials: 'include', headers, ...init })
  if (!res.ok) {
    const payload = await res.json().catch(() => ({ message: res.statusText }))
    const message = (payload as { message?: string } | null)?.message ?? `Request failed: ${res.status}`
    throw new ApiError(message, res.status, payload)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  // Public
  getCategories: () => request<{ data: Category[] }>('/categories'),
  getAllProducts: async (params?: Record<string, string>): Promise<Product[]> => {
    const query: Record<string, string> = { per_page: '100', ...params }
    const all: Product[] = []
    let page = 1

    while (true) {
      const res = await request<Paginated<Product>>(`/products?${new URLSearchParams({ ...query, page: String(page) })}`)
      all.push(...res.data)
      if (res.data.length === 0 || page >= res.last_page) break
      page++
      if (page > 100) break
    }

    return all
  },
  getProduct: (slug: string) => request<{ data: Product }>(`/products/${slug}`).then(r => r.data),
  getSpecials: () => request<{ data: Special[] }>('/specials'),
  getStores: () => request<{ data: Store[] }>('/stores'),
  getStore: (slug: string) => request<{ data: Store }>(`/stores/${slug}`),
  getRecipes: () => request<{ data: Recipe[] }>('/recipes'),
  getRecipe: (slug: string) => request<{ data: Recipe }>(`/recipes/${slug}`).then(r => r.data),
  getCommunityPosts: (category?: string) => request<{ data: CommunityPost[] }>(`/community-posts${category ? `?category=${category}` : ''}`),
  getCareers: () => request<{ data: CareerListing[] }>('/careers'),
  // Auth
  getCsrfCookie: () => request<void>('/sanctum/csrf-cookie'),
  register: (data: { name: string; email: string; password: string; password_confirmation: string; phone?: string }) => request<{ user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  registerRider: (data: { name: string; email: string; password: string; password_confirmation: string; phone?: string; vehicle_type?: string; banking_details?: Record<string, string> }) => request<{ user: User }>('/auth/register/rider', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string; remember?: boolean }) => request<{ user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
  getUser: () => request<{ user: User }>('/auth/user'),
  // Customer
  getOrders: (params?: Record<string, string>) => request<{ data: Order[] }>(`/orders${params ? `?${new URLSearchParams(params)}` : ''}`),
  getOrder: (id: number) => request<{ data: Order }>(`/orders/${id}`).then(r => r.data),
  placeOrder: (data: { items: { product_id: number; quantity: number }[]; delivery_address?: string; delivery_latitude: number; delivery_longitude: number; delivery_notes?: string; payment_method?: string }) => request<OrderPlacementResult>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  cancelOrder: (id: number) => request<{ data: Order }>(`/orders/${id}/cancel`, { method: 'POST' }).then(r => r.data),
  confirmDelivery: (id: number) => request<{ data: Order }>(`/orders/${id}/confirm`, { method: 'POST' }).then(r => r.data),
  reviewRider: (id: number, data: { rating: number; comment?: string }) => request<any>(`/orders/${id}/review`, { method: 'POST', body: JSON.stringify(data) }),
  getCart: () => request<{ data: CartItem[] }>('/cart').then(r => r.data),
  syncCart: (items: { product_id: number; quantity: number }[]) => request<{ data: CartItem[]; dropped: { product_id: number; reason: string }[] }>('/cart/sync', { method: 'POST', body: JSON.stringify({ items }) }),
  updateProfile: (data: Partial<User>) => request<User>('/profile', { method: 'PUT', body: JSON.stringify(data) }),
  // Store dispatch (Logistics Officer / Store Owner)
  getPendingDispatch: (storeId?: number) => request<{ data: Order[] }>(`/store/dispatch/pending${storeId ? `?store_id=${storeId}` : ''}`),
  dispatchOrder: (orderId: number, riderId: number, storeId?: number) => request<{ data: Order }>(`/store/orders/${orderId}/dispatch`, { method: 'POST', body: JSON.stringify({ rider_id: riderId, ...(storeId ? { store_id: storeId } : {}) }) }),
  reassignOrder: (orderId: number, riderId: number) => request<{ data: Order }>(`/store/orders/${orderId}/reassign`, { method: 'POST', body: JSON.stringify({ rider_id: riderId }) }),
  // Staff management
  hireStaff: (userId: number, role: string, storeId?: number) => request<{ data: unknown }>(`/store/staff`, { method: 'POST', body: JSON.stringify({ user_id: userId, role, ...(storeId ? { store_id: storeId } : {}) }) }),
  fireStaff: (staffId: number, storeId?: number) => request<{ message: string }>(`/store/staff/${staffId}${storeId ? `?store_id=${storeId}` : ''}`, { method: 'DELETE' }),
  // Admin messages
  getMessages: () => request<{ data: unknown[] }>('/admin/messages'),
  getMessage: (id: number) => request<{ data: unknown }>(`/admin/messages/${id}`),
  replyToMessage: (id: number, body: string) => request<{ data: unknown }>(`/admin/messages/${id}/reply`, { method: 'POST', body: JSON.stringify({ body }) }),
  // Rider
  getAvailableOrders: () => request<{ data: Order[] }>('/rider/available-orders'),
  claimOrder: (id: number) => request<Order>(`/rider/claim/${id}`, { method: 'POST' }),
  markItemsBought: (id: number) => request<Order>(`/rider/items-bought/${id}`, { method: 'POST' }),
  markOutForDelivery: (id: number) => request<Order>(`/rider/out-for-delivery/${id}`, { method: 'POST' }),
  markDelivered: (id: number) => request<Order>(`/rider/delivered/${id}`, { method: 'POST' }),
  toggleAvailability: () => request<Rider>('/rider/toggle-availability', { method: 'POST' }),
  getRiderStats: () => request<{ data: { xp: number; level: number; total_deliveries: number; average_rating: number; badges: any[] } }>('/rider/stats'),
  getRiderHistory: () => request<{ data: Order[] }>('/rider/history'),
  getActiveDeliveries: () => request<{ data: Order[] }>('/rider/active-deliveries'),
  getRiderProfile: () => request<Rider>('/rider/profile'),
}
