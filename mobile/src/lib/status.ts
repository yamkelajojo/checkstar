/** Shared order status labels used across customer and rider screens. */

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

/** Customer-friendly status labels with more descriptive wording. */
export const CUSTOMER_STATUS_LABEL: Record<string, string> = {
  pending: 'Order received',
  confirmed: 'Confirmed',
  preparing: 'Being packed',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};
