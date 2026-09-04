import { create } from 'zustand';
import type { ApiStore } from '../lib/types';
import { storage, STORAGE_KEYS } from '../lib/storage';
import { fetchStores } from '../lib/apiClient';

interface DeliveryStoreState {
  fulfillmentStore: ApiStore | null;
  stores: ApiStore[];
  loadStores: () => Promise<void>;
  setFulfillmentStore: (store: ApiStore | null) => Promise<void>;
}

export const useDeliveryStore = create<DeliveryStoreState>((set, get) => ({
  fulfillmentStore: null,
  stores: [],

  async loadStores() {
    const stores = await fetchStores();
    set({ stores });
    const cached = await storage.get<ApiStore>(STORAGE_KEYS.deliveryStore);
    if (cached) {
      const exists = stores.some((s) => s.id === cached.id);
      if (!exists) {
        await storage.remove(STORAGE_KEYS.deliveryStore);
        set({ fulfillmentStore: null });
      } else if (get().fulfillmentStore == null) {
        set({ fulfillmentStore: cached });
      }
    }
  },

  async setFulfillmentStore(store) {
    if (store) {
      await storage.set(STORAGE_KEYS.deliveryStore, store);
    } else {
      await storage.remove(STORAGE_KEYS.deliveryStore);
    }
    set({ fulfillmentStore: store });
  },
}));