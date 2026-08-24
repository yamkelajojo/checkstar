import { copy } from '../../lib/strings';
import type { ApiDispatchStatus } from '../../lib/types';

export const STATUS_STEPS = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'] as const;

export type OrderStepStatus = (typeof STATUS_STEPS)[number];
export type ActiveOrderStatus = (typeof ACTIVE_ORDER_STATUSES)[number];

/** Statuses during which the Customer screen keeps polling for updates — happy path plus `retrying` which is not in STATUS_STEPS. */
export const ACTIVE_ORDER_STATUSES = ['pending', 'confirmed', 'retrying', 'preparing', 'out_for_delivery'] as const;

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

export interface CancellableOrder {
  status: string;
  payment_status: string;
  can_cancel?: boolean;
}

/**
 * Server-driven cancellation gate: prefers the API's `can_cancel` flag and
 * falls back to the local timeline rule only when the field is absent.
 */
export function cancellable(order: CancellableOrder): boolean {
  if (order.can_cancel !== undefined) return order.can_cancel;
  return canCancel(order.status, order.payment_status);
}

const ACTIVE_SET = new Set<string>(ACTIVE_ORDER_STATUSES as readonly string[]);

export function isActiveOrderStatus(status: string): boolean {
  return ACTIVE_SET.has(status);
}

/**
 * Which outcome the OrderPlaced screen should present. Live order status wins
 * over the placement envelope so a refresh stays correct. Retrying and
 * cancelled are terminal-ish until dispatch resolves, so they take priority
 * over the generic assigned timeline.
 */
export function resolveDispatchOutcome(
  dispatch: { status: ApiDispatchStatus } | null | undefined,
  orderStatus: string | null | undefined,
): ApiDispatchStatus {
  if (orderStatus === 'retrying') return 'retrying';
  if (orderStatus === 'cancelled') return 'cancelled';
  if (orderStatus != null && statusStepIndex(orderStatus) >= 1) return 'assigned';
  if (dispatch?.status === 'retrying' || dispatch?.status === 'cancelled') return dispatch.status;
  return 'assigned';
}

/** Friendly label for a cancel-conflict reason code, generic when unknown. */
export function cancelConflictLabel(reason: string | null | undefined): string {
  if (reason === 'order_not_cancellable') return copy.orders.cancelBlockedReasons.order_not_cancellable;
  return copy.orders.cancelBlockedGeneric;
}

/** Human-readable body for the local "order update" notification. */
export function orderUpdateBody(status: string): string {
  const bodies = copy.orders.orderUpdates as Record<string, string>;
  return bodies[status] ?? status;
}

/** The delivery has left the Store and is waiting for the Customer to confirm receipt. */
export function isAwaitingDeliveryConfirmation(status: string): boolean {
  return status === 'out_for_delivery';
}

/** A review is offered only after delivery and while the Rider is still unrated. */
export function canReview(status: string, riderRating: number | null | undefined): boolean {
  return status === 'delivered' && riderRating == null;
}
