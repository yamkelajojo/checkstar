/**
 * Extract order total in cents from an order object.
 * Handles the `total_cents` (integer) and `total` (float string) formats
 * returned by different API endpoints.
 */
export function getOrderTotal(order: { total?: number | string | null; total_cents?: number | null }): number {
  if (order.total_cents != null) return order.total_cents;
  if (order.total != null) {
    const val = typeof order.total === 'string' ? parseFloat(order.total) : order.total;
    return Math.round(val * 100);
  }
  return 0;
}
