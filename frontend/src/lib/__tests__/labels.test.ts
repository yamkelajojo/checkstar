import { describe, it, expect } from "vitest";
import {
  orderStatusLabel,
  customerStatusLabel,
  roleLabel,
  humanize,
  UNKNOWN_LABEL,
} from "../labels";

/**
 * Status and role vocabulary — the SAME words mobile uses
 * (mobile/src/lib/status.ts). One ecosystem, one vocabulary.
 *
 * Why this module exists: the raw enum values were reaching people. The
 * dispatch console printed `out_for_delivery`, the tracking page printed
 * `order.status.replace(/_/g, ' ')` through a CSS `capitalize` class ("Out For
 * Delivery", title-cased prepositions), and the profile page printed
 * `store_owner`. Customers do not think in snake_case, and staff reading a
 * dispatch board do not want to translate it either.
 */
describe("orderStatusLabel (staff + customer neutral wording)", () => {
  it.each([
    ["pending", "Pending"],
    ["confirmed", "Confirmed"],
    ["preparing", "Preparing"],
    ["retrying", "Retrying"],
    ["ready", "Ready for pickup"],
    ["out_for_delivery", "Out for delivery"],
    ["delivered", "Delivered"],
    ["cancelled", "Cancelled"],
  ])("maps %s to %s", (status, expected) => {
    expect(orderStatusLabel(status)).toBe(expected);
  });

  it("matches the mobile client word for word", () => {
    // mobile/src/lib/status.ts ORDER_STATUS_LABEL
    const mobile: Record<string, string> = {
      pending: "Pending",
      confirmed: "Confirmed",
      preparing: "Preparing",
      retrying: "Retrying",
      ready: "Ready for pickup",
      out_for_delivery: "Out for delivery",
      delivered: "Delivered",
      cancelled: "Cancelled",
    };
    Object.entries(mobile).forEach(([status, label]) => {
      expect(orderStatusLabel(status)).toBe(label);
    });
  });

  it("humanises an unknown status instead of printing the enum", () => {
    expect(orderStatusLabel("awaiting_courier")).toBe("Awaiting courier");
    expect(orderStatusLabel("")).toBe(UNKNOWN_LABEL);
    expect(orderStatusLabel(null)).toBe(UNKNOWN_LABEL);
    expect(orderStatusLabel(undefined)).toBe(UNKNOWN_LABEL);
  });
});

describe("customerStatusLabel (warmer wording for shoppers)", () => {
  it.each([
    ["pending", "Order received"],
    ["confirmed", "Confirmed"],
    ["preparing", "Being packed"],
    ["retrying", "Finding a rider"],
    ["ready", "Ready for pickup"],
    ["out_for_delivery", "Out for delivery"],
    ["delivered", "Delivered"],
    ["cancelled", "Cancelled"],
  ])("maps %s to %s", (status, expected) => {
    expect(customerStatusLabel(status)).toBe(expected);
  });

  it("matches the mobile customer register word for word", () => {
    // mobile/src/lib/status.ts CUSTOMER_STATUS_LABEL
    const mobile: Record<string, string> = {
      pending: "Order received",
      confirmed: "Confirmed",
      preparing: "Being packed",
      retrying: "Finding a rider",
      ready: "Ready for pickup",
      out_for_delivery: "Out for delivery",
      delivered: "Delivered",
      cancelled: "Cancelled",
    };
    Object.entries(mobile).forEach(([status, label]) => {
      expect(customerStatusLabel(status)).toBe(label);
    });
  });

  it("falls back to the neutral label for statuses only staff see", () => {
    expect(customerStatusLabel("awaiting_courier")).toBe("Awaiting courier");
  });
});

describe("roleLabel", () => {
  it.each([
    ["customer", "Customer"],
    ["rider", "Rider"],
    ["store_owner", "Store owner"],
    ["store_manager", "Store manager"],
    ["logistics_officer", "Logistics officer"],
    ["developer", "Developer"],
  ])("maps %s to %s", (role, expected) => {
    expect(roleLabel(role)).toBe(expected);
  });

  it("never prints a snake_case role", () => {
    expect(roleLabel("some_new_role")).toBe("Some new role");
    expect(roleLabel(null)).toBe(UNKNOWN_LABEL);
  });
});

describe("humanize", () => {
  it("turns enum-ish values into sentence case", () => {
    expect(humanize("order_status_changed")).toBe("Order status changed");
    expect(humanize("special.created")).toBe("Special created");
    expect(humanize("OUT_FOR_DELIVERY")).toBe("Out for delivery");
    expect(humanize("  padded_value  ")).toBe("Padded value");
  });

  it("returns the placeholder for nothing at all", () => {
    expect(humanize(null)).toBe(UNKNOWN_LABEL);
    expect(humanize(undefined)).toBe(UNKNOWN_LABEL);
    expect(humanize("")).toBe(UNKNOWN_LABEL);
    expect(humanize(123 as unknown as string)).toBe(UNKNOWN_LABEL);
  });

  it("does not title-case small words (the CSS capitalize trap)", () => {
    expect(humanize("out_for_delivery")).toBe("Out for delivery");
    expect(humanize("ready_for_pickup")).toBe("Ready for pickup");
  });
});
