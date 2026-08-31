import { useStoreSelection } from '../storeSelection';

describe('storeSelection', () => {
  beforeEach(() => {
    useStoreSelection.getState().clear();
  });

  test('sets and retrieves a selection for a product', () => {
    useStoreSelection.getState().setSelection(101, 999, 3);
    expect(useStoreSelection.getState().getSelection(101)).toEqual({ storeProductId: 999, storeId: 3 });
  });

  test('clear removes all selections', () => {
    useStoreSelection.getState().setSelection(1, 10, 2);
    useStoreSelection.getState().clear();
    expect(useStoreSelection.getState().getSelection(1)).toBeUndefined();
  });

  test('independent selections per product', () => {
    useStoreSelection.getState().setSelection(1, 100, 1);
    useStoreSelection.getState().setSelection(2, 200, 2);
    expect(useStoreSelection.getState().getSelection(1)).toEqual({ storeProductId: 100, storeId: 1 });
    expect(useStoreSelection.getState().getSelection(2)).toEqual({ storeProductId: 200, storeId: 2 });
  });
});
