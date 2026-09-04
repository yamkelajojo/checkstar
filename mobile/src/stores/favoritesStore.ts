import { create } from 'zustand';
import { addFavorite, removeFavorite, fetchFavorites } from '../lib/apiClient';

interface FavoritesState {
  favorites: Set<number>;
  loaded: boolean;
  toggleFavorite: (productId: number) => Promise<void>;
  loadFavorites: () => Promise<void>;
  isFavorite: (productId: number) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: new Set(),
  loaded: false,

  async toggleFavorite(productId: number) {
    const { favorites } = get();
    const isFav = favorites.has(productId);

    const next = new Set(favorites);
    if (isFav) {
      next.delete(productId);
    } else {
      next.add(productId);
    }
    set({ favorites: next });

    try {
      if (isFav) {
        await removeFavorite(productId);
      } else {
        await addFavorite(productId);
      }
    } catch {
      set({ favorites });
    }
  },

  async loadFavorites() {
    try {
      const response = await fetchFavorites();
      const items = response.data ?? response;
      const ids = new Set<number>((items ?? []).map((f: any) => f.product_id ?? f.id));
      set({ favorites: ids, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  isFavorite(productId: number) {
    return get().favorites.has(productId);
  },
}));
