/**
 * Status and role vocabulary — the SAME words the mobile app uses
 * (mobile/src/lib/status.ts, kept in step by tests on both sides).
 *
 * Before this module the raw enum values reached people: the dispatch console
 * printed `out_for_delivery`, the tracking page printed
 * `order.status.replace(/_/g, ' ')` under a CSS `capitalize` class (which
 * title-cases prepositions: "Out For Delivery"), and the profile page printed
 * `store_owner`. Shoppers do not think in snake_case and staff reading a
 * dispatch board should not have to translate it.
 *
 * Two registers on purpose:
 *  - orderStatusLabel: neutral wording for staff surfaces and admin boards.
 *  - customerStatusLabel: warmer wording for the person waiting for dinner
 *    ("Order received", "Being packed") — identical to mobile's
 *    CUSTOMER_STATUS_LABEL so a shopper switching between app and site reads
 *    the same sentence.
 */

/** Shown when a value is unknown (same glyph the app uses for missing dates). */
export const UNKNOWN_LABEL = "—";

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  retrying: "Retrying",
  ready: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const CUSTOMER_STATUS_LABEL: Record<string, string> = {
  pending: "Order received",
  confirmed: "Confirmed",
  preparing: "Being packed",
  // "Retrying" is system-speak; this is the customer waiting for a courier.
  retrying: "Finding a rider",
  ready: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ROLE_LABEL: Record<string, string> = {
  customer: "Customer",
  rider: "Rider",
  store_owner: "Store owner",
  store_manager: "Store manager",
  logistics_officer: "Logistics officer",
  developer: "Developer",
};

/**
 * Turn an enum-ish value into sentence case: "order_status_changed" becomes
 * "Order status changed", "OUT_FOR_DELIVERY" becomes "Out for delivery".
 *
 * Sentence case, not Title Case: the app's status vocabulary is written that way
 * ("Out for delivery", "Ready for pickup", "Store owner") and a CSS `capitalize`
 * class is what produced "Out For Delivery" in the first place. Used for
 * audit-log event types and cancellation reasons, where the vocabulary grows
 * faster than any label map.
 */
export function humanize(value: unknown): string {
  if (typeof value !== "string") return UNKNOWN_LABEL;

  const words = value
    .trim()
    .toLowerCase()
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean);

  if (words.length === 0) return UNKNOWN_LABEL;

  const [first, ...rest] = words;
  return [first.charAt(0).toUpperCase() + first.slice(1), ...rest].join(" ");
}

/** Neutral order status wording (staff, admin, dispatch). */
export function orderStatusLabel(status: unknown): string {
  if (typeof status === "string" && ORDER_STATUS_LABEL[status]) {
    return ORDER_STATUS_LABEL[status];
  }
  return humanize(status);
}

/** Warmer order status wording (customer surfaces). */
export function customerStatusLabel(status: unknown): string {
  if (typeof status === "string" && CUSTOMER_STATUS_LABEL[status]) {
    return CUSTOMER_STATUS_LABEL[status];
  }
  return orderStatusLabel(status);
}

/** Human role names — never `logistics_officer` on screen. */
export function roleLabel(role: unknown): string {
  if (typeof role === "string" && ROLE_LABEL[role]) return ROLE_LABEL[role];
  return humanize(role);
}
