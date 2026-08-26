import { canSubmit, MIN_ORDER_CENTS } from '../model';

const valid = {
  itemCount: 1,
  subtotalCents: MIN_ORDER_CENTS,
  address: '1 Main Road, Durban',
  authenticated: true,
  storeSelected: true,
  submitting: false,
};

describe('canSubmit', () => {
  it('is true when every gate passes', () => {
    expect(canSubmit(valid)).toBe(true);
  });

  it('requires at least one item in the cart', () => {
    expect(canSubmit({ ...valid, itemCount: 0 })).toBe(false);
  });

  it('rejects a subtotal below the R50 minimum', () => {
    expect(canSubmit({ ...valid, subtotalCents: MIN_ORDER_CENTS - 1 })).toBe(false);
  });

  it('accepts a subtotal exactly at the R50 minimum', () => {
    expect(canSubmit({ ...valid, subtotalCents: MIN_ORDER_CENTS })).toBe(true);
  });

  it('rejects an address shorter than 8 characters', () => {
    expect(canSubmit({ ...valid, address: 'short' })).toBe(false);
  });

  it('trims whitespace around the address before measuring it', () => {
    expect(canSubmit({ ...valid, address: '  1 Main Road, Durban  ' })).toBe(true);
    expect(canSubmit({ ...valid, address: '  1 Main  ' })).toBe(false);
  });

  it('requires an authenticated session', () => {
    expect(canSubmit({ ...valid, authenticated: false })).toBe(false);
  });

  it('does not require a selected store (backend auto-dispatches)', () => {
    expect(canSubmit({ ...valid, storeSelected: false })).toBe(true);
  });

  it('is false while a submit is already in flight', () => {
    expect(canSubmit({ ...valid, submitting: true })).toBe(false);
  });
});
