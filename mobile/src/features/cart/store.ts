import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cartRules } from './model';
import type { ServerCartLine } from './types';

interface CartState {
  items: ServerCartLine[];
  add: (productId: string, quantity?: number, storeProductId?: number | null) => void;
  decrement: (productId: string) => void;
  remove: (productId: string) => void;
  syncFromServer: (lines: ServerCartLine[]) => void;
  mergeLocalOntoServer: (local: ServerCartLine[]) => void;
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

      decrement(productId) {
        set((state) => ({ items: cartRules.decrementItem(state.items, productId) }));
      },

      remove(productId) {
        set((state) => ({ items: cartRules.removeItem(state.items, productId) }));
      },

      syncFromServer(lines) {
        set({ items: cartRules.mergeWithServer(get().items, lines) });
      },

      mergeLocalOntoServer(local) {
        set({ items: local });
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