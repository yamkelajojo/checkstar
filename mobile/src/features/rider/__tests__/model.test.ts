import { toggleBoughtId, allItemsSelected, allItemIds } from '../model';

describe('toggleBoughtId', () => {
  it('adds an id that is not yet selected', () => {
    expect(toggleBoughtId([1], 2)).toEqual([1, 2]);
  });

  it('removes an id that is already selected', () => {
    expect(toggleBoughtId([1, 2], 2)).toEqual([1]);
  });

  it('starts an empty selection', () => {
    expect(toggleBoughtId([], 7)).toEqual([7]);
  });
});

describe('allItemsSelected', () => {
  it('is true once every line has been selected', () => {
    expect(allItemsSelected([1, 2, 3], 3)).toBe(true);
  });

  it('is false while some lines are still unselected', () => {
    expect(allItemsSelected([1, 2], 3)).toBe(false);
  });

  it('is true for an empty order', () => {
    expect(allItemsSelected([], 0)).toBe(true);
  });

  it('is based on the number of selected ids, not which ids they are', () => {
    expect(allItemsSelected([1, 2, 9], 3)).toBe(true);
  });
});

describe('allItemIds', () => {
  it('returns every line id in order', () => {
    expect(allItemIds([{ id: 4 }, { id: 8 }, { id: 15 }])).toEqual([4, 8, 15]);
  });
});
