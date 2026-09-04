import { getOrderTotal } from '../orderTotal';

describe('getOrderTotal', () => {
  it('returns total_cents when available', () => {
    expect(getOrderTotal({ total_cents: 12500 })).toBe(12500);
  });

  it('returns 0 when total_cents is null', () => {
    expect(getOrderTotal({ total_cents: null })).toBe(0);
  });

  it('converts string total to cents', () => {
    expect(getOrderTotal({ total: '125.50' })).toBe(12550);
  });

  it('converts numeric total to cents', () => {
    expect(getOrderTotal({ total: 125.5 })).toBe(12550);
  });

  it('prefers total_cents over total', () => {
    expect(getOrderTotal({ total_cents: 10000, total: '200.00' })).toBe(10000);
  });

  it('returns 0 when both are null/undefined', () => {
    expect(getOrderTotal({})).toBe(0);
    expect(getOrderTotal({ total: null, total_cents: null })).toBe(0);
  });

  it('rounds float total correctly', () => {
    expect(getOrderTotal({ total: '10.005' })).toBe(1001);
    expect(getOrderTotal({ total: '10.004' })).toBe(1000);
  });
});
