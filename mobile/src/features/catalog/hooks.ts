import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { fetchCategories, fetchProducts, fetchAllProducts, fetchStores, fetchSpecials, fetchProductBySlug, fetchRelatedProducts } from '../../lib/apiClient';
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

/** Infinite query for paginated product lists (browse screen, search results) */
export function useInfiniteProducts(params: CatalogParams & { enabled?: boolean }) {
  return useInfiniteQuery({
    queryKey: queryKeys.products({ ...params, infinite: true }),
    queryFn: async ({ pageParam = 1 }): Promise<{ products: ProductVO[]; nextPage: number | undefined }> => {
      const result = await fetchProducts({
        category: params.category,
        search: params.search,
        store_id: params.storeId ?? undefined,
        featured: params.featured ? true : undefined,
        page: pageParam,
        per_page: 20,
      });
      return {
        products: result.data.map(mapProduct),
        nextPage: pageParam < result.last_page ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    enabled: params.enabled ?? true,
  });
}

/** Fetch ALL products across all pages (for cart, where we need to match all cart items) */
export function useAllProducts(params: Omit<CatalogParams, 'featured'> & { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.products({ ...params, all: true }),
    queryFn: async (): Promise<ProductVO[]> => {
      const result = await fetchAllProducts({
        category: params.category,
        search: params.search,
        store_id: params.storeId ?? undefined,
      });
      return result.map(mapProduct);
    },
    enabled: params.enabled ?? true,
  });
}

export function useSpecials(storeId?: number | null) {
  return useQuery({
    queryKey: queryKeys.specials({ storeId }),
    queryFn: async () => {
      const result = await fetchSpecials({ store_id: storeId ?? undefined });
      // A special is a bundle (title + banner + products). The "Best Deals"
      // carousel renders product cards, so flatten the attached products
      // (deduped) — mapping the special objects themselves produced blank,
      // unpriceable cards.
      type SpecialWithProducts = { products?: ApiProduct[] };
      const seen = new Set<number>();
      const products: ApiProduct[] = [];
      for (const special of result.data as unknown as SpecialWithProducts[]) {
        for (const product of special.products ?? []) {
          if (!seen.has(product.id)) {
            seen.add(product.id);
            products.push(product);
          }
        }
      }
      return products.map(mapProduct);
    },
  });
}

export function useRelatedProducts(slug: string) {
  return useQuery({
    queryKey: [...queryKeys.product(slug), 'related'],
    queryFn: async (): Promise<ProductVO[]> => {
      const related = await fetchRelatedProducts(slug);
      return related.map(mapProduct);
    },
    enabled: !!slug,
    staleTime: 60_000,
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