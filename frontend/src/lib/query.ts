import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import type { Category, Product, Store, Order, Rider, Special, Recipe, CommunityPost, CareerListing, User, CartItem } from '@/types'

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

export function useSpecials() {
  return useQuery({
    queryKey: ['specials'],
    queryFn: () => api.getSpecials().then(r => r.data),
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

export function usePendingDispatch(storeId?: number) {
  return useQuery({
    queryKey: ['pending-dispatch', storeId],
    queryFn: () => api.getPendingDispatch(storeId).then(r => r.data),
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
    queryFn: () => api.getRiderProfile(),
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
    mutationFn: ({ orderId, action }: { orderId: number; action: string }) => {
      if (action === 'items_bought') return api.markItemsBought(orderId)
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
