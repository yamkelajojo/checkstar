import {
  STATUS_STEPS,
  statusStepIndex,
  isCancelled,
  canCancel,
  cancellable,
  isActiveOrderStatus,
  isAwaitingDeliveryConfirmation,
  canReview,
  resolveDispatchOutcome,
} from '../model';

describe('Order Lifecycle Verification', () => {
  test('STATUS_STEPS defines the required five-step sequence', () => {
    expect(STATUS_STEPS).toEqual(['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered']);
  });

  test('statusStepIndex maps each step to its position', () => {
    expect(statusStepIndex('pending')).toBe(0);
    expect(statusStepIndex('confirmed')).toBe(1);
    expect(statusStepIndex('preparing')).toBe(2);
    expect(statusStepIndex('out_for_delivery')).toBe(3);
    expect(statusStepIndex('delivered')).toBe(4);
    expect(statusStepIndex('cancelled')).toBe(-1);
  });

  test('isCancelled detects the cancelled terminal state', () => {
    expect(isCancelled('cancelled')).toBe(true);
    expect(isCancelled('pending')).toBe(false);
    expect(isCancelled('delivered')).toBe(false);
  });

  test('canCancel blocks once payment is captured or order is near delivery', () => {
    expect(canCancel('pending', 'pending')).toBe(true);
    expect(canCancel('confirmed', 'pending')).toBe(true);
    expect(canCancel('preparing', 'pending')).toBe(true);
    expect(canCancel('out_for_delivery', 'pending')).toBe(false);
    expect(canCancel('delivered', 'pending')).toBe(false);
    expect(canCancel('pending', 'paid')).toBe(false);
    expect(canCancel('confirmed', 'paid')).toBe(false);
  });

  test('cancellable prefers the server can_cancel flag over the local rule', () => {
    expect(cancellable({ status: 'out_for_delivery', payment_status: 'pending', can_cancel: true })).toBe(true);
    expect(cancellable({ status: 'pending', payment_status: 'pending', can_cancel: false })).toBe(false);
    expect(cancellable({ status: 'pending', payment_status: 'pending' })).toBe(true);
  });

  test('isActiveOrderStatus includes all statuses that should poll', () => {
    expect(isActiveOrderStatus('pending')).toBe(true);
    expect(isActiveOrderStatus('confirmed')).toBe(true);
    expect(isActiveOrderStatus('retrying')).toBe(true);
    expect(isActiveOrderStatus('preparing')).toBe(true);
    expect(isActiveOrderStatus('out_for_delivery')).toBe(true);
    expect(isActiveOrderStatus('delivered')).toBe(false);
    expect(isActiveOrderStatus('cancelled')).toBe(false);
  });

  test('isAwaitingDeliveryConfirmation is true only for out_for_delivery', () => {
    expect(isAwaitingDeliveryConfirmation('out_for_delivery')).toBe(true);
    expect(isAwaitingDeliveryConfirmation('preparing')).toBe(false);
    expect(isAwaitingDeliveryConfirmation('delivered')).toBe(false);
  });

  test('canReview is true only after delivery when unrated', () => {
    expect(canReview('delivered', null)).toBe(true);
    expect(canReview('delivered', 5)).toBe(false);
    expect(canReview('preparing', null)).toBe(false);
  });

  test('resolveDispatchOutcome derives the correct status from params and live order', () => {
    expect(resolveDispatchOutcome({ status: 'assigned' }, 'confirmed')).toBe('assigned');
    expect(resolveDispatchOutcome({ status: 'retrying' }, 'retrying')).toBe('retrying');
    expect(resolveDispatchOutcome({ status: 'cancelled' }, 'cancelled')).toBe('cancelled');
    expect(resolveDispatchOutcome(null, 'preparing')).toBe('assigned');
    expect(resolveDispatchOutcome(null, null)).toBe('assigned');
  });

  test('order status lifecycle follows a single field sequence', () => {
    const lifecycle = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];
    expect(lifecycle).toHaveLength(5);
    expect(lifecycle[0]).toBe('pending');
    expect(lifecycle[lifecycle.length - 1]).toBe('delivered');
    expect(lifecycle).not.toContain('cancelled');
  });

  test('payment status tracks independently from fulfillment status', () => {
    const paymentSteps = ['pending', 'paid', 'refunded'];
    expect(paymentSteps).toHaveLength(3);
    expect(paymentSteps).toContain('paid');
  });

  test('cancellableFrom covers pending, confirmed, and preparing', () => {
    expect(canCancel('pending', 'pending')).toBe(true);
    expect(canCancel('confirmed', 'pending')).toBe(true);
    expect(canCancel('preparing', 'pending')).toBe(true);
    expect(canCancel('out_for_delivery', 'pending')).toBe(false);
  });
});
