import { create } from 'zustand';
import type { ApiStore } from '../lib/types';
import { storage, STORAGE_KEYS } from '../lib/storage';
import { fetchStores } from '../lib/apiClient';

type StoreResolution = 'none' | 'location' | 'pick' | 'declined';
type LocationStore = StoreResolution;

interface DeliveryStoreState {
  store: ApiStore | null;
  resolution: LocationStore;
  stores: ApiStore[];
  loadStores: () => Promise<void>;
  chooseStore: (store: ApiStore, from: Exclude<LocationStore, 'none'>) => Promise<void>;
}

export const useDeliveryStore = create<DeliveryStoreState>((set, get) => ({
  store: null,
  resolution: 'none',
  stores: [],

  async loadStores() {
    const stores = await fetchStores();
    set({ stores });
    const cached = await storage.get<ApiStore>(STORAGE_KEYS.deliveryStore);
    if (cached) {
      const current = get().store;
      // Validate cached store still exists in backend; clear stale selection
      const exists = stores.some((s) => s.id === cached.id);
      if (!exists) {
        await storage.remove(STORAGE_KEYS.deliveryStore);
        if (current?.id === cached.id) set({ store: null });
        return;
      }
      if (!current) set({ store: cached });
    }
  },

  async chooseStore(store, from) {
    await storage.set(STORAGE_KEYS.deliveryStore, store);
    set({ store, resolution: from });
  },
}));