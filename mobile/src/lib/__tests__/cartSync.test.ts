import { performCartSync } from '../cartSync';
import { applyServerMerge } from '../../features/cart/model';
import type { CartItem } from '../../features/cart/types';

const line = (productId: string, quantity: number): CartItem => ({ productId, quantity });

describe('performCartSync', () => {
  it('syncs local draft and replaces with server result', async () => {
    const local = [line('1', 2)];
    const response = { data: [{ product_id: 1, quantity: 5, store_product_id: 10 }], dropped: [] };
    const syncCart = jest.fn().mockResolvedValue(response);
    let stored: CartItem[] | null = null;
    const hasSynced = { current: false };
    const result = await performCartSync(hasSynced, {
      syncCart,
      getLocalCart: () => local,
      setCart: (draft, resp) => {
        const merged = applyServerMerge(draft, resp);
        stored = merged.items;
        return merged;
      },
    });
    expect(syncCart).toHaveBeenCalledWith([{ product_id: 1, quantity: 2 }]);
    expect(stored).toEqual([{ productId: '1', quantity: 5 }]);
    expect(result?.droppedCount).toBe(0);
    expect(hasSynced.current).toBe(true);
  });

  it('does not call sync when local cart is empty (marks synced)', async () => {
    const syncCart = jest.fn();
    const hasSynced = { current: false };
    const result = await performCartSync(hasSynced, {
      syncCart,
      getLocalCart: () => [],
      setCart: () => ({ items: [], droppedCount: 0 }),
    });
    expect(syncCart).not.toHaveBeenCalled();
    expect(result).toBeNull();
    expect(hasSynced.current).toBe(true);
  });

  it('syncs exactly once when called twice', async () => {
    const local = [line('1', 1)];
    const response = { data: [{ product_id: 1, quantity: 1, store_product_id: null }], dropped: [] };
    const syncCart = jest.fn().mockResolvedValue(response);
    const hasSynced = { current: false };
    const deps = { syncCart, getLocalCart: () => local, setCart: () => ({ items: [], droppedCount: 0 }) };
    await performCartSync(hasSynced, deps);
    await performCartSync(hasSynced, deps);
    expect(syncCart).toHaveBeenCalledTimes(1);
  });

  it('surfaces dropped count via applyServerMerge', async () => {
    const local = [line('1', 1), line('2', 1)];
    const response = { data: [{ product_id: 2, quantity: 1, store_product_id: null }], dropped: [{ product_id: 1, reason: 'unavailable' }] };
    const syncCart = jest.fn().mockResolvedValue(response);
    let stored: CartItem[] = [];
    const hasSynced = { current: false };
    const result = await performCartSync(hasSynced, {
      syncCart,
      getLocalCart: () => local,
      setCart: (draft, resp) => {
        const merged = applyServerMerge(draft, resp);
        stored = merged.items;
        return merged;
      },
    });
    expect(stored.map((i) => i.productId)).toEqual(['2']);
    expect(result?.droppedCount).toBe(1);
  });
});