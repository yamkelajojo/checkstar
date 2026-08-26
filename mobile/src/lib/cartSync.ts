import { applyServerMerge, type ServerMergeResult } from '../features/cart/model';
import type { CartItem } from '../features/cart/types';
import type { ApiCartSyncResponse } from './types';

export interface CartSyncDeps {
  syncCart: (items: { product_id: number; quantity: number }[]) => Promise<ApiCartSyncResponse>;
  getLocalCart: () => CartItem[];
  setCart: (items: CartItem[], response: ApiCartSyncResponse) => ServerMergeResult;
}

/**
 * One-shot cart merge after authentication.
 * Draft + server quantities summed server-side; local draft replaced by
 * server result via applyServerMerge. Guards against double-sync and empty draft.
 */
export async function performCartSync(
  hasSyncedRef: { current: boolean },
  deps: CartSyncDeps,
): Promise<{ droppedCount: number } | null> {
  if (hasSyncedRef.current) return null;
  const local = deps.getLocalCart();
  if (local.length === 0) {
    hasSyncedRef.current = true;
    return null;
  }
  const payload = local.map((i) => ({ product_id: Number(i.productId), quantity: i.quantity }));
  const response = await deps.syncCart(payload);
  const result = deps.setCart(local, response);
  hasSyncedRef.current = true;
  return { droppedCount: result.droppedCount };
}

let globalHasSynced = false;

export function resetCartSyncForTests(): void {
  globalHasSynced = false;
}

export function getGlobalSyncRef(): { current: boolean } {
  return {
    get current() {
      return globalHasSynced;
    },
    set current(v: boolean) {
      globalHasSynced = v;
    },
  };
}
