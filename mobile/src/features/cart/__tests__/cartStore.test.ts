import { useCart } from '../store';

const lineOf = (productId: string) =>
  useCart.getState().items.find((i) => i.productId === productId);

beforeEach(() => {
  useCart.setState({ items: [] });
});

describe('add', () => {
  it('adds a new product with quantity 1 by default', () => {
    useCart.getState().add('101');
    expect(lineOf('101')?.quantity).toBe(1);
  });

  it('increments the existing line for repeat adds', () => {
    useCart.getState().add('101', 1, 55);
    useCart.getState().add('101', 1, 55);
    expect(lineOf('101')).toMatchObject({ quantity: 2, storeProductId: 55 });
  });

  it('caps quantity at 8 no matter how often it is added', () => {
    for (let i = 0; i < 12; i += 1) useCart.getState().add('7', 1);
    expect(lineOf('7')?.quantity).toBe(8);
  });

  it('keeps separate lines per product id', () => {
    useCart.getState().add('1', 1);
    useCart.getState().add('2', 1);
    expect(useCart.getState().items.map((i) => i.productId)).toEqual(['1', '2']);
  });
});

describe('decrement', () => {
  it('removes the line when the last unit is decremented', () => {
    useCart.getState().add('5', 1);
    useCart.getState().decrement('5');
    expect(useCart.getState().items).toEqual([]);
  });

  it('steps down without removing while quantity is above one', () => {
    useCart.getState().add('5', 3);
    useCart.getState().decrement('5');
    expect(lineOf('5')?.quantity).toBe(2);
  });
});

describe('remove', () => {
  it('drops the whole line regardless of quantity', () => {
    useCart.getState().add('9', 4);
    useCart.getState().remove('9');
    expect(useCart.getState().items).toEqual([]);
  });
});

describe('clear', () => {
  it('empties the cart', () => {
    useCart.getState().add('1', 2);
    useCart.getState().add('2', 1);
    useCart.getState().clear();
    expect(useCart.getState().items).toEqual([]);
  });
});

describe('syncFromServer', () => {
  it('adopts server quantities and store product ids on sign-in merge', () => {
    useCart.getState().add('1', 5);
    useCart.getState().syncFromServer([{ productId: '1', quantity: 2, storeProductId: 77 }]);
    expect(lineOf('1')).toMatchObject({ quantity: 2, storeProductId: 77 });
  });

  it('keeps local-only lines so nothing is lost', () => {
    useCart.getState().add('local-only', 1);
    useCart.getState().syncFromServer([{ productId: '1', quantity: 1, storeProductId: null }]);
    expect(useCart.getState().items.map((i) => i.productId).sort()).toEqual(['1', 'local-only']);
  });
});

describe('mergeLocalOntoServer', () => {
  it('replaces items wholesale when the server accepts local lines', () => {
    useCart.getState().add('old', 3);
    useCart.getState().mergeLocalOntoServer(
      [{ productId: 'old', quantity: 3, storeProductId: null }],
      { data: [{ product_id: 1, quantity: 1, store_product_id: null }], dropped: [] }
    );
    expect(useCart.getState().items).toEqual([
      { productId: '1', storeProductId: null, quantity: 1 },
    ]);
  });
});
