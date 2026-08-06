import {
  effectivePriceCents,
  savingsPercent,
  normalizePricePerUnit,
} from '../pricing';

describe('effectivePriceCents', () => {
  it('falls back to the base price when there is no special', () => {
    expect(effectivePriceCents({ basePriceCents: 1000, salePriceCents: null, collectionSalePriceCents: null })).toBe(1000);
  });

  it('applies the product-level sale price when present', () => {
    expect(effectivePriceCents({ basePriceCents: 1000, salePriceCents: 700, collectionSalePriceCents: null })).toBe(700);
  });

  it('applies the collection special price when there is no product sale price', () => {
    expect(effectivePriceCents({ basePriceCents: 1000, salePriceCents: null, collectionSalePriceCents: 800 })).toBe(800);
  });

  it('gives the product-level sale price priority over a collection special', () => {
    expect(effectivePriceCents({ basePriceCents: 1000, salePriceCents: 700, collectionSalePriceCents: 800 })).toBe(700);
  });
});

describe('savingsPercent', () => {
  it('reports the percent discount off the base price', () => {
    expect(savingsPercent(1000, 700)).toBe(30);
  });

  it('reports zero when there is no saving', () => {
    expect(savingsPercent(1000, 1000)).toBe(0);
  });

  it('handles a discounted-to-zero case without dividing by zero', () => {
    expect(savingsPercent(0, 0)).toBe(0);
  });
});

describe('normalizePricePerUnit', () => {
  it('returns a per-base-unit price so different package sizes compare fairly', () => {
    expect(normalizePricePerUnit({ priceCents: 3400, unit: '2L' })).toBe(1700);
  });

  it('is identity for count-based units', () => {
    expect(normalizePricePerUnit({ priceCents: 1299, unit: 'each' })).toBe(1299);
  });
});
