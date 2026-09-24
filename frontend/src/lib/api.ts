import type { Category, Product, Store, Order, Rider, Special, Recipe, CommunityPost, CareerListing, User, CartItem, Paginated, OrderPlacementResult, Banner, UserAddress, FulfilmentMethod } from '@/types'
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
  // Never hang forever: a wedged backend must surface as a retryable error,
  // not an infinite loading skeleton (the "section is invisible" class of
  // bug). Composes with any caller-supplied abort signal.
  const timeoutSignal = AbortSignal.timeout(20_000)
  let signal: AbortSignal | undefined
  if (init?.signal) {
    if (typeof AbortSignal.any === 'function') {
      signal = AbortSignal.any([init.signal, timeoutSignal])
    } else {
      const ac = new AbortController()
      init.signal.addEventListener('abort', () => ac.abort(init.signal!.reason), { once: true })
      timeoutSignal.addEventListener('abort', () => ac.abort(timeoutSignal.reason), { once: true })
      signal = ac.signal
    }
  } else {
    signal = timeoutSignal
  }
  let res: Response
  try {
    res = await fetch(url, { credentials: 'include', headers, ...init, signal })
  } catch (err) {
    if (err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
      throw new ApiError('The server took too long to respond — please try again.', 0, { reason: 'timeout' })
    }
    throw err
  }
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
  getRelatedProducts: (slug: string, limit = 8) => request<{ data: Product[] }>(`/products/${slug}/related?limit=${limit}`).then(r => r.data),
  getSpecials: () => request<{ data: Special[] }>('/specials'),
  getBanners: () => request<{ data: Banner[] }>('/banners'),
  getAdminBanners: () => request<{ data: Banner[] }>('/admin/banners'),
  /** `special_id` links the banner to a sale; the backend then normalises the slide CTAs to the sale page. */
  createBanner: (data: { name: string; slides: Banner['slides']; status?: string; store_id?: number; special_id?: number | null; start_date?: string; end_date?: string }) =>
    request<{ data: Banner }>('/admin/banners', { method: 'POST', body: JSON.stringify(data) }),
  updateBanner: (id: number, data: Partial<{ name: string; slides: Banner['slides']; status: string; store_id: number | null; special_id: number | null; start_date: string | null; end_date: string | null }>) =>
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
  verifyEmail: (id: string, hash: string, sig?: { expires: string; signature: string }) =>
    request<{ message: string }>(
      `/auth/verify-email/${id}/${hash}${sig ? `?expires=${encodeURIComponent(sig.expires)}&signature=${encodeURIComponent(sig.signature)}` : ''}`,
    ),
  // Customer
  getOrders: (params?: Record<string, string>) => request<{ data: Order[] }>(`/orders${params ? `?${new URLSearchParams(params)}` : ''}`),
  getOrder: (id: number) => request<{ data: Order }>(`/orders/${id}`).then(r => r.data),
  placeOrder: (data: { items: { product_id: number; quantity: number }[]; fulfilment_method?: FulfilmentMethod; store_id?: number; delivery_address?: string; delivery_latitude?: number; delivery_longitude?: number; delivery_notes?: string; payment_method?: string }) => request<OrderPlacementResult>('/orders', { method: 'POST', body: JSON.stringify(data) }),

  // Saved delivery addresses (address book)
  getAddresses: () => request<{ data: UserAddress[] }>('/addresses'),
  createAddress: (data: { label: string; address: string; latitude: number; longitude: number; contact_name?: string; contact_phone?: string; is_default?: boolean }) => request<{ data: UserAddress }>('/addresses', { method: 'POST', body: JSON.stringify(data) }),
  updateAddress: (id: number, data: { label?: string; address?: string; latitude?: number; longitude?: number; contact_name?: string | null; contact_phone?: string | null; is_default?: boolean }) => request<{ data: UserAddress }>(`/addresses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAddress: (id: number) => request<{ message: string }>(`/addresses/${id}`, { method: 'DELETE' }),
  cancelOrder: (id: number) => request<{ data: Order }>(`/orders/${id}/cancel`, { method: 'POST' }).then(r => r.data),
  confirmDelivery: (id: number) => request<{ data: Order }>(`/orders/${id}/confirm`, { method: 'POST' }).then(r => r.data),
  reviewRider: (id: number, data: { rating: number; comment?: string }) => request<{ success: boolean; message: string; order?: Order }>(`/orders/${id}/review`, { method: 'POST', body: JSON.stringify(data) }),
  getCart: () => request<{ data: CartItem[] }>('/cart').then(r => r.data),
  syncCart: (items: { product_id: number; quantity: number }[]) => request<{ data: CartItem[]; dropped: { product_id: number; reason: string }[] }>('/cart/sync', { method: 'POST', body: JSON.stringify({ items }) }),
  updateProfile: (data: Partial<User>) => request<User>('/profile', { method: 'PUT', body: JSON.stringify(data) }),
  // Store management (Manager / Logistics / Owner / Developer)
  getStoreOrders: (storeId?: number, params?: Record<string, string>) => {
    const qs = new URLSearchParams()
    if (storeId) qs.set('store_id', String(storeId))
    if (params) Object.entries(params).forEach(([k, v]) => qs.set(k, v))
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return request<{ data: { data: Order[]; current_page: number; last_page: number; total: number } | Order[] }>(`/store/orders${suffix}`)
  },
  updateStoreOrderStatus: (orderId: number, status: string, storeId?: number) =>
    request<{ data: Order }>(`/store/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status, ...(storeId ? { store_id: storeId } : {}) }) }),
  getStoreInventory: (storeId?: number) =>
    request<{ data: Array<{ id: number; store_id: number; product_id: number; stock_quantity: number; reserved_quantity: number; is_available: boolean; product?: Product }> }>(
      `/store/inventory${storeId ? `?store_id=${storeId}` : ''}`
    ),
  updateStoreInventory: (productId: number, data: { stock_quantity?: number; is_available?: boolean }, storeId?: number) =>
    request<{ data: { id: number; store_id: number; product_id: number; stock_quantity: number; is_available: boolean; product?: Product } }>(
      `/store/inventory/${productId}`,
      { method: 'PATCH', body: JSON.stringify({ ...data, ...(storeId ? { store_id: storeId } : {}) }) }
    ),
  // Store dispatch (Logistics Officer / Store Owner)
  getPendingDispatch: (storeId?: number) => request<{ data: Order[] }>(`/store/dispatch/pending${storeId ? `?store_id=${storeId}` : ''}`),
  getDispatchRiders: (storeId?: number) => request<{ data: Array<{ id: number; user_id: number; store_id: number | null; is_available: boolean; vehicle_type: string | null; max_radius_km: number; user?: { id: number; name: string; email: string } }> }>(`/store/dispatch/riders${storeId ? `?store_id=${storeId}` : ''}`),
  dispatchOrder: (orderId: number, riderId: number, storeId?: number) => request<{ data: Order }>(`/store/orders/${orderId}/dispatch`, { method: 'POST', body: JSON.stringify({ rider_id: riderId, ...(storeId ? { store_id: storeId } : {}) }) }),
  reassignOrder: (orderId: number, riderId: number, storeId?: number) => request<{ data: Order }>(`/store/orders/${orderId}/reassign`, { method: 'POST', body: JSON.stringify({ rider_id: riderId, ...(storeId ? { store_id: storeId } : {}) }) }),
  // Staff management
  listStaff: (storeId?: number) => request<{ data: Array<{ id: number; user: { id: number; name: string; email: string }; role: string; store_id: number; created_at: string }> }>(`/store/staff${storeId ? `?store_id=${storeId}` : ''}`),
  hireStaff: (emailOrUserId: string | number, role: string, storeId?: number) => {
    const payload: Record<string, unknown> = { role, ...(storeId ? { store_id: storeId } : {}) }
    if (typeof emailOrUserId === 'number') payload.user_id = emailOrUserId
    else if (/^\d+$/.test(String(emailOrUserId))) payload.user_id = Number(emailOrUserId)
    else payload.email = emailOrUserId
    return request<{ data: unknown }>(`/store/staff`, { method: 'POST', body: JSON.stringify(payload) })
  },
  fireStaff: (staffId: number, storeId?: number) => request<{ message: string }>(`/store/staff/${staffId}${storeId ? `?store_id=${storeId}` : ''}`, { method: 'DELETE' }),
  // Admin messages
  getMessages: () => request<{ data: unknown[] }>('/admin/messages'),
  getMessage: (id: number) => request<{ data: unknown }>(`/admin/messages/${id}`),
  replyToMessage: (id: number, body: string) => request<{ data: unknown }>(`/admin/messages/${id}/reply`, { method: 'POST', body: JSON.stringify({ body }) }),
  markMessageRead: (id: number, read?: boolean) => request<{ data: unknown }>(`/admin/messages/${id}/read`, { method: 'PATCH', ...(read !== undefined ? { body: JSON.stringify({ read }) } : {}) }),
  // Rider
  getAvailableOrders: () => request<{ data: Order[] }>('/rider/available-orders'),
  // Backend wraps rider mutations in {data} — keep the envelope in the type.
  claimOrder: (id: number) => request<{ data: Order }>(`/rider/claim/${id}`, { method: 'POST' }),
  // item_ids is min:1 on the backend — callers must pass the batch explicitly.
  markItemsBought: (id: number, itemIds: number[]) => request<{ data: Order }>(`/rider/items-bought/${id}`, { method: 'POST', body: JSON.stringify({ item_ids: itemIds }) }),
  markOutForDelivery: (id: number) => request<{ data: Order }>(`/rider/out-for-delivery/${id}`, { method: 'POST' }),
  markDelivered: (id: number) => request<{ data: Order }>(`/rider/delivered/${id}`, { method: 'POST' }),
  toggleAvailability: () => request<{ data: Rider }>('/rider/toggle-availability', { method: 'POST' }),
  getRiderStats: () => request<{ data: { xp: number; level: number; total_deliveries: number; average_rating: number; badges: Array<{ id: number; badge_type: string; metadata: Record<string, unknown> | null; awarded_at: string }> } }>('/rider/stats'),
  getRiderHistory: () => request<{ data: Order[] }>('/rider/history'),
  getActiveDeliveries: () => request<{ data: Order[] }>('/rider/active-deliveries'),
  getRiderProfile: () => request<{ data: Rider }>('/rider/profile'),
  // Operations dashboard
  getOperationsMetrics: (storeId?: number) => request<{ active_riders: number; total_riders: number; orders_this_hour: number; pending_orders: number; active_deliveries: number; delivered_today: number }>(`/operations/metrics${storeId ? `?store_id=${storeId}` : ''}`),
  getOperationsAlerts: (storeId?: number) => request<{ alerts: Array<{ id: string; type: string; severity: string; message: string }> }>(`/operations/alerts${storeId ? `?store_id=${storeId}` : ''}`),
  getOperationsMapLayers: (storeId?: number) => request<MapLayerData>(`/operations/map-layers${storeId ? `?store_id=${storeId}` : ''}`),
  getOperationsEvents: (params?: Record<string, string>, storeId?: number) => {
    const qs = new URLSearchParams(params || {})
    if (storeId) qs.set('store_id', String(storeId))
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return request<{ events: unknown[]; next_cursor: string | null }>(`/operations/events${suffix}`)
  },
  getOperationsAuditLogs: (params?: Record<string, string>, storeId?: number) => {
    const qs = new URLSearchParams(params || {})
    if (storeId) qs.set('store_id', String(storeId))
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return request<{ audit_logs: unknown[] }>(`/operations/audit-logs${suffix}`)
  },
  getDispatchSuggestion: (orderId: number, storeId?: number) => request<unknown>(`/operations/dispatch-suggestion/${orderId}${storeId ? `?store_id=${storeId}` : ''}`),
  assignRider: (orderId: number, riderId: number, storeId?: number) => request<{ success: boolean; order: Order }>('/operations/assign-rider', { method: 'POST', body: JSON.stringify({ order_id: orderId, rider_id: riderId, ...(storeId ? { store_id: storeId } : {}) }) }),
  // Operations analytics
  getAnalyticsSales: (period?: string, storeId?: number) => {
    const qs = new URLSearchParams()
    if (period) qs.set('period', period)
    if (storeId) qs.set('store_id', String(storeId))
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return request<{
      total_revenue: number
      total_orders: number
      avg_order_value: number
      revenue_over_time: Array<{ date: string; revenue: number }>
      orders_by_hour: Array<{ hour: number; count: number }>
    }>(`/operations/analytics/sales${suffix}`)
  },
  getAnalyticsProducts: (limit?: number, storeId?: number) => {
    const qs = new URLSearchParams()
    if (limit) qs.set('limit', String(limit))
    if (storeId) qs.set('store_id', String(storeId))
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return request<{
      top_products: Array<{ id: number; name: string; order_count: number; total_quantity: number; total_revenue: number }>
      search_queries: Array<{ query: string; count: number }>
    }>(`/operations/analytics/products${suffix}`)
  },
  getAnalyticsRiders: (period?: string, storeId?: number) => {
    const qs = new URLSearchParams()
    if (period) qs.set('period', period)
    if (storeId) qs.set('store_id', String(storeId))
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return request<{
      rider_utilization: Array<{ rider_id: number; name: string; delivery_count: number; avg_delivery_time: number | null; total_distance: number; is_available: boolean }>
      fleet_summary: { active_riders: number; total_riders: number; avg_utilization_rate: number }
    }>(`/operations/analytics/riders${suffix}`)
  },
  // Contact
  submitContact: (data: { name: string; email: string; subject?: string; message: string }) => request<unknown>('/contact', { method: 'POST', body: JSON.stringify(data) }),
  // Admin health
  getAdminHealth: () => request<unknown>('/admin/health'),
  // ---- Admin CRUD (developer only) ----
  getAdminProducts: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : ''
    return request<Paginated<Product>>(`/admin/products${qs}`)
  },
  createAdminProduct: (data: Record<string, unknown>) => request<{ data: Product }>('/admin/products', { method: 'POST', body: JSON.stringify(data) }),
  updateAdminProduct: (id: number, data: Record<string, unknown>) => request<{ data: Product }>(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAdminProduct: (id: number) => request<{ message: string }>(`/admin/products/${id}`, { method: 'DELETE' }),

  getAdminCategories: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : ''
    return request<Paginated<Category> | { data: Category[] }>(`/admin/categories${qs}`)
  },
  createAdminCategory: (data: Record<string, unknown>) => request<{ data: Category }>('/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateAdminCategory: (id: number, data: Record<string, unknown>) => request<{ data: Category }>(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAdminCategory: (id: number) => request<{ message: string }>(`/admin/categories/${id}`, { method: 'DELETE' }),

  getAdminSpecials: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : ''
    return request<Paginated<Special> | { data: Special[] }>(`/admin/specials${qs}`)
  },
  getAdminSpecial: (id: number) => request<{ data: Special }>(`/admin/specials/${id}`),
  createAdminSpecial: (data: Record<string, unknown>) => request<{ data: Special }>('/admin/specials', { method: 'POST', body: JSON.stringify(data) }),
  updateAdminSpecial: (id: number, data: Record<string, unknown>) => request<{ data: Special }>(`/admin/specials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAdminSpecial: (id: number) => request<{ message: string }>(`/admin/specials/${id}`, { method: 'DELETE' }),
  /**
   * Idempotent full product sync for a sale. Products in the array are
   * attached (or re-priced); products missing are detached. `special_price`
   * is optional — omit it to keep the product's own price.
   */
  syncSaleProducts: (id: number, products: Array<{ product_id: number; special_price?: number | null }>) =>
    request<{ data: Special }>(`/admin/specials/${id}/products`, { method: 'PUT', body: JSON.stringify({ products }) }),

  /** Public sale landing: a single sale with its products, live or ended. */
  getSaleBySlug: (slug: string) => request<{ data: Special }>(`/specials/${encodeURIComponent(slug)}`),

  getAdminStores: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : ''
    return request<Paginated<Store> | { data: Store[] }>(`/admin/stores${qs}`)
  },
  createAdminStore: (data: Record<string, unknown>) => request<{ data: Store }>('/admin/stores', { method: 'POST', body: JSON.stringify(data) }),
  updateAdminStore: (id: number, data: Record<string, unknown>) => request<{ data: Store }>(`/admin/stores/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAdminStore: (id: number) => request<{ message: string }>(`/admin/stores/${id}`, { method: 'DELETE' }),

  getAdminUsers: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : ''
    return request<Paginated<User> | { data: User[] }>(`/admin/users${qs}`)
  },
  updateAdminUser: (id: number, data: Record<string, unknown>) => request<{ data: User }>(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAdminUser: (id: number) => request<{ message: string }>(`/admin/users/${id}`, { method: 'DELETE' }),

  getAdminRiders: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : ''
    return request<Paginated<Rider> | { data: Rider[] }>(`/admin/riders${qs}`)
  },
  updateAdminRider: (id: number, data: Record<string, unknown>) => request<{ data: Rider }>(`/admin/riders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getAdminRecipes: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : ''
    return request<Paginated<Recipe> | { data: Recipe[] }>(`/admin/recipes${qs}`)
  },
  createAdminRecipe: (data: Record<string, unknown>) => request<{ data: Recipe }>('/admin/recipes', { method: 'POST', body: JSON.stringify(data) }),
  updateAdminRecipe: (id: number, data: Record<string, unknown>) => request<{ data: Recipe }>(`/admin/recipes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAdminRecipe: (id: number) => request<{ message: string }>(`/admin/recipes/${id}`, { method: 'DELETE' }),

  getAdminCommunityPosts: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : ''
    return request<Paginated<CommunityPost> | { data: CommunityPost[] }>(`/admin/community-posts${qs}`)
  },
  createAdminCommunityPost: (data: Record<string, unknown>) => request<{ data: CommunityPost }>('/admin/community-posts', { method: 'POST', body: JSON.stringify(data) }),
  updateAdminCommunityPost: (id: number, data: Record<string, unknown>) => request<{ data: CommunityPost }>(`/admin/community-posts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAdminCommunityPost: (id: number) => request<{ message: string }>(`/admin/community-posts/${id}`, { method: 'DELETE' }),

  getAdminCareers: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : ''
    return request<Paginated<CareerListing> | { data: CareerListing[] }>(`/admin/careers${qs}`)
  },
  createAdminCareer: (data: Record<string, unknown>) => request<{ data: CareerListing }>('/admin/careers', { method: 'POST', body: JSON.stringify(data) }),
  updateAdminCareer: (id: number, data: Record<string, unknown>) => request<{ data: CareerListing }>(`/admin/careers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAdminCareer: (id: number) => request<{ message: string }>(`/admin/careers/${id}`, { method: 'DELETE' }),

  // Audit logs
  getAuditLogsForEntity: (entityType: string, entityId: number | string, params?: Record<string, string>, storeId?: number) => {
    const qs = new URLSearchParams(params || {})
    if (storeId) qs.set('store_id', String(storeId))
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return request<{ audit_logs: unknown[] }>(`/operations/audit-logs/${entityType}/${entityId}${suffix}`)
  },

  // Favorites (customer)
  getFavorites: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : ''
    return request<{ data: Product[] } | Paginated<Product>>(`/favorites${qs}`)
  },
  addFavorite: (productId: number) => request<{ data: unknown } | { message: string }>('/favorites', { method: 'POST', body: JSON.stringify({ product_id: productId }) }),
  removeFavorite: (productId: number) => request<{ message: string }>(`/favorites/${productId}`, { method: 'DELETE' }),
  checkFavorite: (productId: number) => request<{ isFavorited: boolean }>(`/favorites/${productId}/check`),

  // Rider location tracking for customer order
  getOrderRiderLocation: (orderId: number | string) => request<{ data: { latitude: number; longitude: number; recorded_at: string } | null }>(`/orders/${orderId}/rider-location`),

  // Routing
  getRoute: (fromLat: number, fromLng: number, toLat: number, toLng: number) => request<{ distance_km: number; duration_minutes: number; geometry: string | null; source: string }>(`/routing/route?from_lat=${fromLat}&from_lng=${fromLng}&to_lat=${toLat}&to_lng=${toLng}`),
  getRouteGeometry: (fromLat: number, fromLng: number, toLat: number, toLng: number) => request<{ geometry: string | null }>(`/routing/geometry?from_lat=${fromLat}&from_lng=${fromLng}&to_lat=${toLat}&to_lng=${toLng}`),

  // Recommendations
  getRecommendations: () => request<{ data: Product[] } | Product[]>('/recommendations'),
}
