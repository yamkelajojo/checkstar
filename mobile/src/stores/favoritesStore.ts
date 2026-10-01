import { create } from 'zustand';
import { addFavorite, removeFavorite, fetchFavorites } from '../lib/apiClient';
import { mapProduct, type ProductVO } from '../lib/product';
import { queryClient, queryKeys } from '../lib/queryKeys';
import { storage } from '../lib/storage';

const FAVORITES_STORAGE_KEY = 'checkstar.favorites.v1';

interface StoredFavorites {
  ids: number[];
  products: Record<number, ProductVO>;
}

interface FavoritesState {
  favorites: Set<number>;
  favoriteProducts: Record<number, ProductVO>;
  loaded: boolean;
  toggleFavorite: (productId: number, product?: ProductVO) => Promise<void>;
  loadFavorites: () => Promise<void>;
  syncFromProducts: (products: ProductVO[]) => void;
  clearFavorites: () => Promise<void>;
  isFavorite: (productId: number) => boolean;
}

async function persistFavorites(ids: Set<number>, products: Record<number, ProductVO>): Promise<void> {
  try {
    await storage.set<StoredFavorites>(FAVORITES_STORAGE_KEY, {
      ids: Array.from(ids),
      products,
    });
  } catch {
    // Non-fatal
  }
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: new Set(),
  favoriteProducts: {},
  loaded: false,

  async toggleFavorite(productId: number, product?: ProductVO) {
    const { favorites, favoriteProducts } = get();
    const isFav = favorites.has(productId);

    const next = new Set(favorites);
    const nextProducts = { ...favoriteProducts };
    if (isFav) {
      next.delete(productId);
      delete nextProducts[productId];
    } else {
      next.add(productId);
      if (product) {
        nextProducts[productId] = product;
      }
    }
    set({ favorites: next, favoriteProducts: nextProducts });
    await persistFavorites(next, nextProducts);

    try {
      if (isFav) {
        await removeFavorite(productId);
      } else {
        await addFavorite(productId);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites }).catch(() => {});
    } catch (err: any) {
      const status = err?.status ?? err?.statusCode;
      // 409 = already favorited on server — keep local favorited state
      if (!isFav && status === 409) {
        queryClient.invalidateQueries({ queryKey: queryKeys.favorites }).catch(() => {});
        return;
      }
      // 401 = guest user — keep local favorite in storage so guests can still save items
      if (status === 401) {
        return;
      }
      set({ favorites, favoriteProducts });
      await persistFavorites(favorites, favoriteProducts);
    }
  },

  async loadFavorites() {
    let cachedIds: number[] = [];
    let cachedProducts: Record<number, ProductVO> = {};
    try {
      const stored = await storage.get<StoredFavorites>(FAVORITES_STORAGE_KEY);
      if (stored) {
        cachedIds = Array.isArray(stored.ids) ? stored.ids : [];
        cachedProducts = stored.products ?? {};
      }
    } catch {}

    try {
      const response = await fetchFavorites();
      const items = (response as any)?.data ?? response ?? [];
      const ids = new Set<number>(cachedIds);
      const products: Record<number, ProductVO> = { ...cachedProducts };

      for (const item of Array.isArray(items) ? items : []) {
        const raw = item?.product ?? item;
        const pid = Number(item?.product_id ?? raw?.id);
        if (Number.isFinite(pid) && pid > 0) {
          ids.add(pid);
          if (raw && typeof raw === 'object' && raw.name) {
            try {
              products[pid] = Array.isArray(raw.stores) && typeof raw.effectivePriceCents === 'number'
                ? (raw as ProductVO)
                : mapProduct(raw);
            } catch {}
          }
        }
      }

      set({ favorites: ids, favoriteProducts: products, loaded: true });
      await persistFavorites(ids, products);
    } catch {
      set({
        favorites: new Set<number>(cachedIds),
        favoriteProducts: cachedProducts,
        loaded: true,
      });
    }
  },

  syncFromProducts(products: ProductVO[]) {
    const { favorites, favoriteProducts } = get();
    const nextIds = new Set(favorites);
    const nextProducts = { ...favoriteProducts };
    for (const p of products) {
      if (p && typeof p.id === 'number') {
        nextIds.add(p.id);
        nextProducts[p.id] = p;
      }
    }
    set({ favorites: nextIds, favoriteProducts: nextProducts, loaded: true });
    persistFavorites(nextIds, nextProducts);
  },

  async clearFavorites() {
    set({ favorites: new Set(), favoriteProducts: {}, loaded: false });
    try {
      await storage.remove(FAVORITES_STORAGE_KEY);
    } catch {}
  },

  isFavorite(productId: number) {
    return get().favorites.has(productId);
  },
}));
