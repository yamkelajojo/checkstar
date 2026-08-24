import {
  STATUS_STEPS,
  statusStepIndex,
  isCancelled,
  canCancel,
  cancellable,
  isActiveOrderStatus,
  resolveDispatchOutcome,
  cancelConflictLabel,
  orderUpdateBody,
  isAwaitingDeliveryConfirmation,
  canReview,
} from '../model';

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

describe('cancellable', () => {
  it('prefers the API can_cancel flag when present', () => {
    expect(cancellable({ status: 'out_for_delivery', payment_status: 'pending', can_cancel: true })).toBe(true);
    expect(cancellable({ status: 'pending', payment_status: 'pending', can_cancel: false })).toBe(false);
    expect(cancellable({ status: 'pending', payment_status: 'paid', can_cancel: true })).toBe(true);
  });

  it('falls back to the local rule only when the field is undefined', () => {
    expect(cancellable({ status: 'pending', payment_status: 'pending' })).toBe(true);
    expect(cancellable({ status: 'out_for_delivery', payment_status: 'pending' })).toBe(false);
    expect(cancellable({ status: 'cancelled', payment_status: 'pending' })).toBe(false);
  });
});

describe('isActiveOrderStatus', () => {
  it('is true for every in-flight status including retrying', () => {
    for (const status of ['pending', 'confirmed', 'retrying', 'preparing', 'out_for_delivery']) {
      expect(isActiveOrderStatus(status)).toBe(true);
    }
  });

  it('is false for terminal statuses', () => {
    expect(isActiveOrderStatus('delivered')).toBe(false);
    expect(isActiveOrderStatus('cancelled')).toBe(false);
  });
});

describe('resolveDispatchOutcome', () => {
  it('uses the route dispatch envelope before the order has been fetched', () => {
    expect(resolveDispatchOutcome({ status: 'retrying' }, undefined)).toBe('retrying');
    expect(resolveDispatchOutcome({ status: 'cancelled' }, undefined)).toBe('cancelled');
    expect(resolveDispatchOutcome(undefined, undefined)).toBe('assigned');
  });

  it('lets the fetched order status override so a refresh stays correct', () => {
    expect(resolveDispatchOutcome({ status: 'assigned' }, 'retrying')).toBe('retrying');
    expect(resolveDispatchOutcome(undefined, 'retrying')).toBe('retrying');
    expect(resolveDispatchOutcome({ status: 'retrying' }, 'confirmed')).toBe('assigned');
  });

  it('treats a cancelled order as failed dispatch on this screen', () => {
    expect(resolveDispatchOutcome({ status: 'retrying' }, 'cancelled')).toBe('cancelled');
  });
});

describe('cancelConflictLabel', () => {
  it('maps known reason codes to friendly labels', () => {
    expect(cancelConflictLabel('order_not_cancellable')).toBe("Can't cancel — order already out");
  });

  it('falls back to a generic label for unknown or missing reasons', () => {
    expect(cancelConflictLabel('something_new')).toBe("This order can't be cancelled right now.");
    expect(cancelConflictLabel(undefined)).toBe("This order can't be cancelled right now.");
    expect(cancelConflictLabel(null)).toBe("This order can't be cancelled right now.");
  });
});

describe('orderUpdateBody', () => {
  it('returns a human-readable body per status, including retrying', () => {
    expect(orderUpdateBody('retrying')).toBe('Retrying — finding a rider');
    expect(orderUpdateBody('out_for_delivery')).toBe('Your Rider is on the way');
    expect(orderUpdateBody('delivered')).toBe('Order delivered — enjoy!');
  });

  it('falls back to the raw status when unknown', () => {
    expect(orderUpdateBody('mystery')).toBe('mystery');
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
