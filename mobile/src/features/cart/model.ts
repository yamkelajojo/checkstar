import type { CartAddTarget, CartItem, ServerCartLine } from './types';

const cap = (n: number) => Math.min(Math.max(n, 0), 8);

export const cartRules = {
  addItem(items: CartItem[], target: CartAddTarget, quantity: number): CartItem[] {
    const existingIdx = items.findIndex((i) => i.productId === target.productId && i.storeProductId === target.storeProductId);
    if (existingIdx === -1) {
      return [...items, { productId: target.productId, storeProductId: target.storeProductId, quantity: cap(quantity) }];
    }
    return items.map((item, idx) =>
      idx === existingIdx ? { ...item, quantity: cap(item.quantity + quantity) } : item,
    );
  },

  removeItem(items: CartItem[], productId: string): CartItem[] {
    return items.filter((i) => i.productId !== productId);
  },

  decrementItem(items: CartItem[], productId: string): CartItem[] {
    const existing = items.find((i) => i.productId === productId);
    if (!existing) return items;
    if (existing.quantity <= 1) return cartRules.removeItem(items, productId);
    return items.map((i) => (i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i));
  },

  /**
   * Merges the local guest cart onto the authoritative server cart:
   * server wins for products on the server, local-only products are kept,
   * every quantity capped at 8.
   */
  mergeWithServer(local: CartItem[], server: ServerCartLine[]): CartItem[] {
    const merged: CartItem[] = server.map((s) => ({
      productId: s.productId,
      storeProductId: s.storeProductId,
      quantity: cap(s.quantity),
    }));
    const serverIds = new Set(server.map((s) => s.productId));
    for (const item of local) {
      if (!serverIds.has(item.productId)) {
        merged.push(item);
      }
    }
    return merged;
  },

  revalidateForStore(items: CartItem[], availableProductIds: string[]): { items: CartItem[]; removed: CartItem[] } {
    const available = new Set(availableProductIds);
    return {
      items: items.filter((i) => available.has(i.productId)),
      removed: items.filter((i) => !available.has(i.productId)),
    };
  },

  subtotalCents(items: CartItem[], unitPriceOf: (productId: string) => number): number {
    return items.reduce((sum, i) => sum + unitPriceOf(i.productId) * i.quantity, 0);
  },

  totalQuantity(items: CartItem[]): number {
    return items.reduce((sum, i) => sum + i.quantity, 0);
  },
};