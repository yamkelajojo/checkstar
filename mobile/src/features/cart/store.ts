import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cartRules, applyServerMerge, type ServerMergeResult } from './model';
import type { CartItem } from './types';
import type { ApiCartSyncResponse } from '../../lib/types';

interface CartState {
  items: CartItem[];
  add: (productId: string, quantity?: number, storeProductId?: number | string | null) => void;
  decrement: (productId: string, storeProductId?: number | string | null) => void;
  remove: (productId: string, storeProductId?: number | string | null) => void;
  syncFromServer: (lines: CartItem[]) => void;
  mergeLocalOntoServer: (local: CartItem[], serverResponse: ApiCartSyncResponse) => ServerMergeResult;
  clear: () => void;
}

function normalizeStoreProductId(id: number | string | null | undefined): string | null {
  if (id == null) return null;
  return String(id);
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      add(productId, quantity = 1, storeProductId = null) {
        const normalized = normalizeStoreProductId(storeProductId as number | string | null);
        set((state) => ({
          items: cartRules.addItem(state.items, { productId, storeProductId: normalized }, quantity),
        }));
      },

  decrement(productId, storeProductId) {
    const normalized = normalizeStoreProductId(storeProductId as unknown as number | string | null);
    set((state) => ({ items: cartRules.decrementItem(state.items, productId, normalized) }));
  },

      remove(productId, storeProductId) {
        const normalized = normalizeStoreProductId(storeProductId as unknown as number | string | null);
        set((state) => ({ items: cartRules.removeItem(state.items, productId, normalized) }));
      },

      syncFromServer(lines) {
        set({ items: cartRules.mergeWithServer(get().items, lines) });
      },

      mergeLocalOntoServer(local, serverResponse) {
        const { items, droppedCount } = applyServerMerge(local, serverResponse);
        set({ items });
        return { items, droppedCount };
      },

      clear() {
        set({ items: [] });
      },
    }),
    {
      name: 'checkstar-cart',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);