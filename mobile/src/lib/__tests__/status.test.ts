import { ORDER_STATUS_LABEL, CUSTOMER_STATUS_LABEL } from '../status';

/**
 * Status vocabulary — the SAME words the web client uses
 * (frontend/src/lib/labels.ts + its test table). One ecosystem, one vocabulary:
 * a shopper must read the same sentence about their order in the app and on the
 * site, and a rider must read the same word on both dispatch surfaces.
 */
describe('order status vocabulary (shared with the web client)', () => {
  it('uses the neutral register on staff surfaces', () => {
    expect(ORDER_STATUS_LABEL).toEqual({
      pending: 'Pending',
      confirmed: 'Confirmed',
      preparing: 'Preparing',
      retrying: 'Retrying',
      ready: 'Ready for pickup',
      out_for_delivery: 'Out for delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    });
  });

  it('uses the warm register for customers', () => {
    expect(CUSTOMER_STATUS_LABEL).toEqual({
      pending: 'Order received',
      confirmed: 'Confirmed',
      preparing: 'Being packed',
      retrying: 'Finding a rider',
      ready: 'Ready for pickup',
      out_for_delivery: 'Out for delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    });
  });

  it('never title-cases small words ("Out for delivery", not "Out For Delivery")', () => {
    const small = ['for', 'of', 'to', 'a', 'the', 'and'];
    [...Object.values(ORDER_STATUS_LABEL), ...Object.values(CUSTOMER_STATUS_LABEL)].forEach((label) => {
      label.split(' ').slice(1).forEach((word) => {
        if (small.includes(word.toLowerCase())) {
          expect(word).toBe(word.toLowerCase());
        }
      });
    });
  });

  it('covers every status the order model can be in', () => {
    // src/features/orders/model.ts is the source of truth for the lifecycle.
    const lifecycle = ['pending', 'confirmed', 'retrying', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
    lifecycle.forEach((status) => {
      expect(ORDER_STATUS_LABEL[status]).toBeTruthy();
      expect(CUSTOMER_STATUS_LABEL[status]).toBeTruthy();
    });
  });
});
