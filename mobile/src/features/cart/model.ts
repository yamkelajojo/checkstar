import type { ApiCartSyncResponse } from '../../lib/types';
import type { CartAddTarget, CartItem } from './types';

const cap = (n: number) => Math.min(Math.max(n, 0), 8);

export interface ServerMergeResult {
  items: CartItem[];
  droppedCount: number;
}

/**
 * Replaces the local draft with the authoritative server response after a
 * cart sync. Server lines win for content and quantity (capped at 8); the
 * draft only decides ordering so the list does not jump, and the number of
 * dropped lines is surfaced for the toast.
 */
function toCartItem(line: ApiCartSyncResponse['data'][number]): CartItem {
  return { productId: String(line.product_id), quantity: cap(line.quantity), storeProductId: line.store_product_id != null ? String(line.store_product_id) : null };
}

export function applyServerMerge(draft: CartItem[], response: ApiCartSyncResponse): ServerMergeResult {
  const pending = new Map(response.data.map((line) => [String(line.product_id), line]));
  const items: CartItem[] = [];
  for (const item of draft) {
    const line = pending.get(item.productId);
    if (line == null) continue;
    items.push(toCartItem(line));
    pending.delete(item.productId);
  }
  for (const line of pending.values()) {
    items.push(toCartItem(line));
  }
  return { items, droppedCount: response.dropped.length };
}

function normalizeId(id: string | number | null | undefined): string | null {
  if (id == null) return null;
  return String(id);
}

function sameStoreId(a: string | number | null | undefined, b: string | number | null | undefined): boolean {
  return normalizeId(a) === normalizeId(b);
}

export const cartRules = {
  addItem(items: CartItem[], target: CartAddTarget, quantity: number): CartItem[] {
    const targetStoreId = normalizeId(target.storeProductId);
    // Match by productId, and if storeProductId is provided, also match by that (normalized)
    const existingIdx = items.findIndex((i) => {
      if (i.productId !== target.productId) return false;
      if (targetStoreId != null) return sameStoreId(i.storeProductId, targetStoreId);
      return true;
    });
    if (existingIdx === -1) {
      return [...items, { productId: target.productId, quantity: cap(quantity), storeProductId: targetStoreId }];
    }
    return items.map((item, idx) =>
      idx === existingIdx ? { ...item, quantity: cap(item.quantity + quantity) } : item,
    );
  },

  removeItem(items: CartItem[], productId: string, storeProductId?: string | number | null): CartItem[] {
    const targetStoreId = normalizeId(storeProductId);
    return items.filter((i) => {
      if (i.productId !== productId) return true;
      if (targetStoreId != null) return !sameStoreId(i.storeProductId, targetStoreId);
      return false;
    });
  },

  decrementItem(items: CartItem[], productId: string, storeProductId?: string | number | null): CartItem[] {
    const targetStoreId = normalizeId(storeProductId);
    const existing = items.find((i) => {
      if (i.productId !== productId) return false;
      if (targetStoreId != null) return sameStoreId(i.storeProductId, targetStoreId);
      return true;
    });
    if (!existing) return items;
    if (existing.quantity <= 1) return cartRules.removeItem(items, productId, targetStoreId);
    return items.map((i) =>
      i.productId === productId && (targetStoreId == null || sameStoreId(i.storeProductId, targetStoreId))
        ? { ...i, quantity: i.quantity - 1 }
        : i
    );
  },

  /**
   * Merges the local guest cart onto the authoritative server cart:
   * server wins for products on the server, local-only products are kept,
   * every quantity capped at 8.
   */
  mergeWithServer(local: CartItem[], server: CartItem[]): CartItem[] {
    const merged: CartItem[] = server.map((s) => ({
      productId: s.productId,
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