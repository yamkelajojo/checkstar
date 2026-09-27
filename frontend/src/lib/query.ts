import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import type { Category, Product, Store, Order, Rider, Special, Recipe, CommunityPost, CareerListing, User, CartItem, Banner, Paginated } from '@/types'

/**
 * Why this file has a single normalizePaginated helper:
 *  - GET /products, /store/inventory, /admin/* → Laravel paginator JSON {data, current_page, …}
 *  - GET /orders (no per_page) → {data: Order[], meta: …} wrapper for legacy mobile
 * Both shapes are live. One helper papers the split so a new endpoint guessed
 * wrong surfaces as a typed [] rather than a silent “empty list”.
 */
function normalizePaginated<T>(res: unknown): T[] {
  if (!res) return []
  if (Array.isArray(res)) return res as T[]
  const anyRes = res as Record<string, unknown>
  if (anyRes.data) {
    if (Array.isArray(anyRes.data)) return anyRes.data as T[]
    const inner = anyRes.data as Record<string, unknown>
    if (inner && Array.isArray(inner.data)) return inner.data as T[]
  }
  return []
}

/** Deterministic JSON for a Record<string,string> — key order does not matter to the cache. */
function stableKey(params?: Record<string, string>): string {
  if (!params || Object.keys(params).length === 0) return ''
  return JSON.stringify(Object.keys(params).sort().reduce((o, k) => ((o as Record<string,string>)[k] = params[k], o), {} as Record<string,string>))
}

export function useTrendingProducts() {
  return useQuery({
    queryKey: ['products', 'trending'],
    queryFn: () => api.getTrendingProducts(),
  })
}

export function usePopularProducts() {
  return useQuery({
    queryKey: ['products', 'popular'],
    queryFn: () => api.getPopularProducts(),
  })
}

export function useNewArrivals() {
  return useQuery({
    queryKey: ['products', 'new-arrivals'],
    queryFn: () => api.getNewArrivals(),
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories().then(r => r.data),
  })
}

export function useAllProducts(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['products', 'all', stableKey(params)],
    queryFn: () => api.getAllProducts(params),
  })
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.getProduct(slug),
    enabled: !!slug,
  })
}

export function useRelatedProducts(slug: string, limit = 8) {
  return useQuery({
    queryKey: ['related-products', slug],
    queryFn: () => api.getRelatedProducts(slug, limit),
    enabled: !!slug,
    staleTime: 60_000,
  })
}

export function useSpecials() {
  return useQuery({
    queryKey: ['specials'],
    queryFn: () => api.getSpecials().then(r => r.data),
  })
}

export function useBanners() {
  return useQuery({
    queryKey: ['banners'],
    queryFn: () => api.getBanners().then(r => r.data),
  })
}

export function useAdminBanners(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['admin-banners'],
    queryFn: () => api.getAdminBanners().then(r => r.data),
    enabled: options?.enabled,
  })
}

export function useCreateBanner() {
  const qc = useQueryClient()
  return useMutation({
    meta: { silent: true }, // BannersClient renders inline errors — avoid double-toast
    mutationFn: (data: Parameters<typeof api.createBanner>[0]) => api.createBanner(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-banners'] })
      qc.invalidateQueries({ queryKey: ['banners'] })
    },
  })
}

export function useUpdateBanner() {
  const qc = useQueryClient()
  return useMutation({
    meta: { silent: true }, // BannersClient renders inline errors — avoid double-toast
    mutationFn: ({ id, ...data }: { id: number } & Parameters<typeof api.updateBanner>[1]) => api.updateBanner(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-banners'] })
      qc.invalidateQueries({ queryKey: ['banners'] })
    },
  })
}

export function useDeleteBanner() {
  const qc = useQueryClient()
  return useMutation({
    meta: { silent: true }, // BannersClient renders inline errors — avoid double-toast
    mutationFn: (id: number) => api.deleteBanner(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-banners'] })
      qc.invalidateQueries({ queryKey: ['banners'] })
    },
  })
}

export function useStores() {
  return useQuery({
    queryKey: ['stores'],
    queryFn: () => api.getStores().then(r => r.data),
  })
}

export function useStore(slug: string) {
  return useQuery({
    queryKey: ['store', slug],
    queryFn: () => api.getStore(slug).then(r => r.data),
    enabled: !!slug,
  })
}

export function useRecipes() {
  return useQuery({
    queryKey: ['recipes'],
    queryFn: () => api.getRecipes().then(r => r.data),
  })
}

export function useRecipe(slug: string) {
  return useQuery({
    queryKey: ['recipe', slug],
    queryFn: () => api.getRecipe(slug),
    enabled: !!slug,
  })
}

export function useCommunityPosts(category?: string) {
  return useQuery({
    queryKey: ['community-posts', category],
    queryFn: () => api.getCommunityPosts(category).then(r => r.data),
  })
}

export function useCareers() {
  return useQuery({
    queryKey: ['careers'],
    queryFn: () => api.getCareers().then(r => r.data),
  })
}

export function useOrders(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['orders', stableKey(params)],
    queryFn: () => api.getOrders(params).then(r => r.data),
  })
}

export function useStoreOrders(storeId?: number, params?: Record<string, string>, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['store-orders', storeId, stableKey(params)],
    queryFn: async () => {
      const res = await api.getStoreOrders(storeId, params)
      const data = res.data
      // Backend returns {data: paginated} where paginated has {data: Order[]}
      if (Array.isArray(data)) return data as unknown as Order[]
      if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown }).data)) {
        return (data as { data: Order[] }).data
      }
      return [] as Order[]
    },
    enabled: options?.enabled,
  })
}

export function useStoreInventory(storeId?: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['store-inventory', storeId],
    queryFn: () => api.getStoreInventory(storeId).then(r => r.data),
    enabled: options?.enabled,
  })
}

export function usePendingDispatch(storeId?: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['pending-dispatch', storeId],
    queryFn: () => api.getPendingDispatch(storeId).then(r => r.data),
    enabled: options?.enabled,
  })
}

export function useDispatchRiders(storeId?: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['dispatch-riders', storeId],
    queryFn: () => api.getDispatchRiders(storeId).then(r => r.data),
    enabled: options?.enabled,
    staleTime: 30_000,
  })
}

export function useOrder(id: number | string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => api.getOrder(Number(id)),
    enabled: !!id,
  })
}

export function useRiderProfile() {
  return useQuery({
    queryKey: ['rider-profile'],
    queryFn: () => api.getRiderProfile().then(r => r.data),
  })
}

export function useAvailableOrders() {
  return useQuery({
    queryKey: ['available-orders'],
    queryFn: () => api.getAvailableOrders().then(r => r.data),
  })
}

export function useActiveDeliveries() {
  return useQuery({
    queryKey: ['active-deliveries'],
    queryFn: () => api.getActiveDeliveries().then(r => r.data),
  })
}

export function useRiderStats() {
  return useQuery({
    queryKey: ['rider-stats'],
    queryFn: () => api.getRiderStats().then(r => r.data),
  })
}

export function useRiderHistory() {
  return useQuery({
    queryKey: ['rider-history'],
    queryFn: () => api.getRiderHistory().then(r => r.data),
  })
}

export function usePlaceOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof api.placeOrder>[0]) => api.placeOrder(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useClaimOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orderId: number) => api.claimOrder(orderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['available-orders'] })
      qc.invalidateQueries({ queryKey: ['active-deliveries'] })
    },
  })
}

export function useAdvanceOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, action, itemIds }: { orderId: number; action: string; itemIds: number[] }) => {
      if (action === 'items_bought') return api.markItemsBought(orderId, itemIds)
      if (action === 'out_for_delivery') return api.markOutForDelivery(orderId)
      return api.markDelivered(orderId)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-deliveries'] })
      qc.invalidateQueries({ queryKey: ['rider-stats'] })
      qc.invalidateQueries({ queryKey: ['rider-history'] })
    },
  })
}

export function useOperationsMetrics(storeId?: number) {
  return useQuery({
    queryKey: ['operations-metrics', storeId],
    queryFn: () => api.getOperationsMetrics(storeId),
    refetchInterval: 30000,
  })
}

export function useOperationsAlerts(storeId?: number) {
  return useQuery({
    queryKey: ['operations-alerts', storeId],
    queryFn: () => api.getOperationsAlerts(storeId),
    refetchInterval: 60000,
  })
}

export function useOperationsEvents(params?: Record<string, string>, storeId?: number) {
  return useQuery({
    queryKey: ['operations-events', stableKey(params), storeId],
    queryFn: () => api.getOperationsEvents(params, storeId),
  })
}

export function useOperationsAuditLogs(params?: Record<string, string>, storeId?: number) {
  return useQuery({
    queryKey: ['operations-audit-logs', stableKey(params), storeId],
    queryFn: () => api.getOperationsAuditLogs(params, storeId),
  })
}

export function useAnalyticsSales(period?: string, storeId?: number) {
  return useQuery({
    queryKey: ['analytics-sales', period, storeId],
    queryFn: () => api.getAnalyticsSales(period, storeId),
  })
}

export function useAnalyticsProducts(limit?: number, storeId?: number) {
  return useQuery({
    queryKey: ['analytics-products', limit, storeId],
    queryFn: () => api.getAnalyticsProducts(limit, storeId),
  })
}

export function useAnalyticsRiders(period?: string, storeId?: number) {
  return useQuery({
    queryKey: ['analytics-riders', period, storeId],
    queryFn: () => api.getAnalyticsRiders(period, storeId),
  })
}

export function useDispatchSuggestion(orderId: number, storeId?: number) {
  return useQuery({
    queryKey: ['dispatch-suggestion', orderId, storeId],
    queryFn: () => api.getDispatchSuggestion(orderId, storeId),
    enabled: !!orderId,
  })
}

export function useAssignRider() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, riderId, storeId }: { orderId: number; riderId: number; storeId?: number }) =>
      api.assignRider(orderId, riderId, storeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['operations-metrics'] })
    },
  })
}

// ---- Admin CRUD hooks (developer) ----

export function useAdminProducts(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['admin-products', stableKey(params)],
    queryFn: async () => {
      const res = await api.getAdminProducts(params)
      return normalizePaginated<Product>(res as any)
    },
  })
}
export function useCreateAdminProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.createAdminProduct(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  })
}
export function useUpdateAdminProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Record<string, unknown>) => api.updateAdminProduct(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  })
}
export function useDeleteAdminProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.deleteAdminProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  })
}

export function useAdminCategories() {
  return useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const res = await api.getAdminCategories()
      return normalizePaginated<Category>(res as any)
    },
  })
}
export function useCreateAdminCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.createAdminCategory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] })
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}
export function useUpdateAdminCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Record<string, unknown>) => api.updateAdminCategory(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] })
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}
export function useDeleteAdminCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.deleteAdminCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] })
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useAdminSpecials(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['admin-specials'],
    queryFn: async () => {
      const res = await api.getAdminSpecials()
      return normalizePaginated<Special>(res as any)
    },
    enabled: options?.enabled,
  })
}

/** One sale in detail (products + pivot special_price + store + banner). */
export function useAdminSpecialDetail(id: number | null, enabled = true) {
  return useQuery({
    queryKey: ['admin-special', id],
    queryFn: () => api.getAdminSpecial(id!).then(r => r.data),
    enabled: enabled && id != null,
  })
}

/** Public sale landing page data (GET /specials/{slug}). */
export function useSaleDetail(slug: string | undefined) {
  return useQuery({
    queryKey: ['sale', slug],
    queryFn: () => api.getSaleBySlug(slug!).then(r => r.data),
    enabled: !!slug,
    staleTime: 30_000,
  })
}
export function useCreateAdminSpecial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.createAdminSpecial(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-specials'] }),
  })
}
export function useUpdateAdminSpecial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Record<string, unknown>) => api.updateAdminSpecial(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-specials'] }),
  })
}
export function useDeleteAdminSpecial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.deleteAdminSpecial(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-specials'] })
      qc.invalidateQueries({ queryKey: ['admin-special'] })
      qc.invalidateQueries({ queryKey: ['specials'] })
      qc.invalidateQueries({ queryKey: ['sale'] })
    },
  })
}

export function useSyncSaleProducts() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, products }: { id: number; products: Array<{ product_id: number; special_price?: number | null }> }) =>
      api.syncSaleProducts(id, products),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-specials'] })
      qc.invalidateQueries({ queryKey: ['admin-special'] })
      qc.invalidateQueries({ queryKey: ['specials'] })
      qc.invalidateQueries({ queryKey: ['sale'] })
    },
  })
}

export function useAdminStores() {
  return useQuery({
    queryKey: ['admin-stores'],
    queryFn: async () => {
      const res = await api.getAdminStores()
      return normalizePaginated<Store>(res as any)
    },
  })
}
export function useCreateAdminStore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.createAdminStore(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-stores'] })
      qc.invalidateQueries({ queryKey: ['stores'] })
    },
  })
}
export function useUpdateAdminStore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Record<string, unknown>) => api.updateAdminStore(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-stores'] })
      qc.invalidateQueries({ queryKey: ['stores'] })
    },
  })
}
export function useDeleteAdminStore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.deleteAdminStore(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-stores'] })
      qc.invalidateQueries({ queryKey: ['stores'] })
    },
  })
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await api.getAdminUsers()
      return normalizePaginated<User>(res as any)
    },
  })
}
export function useUpdateAdminUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Record<string, unknown>) => api.updateAdminUser(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })
}
export function useDeleteAdminUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.deleteAdminUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })
}

export function useAdminRiders(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['admin-riders'],
    queryFn: async () => {
      const res = await api.getAdminRiders()
      return normalizePaginated<Rider>(res as any)
    },
    // /api/admin/riders is developer-only; without the gate every non-developer
    // who lands on the page fires a request that can only 403.
    enabled: options?.enabled ?? true,
  })
}
export function useUpdateAdminRider() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Record<string, unknown>) => api.updateAdminRider(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-riders'] }),
  })
}

export function useAdminRecipes() {
  return useQuery({
    queryKey: ['admin-recipes'],
    queryFn: async () => {
      const res = await api.getAdminRecipes()
      return normalizePaginated<Recipe>(res as any)
    },
  })
}
export function useCreateAdminRecipe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.createAdminRecipe(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-recipes'] }),
  })
}
export function useUpdateAdminRecipe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Record<string, unknown>) => api.updateAdminRecipe(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-recipes'] }),
  })
}
export function useDeleteAdminRecipe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.deleteAdminRecipe(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-recipes'] }),
  })
}

export function useAdminCommunityPosts(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['admin-community-posts'],
    queryFn: async () => {
      const res = await api.getAdminCommunityPosts()
      return normalizePaginated<CommunityPost>(res as any)
    },
    enabled: options?.enabled,
  })
}
export function useCreateAdminCommunityPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.createAdminCommunityPost(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-community-posts'] }),
  })
}
export function useUpdateAdminCommunityPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Record<string, unknown>) => api.updateAdminCommunityPost(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-community-posts'] }),
  })
}
export function useDeleteAdminCommunityPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.deleteAdminCommunityPost(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-community-posts'] }),
  })
}

export function useAdminCareers(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['admin-careers'],
    queryFn: async () => {
      const res = await api.getAdminCareers()
      return normalizePaginated<CareerListing>(res as any)
    },
    enabled: options?.enabled,
  })
}
export function useCreateAdminCareer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.createAdminCareer(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-careers'] }),
  })
}
export function useUpdateAdminCareer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Record<string, unknown>) => api.updateAdminCareer(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-careers'] }),
  })
}
export function useDeleteAdminCareer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.deleteAdminCareer(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-careers'] }),
  })
}

export function useAdminHealth() {
  return useQuery({
    queryKey: ['admin-health'],
    queryFn: () => api.getAdminHealth(),
  })
}

export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const res = await api.getFavorites()
      return normalizePaginated<Product>(res as any)
    },
  })
}
export function useAddFavorite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (productId: number) => api.addFavorite(productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  })
}
export function useRemoveFavorite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (productId: number) => api.removeFavorite(productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  })
}

export function useRecommendations() {
  return useQuery({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const res = await api.getRecommendations()
      const anyRes = res as any
      if (Array.isArray(anyRes)) return anyRes as Product[]
      if (anyRes.data && Array.isArray(anyRes.data)) return anyRes.data as Product[]
      return [] as Product[]
    },
  })
}

export function useAuditLogsForEntity(entityType: string, entityId: number | string, enabled = true) {
  return useQuery({
    queryKey: ['audit-logs-entity', entityType, entityId],
    queryFn: () => api.getAuditLogsForEntity(entityType, entityId),
    enabled: enabled && !!entityType && !!entityId,
  })
}

export function useOrderRiderLocation(orderId: number | string, enabled = true) {
  return useQuery({
    queryKey: ['order-rider-location', orderId],
    queryFn: () => api.getOrderRiderLocation(orderId).then(r => r.data),
    enabled: enabled && !!orderId,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  })
}

export function useRoute(fromLat?: number, fromLng?: number, toLat?: number, toLng?: number, enabled = true) {
  return useQuery({
    queryKey: ['route', fromLat, fromLng, toLat, toLng],
    queryFn: () => api.getRoute(fromLat!, fromLng!, toLat!, toLng!),
    enabled: enabled && fromLat != null && fromLng != null && toLat != null && toLng != null,
    staleTime: 5 * 60 * 1000,
  })
}

export function useRouteGeometry(fromLat?: number, fromLng?: number, toLat?: number, toLng?: number, enabled = true) {
  return useQuery({
    queryKey: ['route-geometry', fromLat, fromLng, toLat, toLng],
    queryFn: () => api.getRouteGeometry(fromLat!, fromLng!, toLat!, toLng!).then(r => r.geometry),
    enabled: enabled && fromLat != null && fromLng != null && toLat != null && toLng != null,
    staleTime: 5 * 60 * 1000,
  })
}
