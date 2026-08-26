import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cartRules, applyServerMerge, type ServerMergeResult } from './model';
import type { CartItem } from './types';
import type { ApiCartSyncResponse } from '../../lib/types';

interface CartState {
  items: CartItem[];
  add: (productId: string, quantity?: number, storeProductId?: number | null) => void;
  decrement: (productId: string, storeProductId?: number | null) => void;
  remove: (productId: string, storeProductId?: number | null) => void;
  syncFromServer: (lines: CartItem[]) => void;
  mergeLocalOntoServer: (local: CartItem[], serverResponse: ApiCartSyncResponse) => ServerMergeResult;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      add(productId, quantity = 1, storeProductId = null) {
        set((state) => ({
          items: cartRules.addItem(state.items, { productId, storeProductId }, quantity),
        }));
      },

      decrement(productId, storeProductId = null) {
        set((state) => ({ items: cartRules.decrementItem(state.items, productId, storeProductId) }));
      },

      remove(productId, storeProductId = null) {
        set((state) => ({ items: cartRules.removeItem(state.items, productId, storeProductId) }));
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