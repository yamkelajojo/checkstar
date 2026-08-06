import { STATUS_STEPS, statusStepIndex, isCancelled, canCancel, isAwaitingDeliveryConfirmation, canReview } from '../model';

describe('statusStepIndex', () => {
  it('maps each happy-path status to its timeline step', () => {
    expect(STATUS_STEPS).toEqual(['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered']);
    STATUS_STEPS.forEach((status, index) => {
      expect(statusStepIndex(status)).toBe(index);
    });
  });

  it('returns -1 for statuses outside the timeline (e.g. cancelled)', () => {
    expect(statusStepIndex('cancelled')).toBe(-1);
    expect(statusStepIndex('unknown')).toBe(-1);
  });
});

describe('isCancelled', () => {
  it('is true only for the cancelled status', () => {
    expect(isCancelled('cancelled')).toBe(true);
    expect(isCancelled('delivered')).toBe(false);
    expect(isCancelled('pending')).toBe(false);
  });
});

describe('canCancel', () => {
  it('allows cancelling pending, confirmed and preparing orders', () => {
    for (const status of ['pending', 'confirmed', 'preparing']) {
      expect(canCancel(status, 'pending')).toBe(true);
    }
  });

  it('blocks cancelling once the order is out for delivery or delivered', () => {
    expect(canCancel('out_for_delivery', 'pending')).toBe(false);
    expect(canCancel('delivered', 'pending')).toBe(false);
  });

  it('blocks cancelling a cancelled order', () => {
    expect(canCancel('cancelled', 'pending')).toBe(false);
  });

  it('blocks cancelling once payment has been captured', () => {
    expect(canCancel('confirmed', 'paid')).toBe(false);
    expect(canCancel('pending', 'paid')).toBe(false);
  });

  it('still allows cancelling before payment, even if the payment status is not pending', () => {
    expect(canCancel('confirmed', 'refunded')).toBe(true);
  });
});

describe('isAwaitingDeliveryConfirmation', () => {
  it('is true only when the order is out for delivery', () => {
    expect(isAwaitingDeliveryConfirmation('out_for_delivery')).toBe(true);
    expect(isAwaitingDeliveryConfirmation('preparing')).toBe(false);
    expect(isAwaitingDeliveryConfirmation('delivered')).toBe(false);
  });
});

describe('canReview', () => {
  it('offers a review only after delivery', () => {
    expect(canReview('delivered', null)).toBe(true);
    expect(canReview('preparing', null)).toBe(false);
  });

  it('is false once the rider has already been rated', () => {
    expect(canReview('delivered', 5)).toBe(false);
    expect(canReview('delivered', 0)).toBe(false);
  });
});
