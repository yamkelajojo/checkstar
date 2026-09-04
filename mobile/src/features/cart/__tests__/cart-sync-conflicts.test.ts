import { cartRules, applyServerMerge } from '../model';
import { useCart } from '../store';
import type { CartItem } from '../types';
import type { ApiCartSyncResponse } from '../../../lib/types';

const line = (productId: string, quantity: number): CartItem => ({ productId, quantity });

const serverLine = (productId: number, quantity: number): ApiCartSyncResponse['data'][number] => ({
  product_id: productId,
  quantity,
  store_product_id: null,
});

const serverResponse = (
  data: ApiCartSyncResponse['data'],
  dropped: ApiCartSyncResponse['dropped'] = [],
): ApiCartSyncResponse => ({ data, dropped });

/** Expect a CartItem array by matching productId and quantity only (ignores storeProductId). */
const expectItems = (actual: CartItem[], expected: CartItem[]) => {
  expect(actual).toEqual(expected.map((e) => expect.objectContaining({ productId: e.productId, quantity: e.quantity })));
};

beforeEach(() => {
  useCart.setState({ items: [] });
});

describe('mergeWithServer — conflict resolution', () => {
  it('server wins when quantities differ on the same product', () => {
    const local = [line('1', 5)];
    const server = [line('1', 2)];
    const merged = cartRules.mergeWithServer(local, server);
    expectItems(merged, [line('1', 2)]);
  });

  it('preserves local-only items not present on server', () => {
    const local = [line('1', 3), line('local-only', 1)];
    const server = [line('1', 1)];
    const merged = cartRules.mergeWithServer(local, server);
    expect(merged.map((i) => i.productId)).toEqual(['1', 'local-only']);
    expect(merged.find((i) => i.productId === 'local-only')).toMatchObject({ productId: 'local-only', quantity: 1 });
  });

  it('adds server-only items not in local cart', () => {
    const local = [line('1', 1)];
    const server = [line('1', 1), line('server-only', 4)];
    const merged = cartRules.mergeWithServer(local, server);
    expect(merged.map((i) => i.productId)).toEqual(['1', 'server-only']);
  });

  it('caps server quantity at 8 even if server returns a higher value', () => {
    const local = [line('1', 1)];
    const server = [line('1', 12)];
    const merged = cartRules.mergeWithServer(local, server);
    expect(merged[0].quantity).toBe(8);
  });

  it('works with empty local cart — pulls everything from server', () => {
    const local: CartItem[] = [];
    const server = [line('10', 2), line('20', 1)];
    const merged = cartRules.mergeWithServer(local, server);
    expectItems(merged, [line('10', 2), line('20', 1)]);
  });

  it('works with empty server cart — keeps local cart as-is', () => {
    const local = [line('1', 3), line('2', 5)];
    const server: CartItem[] = [];
    const merged = cartRules.mergeWithServer(local, server);
    expectItems(merged, [line('1', 3), line('2', 5)]);
  });

  it('handles multiple products with mixed conflicts', () => {
    const local = [line('1', 6), line('2', 1), line('local-only', 3)];
    const server = [line('1', 2), line('3', 4)];
    const merged = cartRules.mergeWithServer(local, server);
    // server '1' wins (2), server '3' added, local-only '2' preserved
    expectItems(merged, [line('1', 2), line('3', 4), line('2', 1), line('local-only', 3)]);
  });

  it('is idempotent — merging the same server result twice produces the same cart', () => {
    const local = [line('1', 5), line('local', 2)];
    const server = [line('1', 3), line('3', 1)];
    const first = cartRules.mergeWithServer(local, server);
    const second = cartRules.mergeWithServer(first, server);
    expect(second).toEqual(first);
  });
});

describe('applyServerMerge — conflict resolution', () => {
  it('server wins for shared products', () => {
    const draft = [line('1', 7)];
    const response = serverResponse([serverLine(1, 3)]);
    const { items } = applyServerMerge(draft, response);
    expectItems(items, [line('1', 3)]);
  });

  it('drops local-only items not in server response', () => {
    const draft = [line('1', 2), line('local-only', 1)];
    const response = serverResponse([serverLine(1, 5)]);
    const { items } = applyServerMerge(draft, response);
    expect(items.map((i) => i.productId)).toEqual(['1']);
  });

  it('adds server-only items after draft items', () => {
    const draft = [line('1', 1)];
    const response = serverResponse([serverLine(1, 1), serverLine(99, 3)]);
    const { items } = applyServerMerge(draft, response);
    expect(items.map((i) => i.productId)).toEqual(['1', '99']);
    expect(items.find((i) => i.productId === '99')).toMatchObject({ productId: '99', quantity: 3 });
  });

  it('reports dropped count from server response', () => {
    const draft = [line('1', 1), line('2', 1), line('3', 1)];
    const response = serverResponse(
      [serverLine(1, 1)],
      [{ product_id: 2, reason: 'unavailable' }, { product_id: 3, reason: 'unavailable' }],
    );
    const { droppedCount } = applyServerMerge(draft, response);
    expect(droppedCount).toBe(2);
  });

  it('caps server quantities at 8', () => {
    const draft = [line('1', 1)];
    const response = serverResponse([serverLine(1, 15)]);
    const { items } = applyServerMerge(draft, response);
    expect(items[0].quantity).toBe(8);
  });

  it('works with empty draft — returns only server items', () => {
    const draft: CartItem[] = [];
    const response = serverResponse([serverLine(10, 2), serverLine(20, 1)]);
    const { items } = applyServerMerge(draft, response);
    expectItems(items, [line('10', 2), line('20', 1)]);
  });

  it('works with empty server response — returns empty cart', () => {
    const draft = [line('1', 3)];
    const response = serverResponse([]);
    const { items } = applyServerMerge(draft, response);
    expect(items).toEqual([]);
  });

  it('handles multiple products with mixed conflicts', () => {
    const draft = [line('1', 5), line('2', 1), line('3', 3)];
    const response = serverResponse(
      [serverLine(1, 2), serverLine(4, 6)],
      [{ product_id: 3, reason: 'unavailable' }],
    );
    const { items, droppedCount } = applyServerMerge(draft, response);
    // '1' server wins (2), '2' dropped (not in server), '3' dropped (unavailable),
    // '4' server-only added
    expectItems(items, [line('1', 2), line('4', 6)]);
    expect(droppedCount).toBe(1);
  });

  it('is idempotent — applying the same response twice produces the same result', () => {
    const draft = [line('1', 5)];
    const response = serverResponse([serverLine(1, 3)]);
    const first = applyServerMerge(draft, response);
    const second = applyServerMerge(first.items, response);
    expect(second).toEqual(first);
  });
});

describe('mergeWithServer + revalidateForStore — inactive product removal', () => {
  it('drops products not in the available set after merge', () => {
    const local = [line('1', 2), line('inactive', 1)];
    const server = [line('1', 3), line('inactive', 2)];
    const merged = cartRules.mergeWithServer(local, server);
    const { items, removed } = cartRules.revalidateForStore(merged, ['1']);
    expectItems(items, [line('1', 3)]);
    expect(removed.map((i) => i.productId)).toEqual(['inactive']);
  });

  it('full pipeline: merge then revalidate handles all conflict types', () => {
    const local = [line('1', 6), line('local-only', 1), line('to-drop', 2)];
    const server = [line('1', 2), line('server-only', 3), line('to-drop', 1)];
    const merged = cartRules.mergeWithServer(local, server);
    // server items: '1'→2, 'server-only'→3, 'to-drop'→1; local-only: 'local-only'→1, 'to-drop'→2
    // mergeWithServer puts server items first, so order is: 1, server-only, to-drop, local-only
    expect(merged.map((i) => i.productId)).toEqual(['1', 'server-only', 'to-drop', 'local-only']);

    const { items, removed } = cartRules.revalidateForStore(merged, ['1', 'server-only', 'local-only']);
    expectItems(items, [line('1', 2), line('server-only', 3), line('local-only', 1)]);
    expect(removed.map((i) => i.productId)).toEqual(['to-drop']);
  });
});

describe('store integration — mergeLocalOntoServer', () => {
  it('replaces local cart with server result via the store', () => {
    useCart.getState().add('old', 3);
    useCart.getState().mergeLocalOntoServer(
      [{ productId: 'old', quantity: 3 }],
      { data: [serverLine(1, 5)], dropped: [] },
    );
    expect(useCart.getState().items).toEqual([{ productId: '1', quantity: 5 }]);
  });

  it('returns droppedCount from response', () => {
    useCart.getState().add('1', 1);
    useCart.getState().add('2', 1);
    const result = useCart.getState().mergeLocalOntoServer(
      [{ productId: '1', quantity: 1 }, { productId: '2', quantity: 1 }],
      { data: [serverLine(1, 1)], dropped: [{ product_id: 2, reason: 'unavailable' }] },
    );
    expect(result.droppedCount).toBe(1);
    expect(useCart.getState().items).toEqual([{ productId: '1', quantity: 1 }]);
  });

  it('caps quantities at 8 via store', () => {
    useCart.getState().add('1', 1);
    useCart.getState().mergeLocalOntoServer(
      [{ productId: '1', quantity: 1 }],
      { data: [serverLine(1, 20)], dropped: [] },
    );
    expect(useCart.getState().items[0].quantity).toBe(8);
  });
});

describe('store integration — syncFromServer', () => {
  it('server wins and local-only preserved via store', () => {
    useCart.getState().add('1', 5);
    useCart.getState().add('local-only', 2);
    useCart.getState().syncFromServer([line('1', 1)]);
    expect(useCart.getState().items.map((i) => i.productId).sort()).toEqual(['1', 'local-only']);
    expect(useCart.getState().items.find((i) => i.productId === '1')?.quantity).toBe(1);
  });

  it('empty server keeps local cart', () => {
    useCart.getState().add('1', 3);
    useCart.getState().syncFromServer([]);
    expect(useCart.getState().items).toEqual([{ productId: '1', quantity: 3, storeProductId: null }]);
  });
});
