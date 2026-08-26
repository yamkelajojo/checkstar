import { useQuery } from '@tanstack/react-query';
import { fetchCategories, fetchProducts, fetchStores, fetchSpecials, fetchProductBySlug } from '../../lib/apiClient';
import { mapProduct, type ProductVO } from '../../lib/product';
import { queryKeys } from '../../lib/queryKeys';
import type { ApiCategory, ApiProduct, ApiStore } from '../../lib/types';

export interface CatalogParams {
  category?: string;
  search?: string;
  storeId?: number | null;
  featured?: boolean;
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: fetchCategories,
  });
}

export function useProducts(params: CatalogParams & { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.products({ ...params, page: undefined }),
    queryFn: async (): Promise<ProductVO[]> => {
      const result = await fetchProducts({
        category: params.category,
        search: params.search,
        store_id: params.storeId ?? undefined,
        featured: params.featured ? true : undefined,
      });
      return result.data.map(mapProduct);
    },
    enabled: params.enabled ?? true,
  });
}

export function useSpecials(storeId?: number | null) {
  return useQuery({
    queryKey: queryKeys.specials({ storeId }),
    queryFn: async () => {
      const result = await fetchSpecials({ store_id: storeId ?? undefined });
      return result.data.map(mapProduct);
    },
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: queryKeys.product(slug),
    queryFn: async (): Promise<ProductVO> => mapProduct(await fetchProductBySlug(slug)),
  });
}

export function useStores() {
  return useQuery({
    queryKey: queryKeys.stores,
    queryFn: fetchStores,
  });
}