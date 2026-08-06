export const STATUS_STEPS = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'] as const;

/**
 * Index of a status within the fulfilment timeline. Returns -1 for statuses
 * that are not part of the happy path (e.g. `cancelled`).
 */
export function statusStepIndex(status: string): number {
  return (STATUS_STEPS as readonly string[]).indexOf(status);
}

export function isCancelled(status: string): boolean {
  return status === 'cancelled';
}

/**
 * A Customer can cancel only before the last two fulfilment steps and never
 * once payment has been captured.
 */
export function canCancel(status: string, paymentStatus: string): boolean {
  return !isCancelled(status) && statusStepIndex(status) < STATUS_STEPS.length - 2 && paymentStatus !== 'paid';
}

/** The delivery has left the Store and is waiting for the Customer to confirm receipt. */
export function isAwaitingDeliveryConfirmation(status: string): boolean {
  return status === 'out_for_delivery';
}

/** A review is offered only after delivery and while the Rider is still unrated. */
export function canReview(status: string, riderRating: number | null | undefined): boolean {
  return status === 'delivered' && riderRating == null;
}
