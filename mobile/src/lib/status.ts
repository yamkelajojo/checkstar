/** Shared order status labels used across customer and rider screens. */

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  // Dispatch can put an order back into the rider-search queue; the word for it
  // has to match the web client (frontend/src/lib/labels.ts) exactly.
  retrying: 'Retrying',
  // Pickup fulfilment: packed and waiting at the store for collection.
  ready: 'Ready for pickup',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

/** Customer-friendly status labels with more descriptive wording. */
export const CUSTOMER_STATUS_LABEL: Record<string, string> = {
  pending: 'Order received',
  confirmed: 'Confirmed',
  preparing: 'Being packed',
  // "Retrying" is system-speak; the customer is waiting for a courier.
  retrying: 'Finding a rider',
  ready: 'Ready for pickup',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};
