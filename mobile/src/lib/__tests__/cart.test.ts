import { cartRules, applyServerMerge } from '../../features/cart/model';
import type { CartItem } from '../../features/cart/types';

const id = { productId: 'p1', storeProductId: 5 as number | null };

const line = (productId: string, quantity: number, storeProductId: number | null = null): CartItem =>
  ({ productId, storeProductId, quantity });

describe('addItem', () => {
  it('adds a new item to an empty cart', () => {
    expect(cartRules.addItem([], id, 1)).toEqual([line('p1', 1, 5)]);
  });

  it('increments quantity when the same product is already present', () => {
    expect(cartRules.addItem([line('p1', 2, 5)], id, 1)).toEqual([line('p1', 3, 5)]);
  });

  it('caps quantity at 8', () => {
    expect(cartRules.addItem([line('p1', 7, 5)], id, 2)).toEqual([line('p1', 8, 5)]);
  });
});

describe('removeItem', () => {
  it('removes an item by product id', () => {
    const items = [line('p1', 1), line('p2', 1)];
    expect(cartRules.removeItem(items, 'p1')).toEqual([line('p2', 1)]);
  });
});

describe('decrementItem', () => {
  it('removes the line when quantity reaches zero', () => {
    expect(cartRules.decrementItem([line('p1', 1)], 'p1')).toEqual([]);
  });

  it('decrements without removing when quantity is above one', () => {
    expect(cartRules.decrementItem([line('p1', 3)], 'p1')).toEqual([line('p1', 2)]);
  });
});

describe('mergeWithServer', () => {
  it('keeps the server quantity for products present on the server', () => {
    const local = [line('p1', 5)];
    const server: CartItem[] = [{ productId: 'p1', quantity: 2, storeProductId: 7 }];
    const next = cartRules.mergeWithServer(local, server);
    expect(next.find((i) => i.productId === 'p1')?.quantity).toBe(2);
    expect(next.find((i) => i.productId === 'p1')?.storeProductId).toBe(7);
  });

  it('adds local-only items so nothing is lost on sign-in', () => {
    const local = [line('p1', 1), line('p2', 1)];
    const server: CartItem[] = [{ productId: 'p1', quantity: 1, storeProductId: null }];
    const next = cartRules.mergeWithServer(local, server);
    expect(next.map((i) => i.productId).sort()).toEqual(['p1', 'p2']);
  });

  it('caps quantities at 8', () => {
    const local = [line('p1', 8)];
    const server: CartItem[] = [{ productId: 'p2', quantity: 20, storeProductId: null }];
    const next = cartRules.mergeWithServer(local, server);
    expect(next.find((i) => i.productId === 'p2')?.quantity).toBe(8);
  });
});

describe('revalidateForStore', () => {
  it('flags and removes items not available at the new store', () => {
    const items = [line('p1', 1), line('p2', 1)];
    const { items: kept, removed } = cartRules.revalidateForStore(items, ['p1', 'p3']);
    expect(kept.map((i) => i.productId)).toEqual(['p1']);
    expect(removed.map((i) => i.productId)).toEqual(['p2']);
  });
});

describe('subtotalCents', () => {
  it('sums quantity × unit price', () => {
    const items = [line('p1', 2), line('p2', 1)];
    const priceOf = (productId: string) => (productId === 'p1' ? 100 : 250);
    expect(cartRules.subtotalCents(items, (productId) => priceOf(productId))).toBe(450);
  });
});

describe('totalQuantity', () => {
  it('sums quantities for the cart badge', () => {
    const items = [line('p1', 2), line('p2', 3)];
    expect(cartRules.totalQuantity(items)).toBe(5);
  });
});

describe('applyServerMerge', () => {
  const syncResponse = (
    data: { product_id: number; quantity: number; store_product_id: number | null }[],
    dropped: { product_id: number; reason: string }[] = [],
  ) => ({ data, dropped });

  it('replaces the draft with the server lines mapped into cart items', () => {
    const draft = [line('1', 3, null)];
    const result = applyServerMerge(draft, syncResponse([
      { product_id: 1, quantity: 4, store_product_id: 11 },
    ]));
    expect(result.items).toEqual([{ productId: '1', storeProductId: 11, quantity: 4 }]);
    expect(result.droppedCount).toBe(0);
  });

  it('keeps the draft ordering and appends server-only lines', () => {
    const draft = [line('2', 1), line('1', 1)];
    const result = applyServerMerge(draft, syncResponse([
      { product_id: 1, quantity: 1, store_product_id: null },
      { product_id: 2, quantity: 1, store_product_id: null },
      { product_id: 3, quantity: 2, store_product_id: null },
    ]));
    expect(result.items.map((i) => i.productId)).toEqual(['2', '1', '3']);
  });

  it('omits lines the server dropped and reports the count', () => {
    const draft = [line('1', 2), line('2', 1)];
    const result = applyServerMerge(draft, syncResponse(
      [{ product_id: 2, quantity: 1, store_product_id: null }],
      [{ product_id: 1, reason: 'unavailable' }],
    ));
    expect(result.items.map((i) => i.productId)).toEqual(['2']);
    expect(result.droppedCount).toBe(1);
  });

  it('caps synced quantities at 8', () => {
    const result = applyServerMerge([line('9', 20)], syncResponse([
      { product_id: 9, quantity: 12, store_product_id: null },
    ]));
    expect(result.items[0].quantity).toBe(8);
  });

  it('empties the cart when every line was dropped', () => {
    const result = applyServerMerge([line('1', 1)], syncResponse([], [
      { product_id: 1, reason: 'unavailable' },
    ]));
    expect(result.items).toEqual([]);
    expect(result.droppedCount).toBe(1);
  });
});