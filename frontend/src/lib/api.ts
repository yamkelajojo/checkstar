import type { Category, Product, Store, Order, Rider, Special, Recipe, CommunityPost, CareerListing, User, CartItem, Paginated, OrderPlacementResult, Banner } from '@/types'
import type { MapLayerData } from '@/components/operations/MapLayerToggles'

const BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

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

  if (init?.body && !(init.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  // Sanctum CSRF cookie endpoint lives at /sanctum/csrf-cookie, not /api/sanctum/csrf-cookie
  const isCsrf = path === '/sanctum/csrf-cookie'
  const url = isCsrf
    ? (BASE.endsWith('/api') ? BASE.replace(/\/api$/, '') : BASE) + path
    : `${BASE}${path}`
  const res = await fetch(url, { credentials: 'include', headers, ...init })
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
  getTrendingProducts: () => request<{ data: Product[] }>('/products/trending').then(r => r.data),
  getPopularProducts: () => request<{ data: Product[] }>('/products/popular').then(r => r.data),
  getNewArrivals: () => request<{ data: Product[] }>('/products/new-arrivals').then(r => r.data),
  getAllProducts: async (params?: Record<string, string>, signal?: AbortSignal): Promise<Product[]> => {
    const query: Record<string, string> = { per_page: '100', ...params }
    const all: Product[] = []
    let page = 1
    const maxPages = 20

    while (page <= maxPages) {
      const res = await request<Paginated<Product>>(`/products?${new URLSearchParams({ ...query, page: String(page) })}`, { signal })
      all.push(...res.data)
      if (res.data.length === 0) break
      if (res.last_page && page >= res.last_page) break
      page++
    }

    return all
  },
  getProduct: (slug: string) => request<{ data: Product }>(`/products/${slug}`).then(r => r.data),
  getSpecials: () => request<{ data: Special[] }>('/specials'),
  getBanners: () => request<{ data: Banner[] }>('/banners'),
  getAdminBanners: () => request<{ data: Banner[] }>('/admin/banners'),
  createBanner: (data: { name: string; slides: Banner['slides']; status?: string; store_id?: number; start_date?: string; end_date?: string }) =>
    request<{ data: Banner }>('/admin/banners', { method: 'POST', body: JSON.stringify(data) }),
  updateBanner: (id: number, data: Partial<{ name: string; slides: Banner['slides']; status: string; store_id: number | null; start_date: string | null; end_date: string | null }>) =>
    request<{ data: Banner }>(`/admin/banners/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBanner: (id: number) => request<{ message: string }>(`/admin/banners/${id}`, { method: 'DELETE' }),
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
  forgotPassword: (email: string) => request<{ message: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (data: { token: string; email: string; password: string; password_confirmation: string }) => request<{ message: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
  requestEmailVerification: () => request<{ message: string }>('/auth/email/verification-notification', { method: 'POST' }),
  verifyEmail: (id: string, hash: string) => request<{ message: string }>(`/auth/verify-email/${id}/${hash}`),
  // Customer
  getOrders: (params?: Record<string, string>) => request<{ data: Order[] }>(`/orders${params ? `?${new URLSearchParams(params)}` : ''}`),
  getOrder: (id: number) => request<{ data: Order }>(`/orders/${id}`).then(r => r.data),
  placeOrder: (data: { items: { product_id: number; quantity: number }[]; delivery_address?: string; delivery_latitude: number; delivery_longitude: number; delivery_notes?: string; payment_method?: string }) => request<OrderPlacementResult>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  cancelOrder: (id: number) => request<{ data: Order }>(`/orders/${id}/cancel`, { method: 'POST' }).then(r => r.data),
  confirmDelivery: (id: number) => request<{ data: Order }>(`/orders/${id}/confirm`, { method: 'POST' }).then(r => r.data),
  reviewRider: (id: number, data: { rating: number; comment?: string }) => request<{ success: boolean; message: string; order?: Order }>(`/orders/${id}/review`, { method: 'POST', body: JSON.stringify(data) }),
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
  getRiderStats: () => request<{ data: { xp: number; level: number; total_deliveries: number; average_rating: number; badges: Array<{ id: number; badge_type: string; metadata: Record<string, unknown> | null; awarded_at: string }> } }>('/rider/stats'),
  getRiderHistory: () => request<{ data: Order[] }>('/rider/history'),
  getActiveDeliveries: () => request<{ data: Order[] }>('/rider/active-deliveries'),
  getRiderProfile: () => request<Rider>('/rider/profile'),
  // Operations dashboard
  getOperationsMetrics: () => request<{ active_riders: number; total_riders: number; orders_this_hour: number; pending_orders: number; active_deliveries: number; delivered_today: number }>('/operations/metrics'),
  getOperationsAlerts: () => request<{ alerts: Array<{ id: string; type: string; severity: string; message: string }> }>('/operations/alerts'),
  getOperationsMapLayers: () => request<MapLayerData>('/operations/map-layers'),
  getOperationsEvents: (params?: Record<string, string>) => request<{ events: unknown[]; next_cursor: string | null }>(`/operations/events${params ? `?${new URLSearchParams(params)}` : ''}`),
  getOperationsAuditLogs: (params?: Record<string, string>) => request<{ audit_logs: unknown[] }>(`/operations/audit-logs${params ? `?${new URLSearchParams(params)}` : ''}`),
  getDispatchSuggestion: (orderId: number) => request<unknown>(`/operations/dispatch-suggestion/${orderId}`),
  assignRider: (orderId: number, riderId: number, storeId?: number) => request<{ success: boolean; order: Order }>('/operations/assign-rider', { method: 'POST', body: JSON.stringify({ order_id: orderId, rider_id: riderId, ...(storeId ? { store_id: storeId } : {}) }) }),
  // Operations analytics
  getAnalyticsSales: (period?: string) => request<{
    total_revenue: number
    total_orders: number
    avg_order_value: number
    revenue_over_time: Array<{ date: string; revenue: number }>
    orders_by_hour: Array<{ hour: number; count: number }>
  }>(`/operations/analytics/sales${period ? `?period=${period}` : ''}`),
  getAnalyticsProducts: (limit?: number) => request<{
    top_products: Array<{ id: number; name: string; order_count: number; total_quantity: number; total_revenue: number }>
    search_queries: Array<{ query: string; count: number }>
  }>(`/operations/analytics/products${limit ? `?limit=${limit}` : ''}`),
  getAnalyticsRiders: (period?: string) => request<{
    rider_utilization: Array<{ rider_id: number; name: string; delivery_count: number; avg_delivery_time: number | null; total_distance: number; is_available: boolean }>
    fleet_summary: { active_riders: number; total_riders: number; avg_utilization_rate: number }
  }>(`/operations/analytics/riders${period ? `?period=${period}` : ''}`),
  // Contact
  submitContact: (data: { name: string; email: string; subject?: string; message: string }) => request<unknown>('/contact', { method: 'POST', body: JSON.stringify(data) }),
  // Admin health
  getAdminHealth: () => request<unknown>('/admin/health'),
}
