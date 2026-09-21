import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import type { Category, Product, Store, Order, Rider, Special, Recipe, CommunityPost, CareerListing, User, CartItem, Banner } from '@/types'

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
    queryKey: ['products', 'all', params],
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
    queryKey: ['orders', params],
    queryFn: () => api.getOrders(params).then(r => r.data),
  })
}

export function useStoreOrders(storeId?: number, params?: Record<string, string>, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['store-orders', storeId, params],
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
    queryKey: ['operations-events', params, storeId],
    queryFn: () => api.getOperationsEvents(params, storeId),
  })
}

export function useOperationsAuditLogs(params?: Record<string, string>, storeId?: number) {
  return useQuery({
    queryKey: ['operations-audit-logs', params, storeId],
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
