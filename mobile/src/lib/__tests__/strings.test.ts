import { formatString } from '../strings';

describe('formatString', () => {
  it('interpolates named placeholders from a map', () => {
    expect(formatString('Order {orderId} is on its way', { orderId: '42' })).toBe('Order 42 is on its way');
  });

  it('throws when a referenced placeholder has no value, so broken copy fails loudly', () => {
    expect(() => formatString('Order {orderId} is on its way', {})).toThrow(/orderId/);
  });

  it('leaves plain text untouched', () => {
    expect(formatString('Your cart is empty')).toBe('Your cart is empty');
  });
});
