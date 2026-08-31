import { create } from 'zustand';

interface StoreSelectionState {
  selections: Record<number, { storeProductId: number; storeId: number }>;
  setSelection: (productId: number, storeProductId: number, storeId: number) => void;
  getSelection: (productId: number) => { storeProductId: number; storeId: number } | undefined;
  clear: () => void;
}

export const useStoreSelection = create<StoreSelectionState>((set, get) => ({
  selections: {},
  setSelection: (productId, storeProductId, storeId) =>
    set((state) => ({
      selections: { ...state.selections, [productId]: { storeProductId, storeId } },
    })),
  getSelection: (productId) => get().selections[productId],
  clear: () => set({ selections: {} }),
}));
