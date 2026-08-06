import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

export const queryKeys = {
  categories: ['categories'] as const,
  products: (params: Record<string, unknown>) => ['products', params] as const,
  product: (slug: string) => ['product', slug] as const,
  stores: ['stores'] as const,
  specials: (params: Record<string, unknown>) => ['specials', params] as const,
  cart: ['cart'] as const,
  orders: ['orders'] as const,
  order: (id: number | string) => ['order', id] as const,
  availableOrders: ['rider', 'available-orders'] as const,
  activeDeliveries: ['rider', 'active-deliveries'] as const,
  riderStats: ['rider', 'stats'] as const,
  riderHistory: ['rider', 'history'] as const,
};