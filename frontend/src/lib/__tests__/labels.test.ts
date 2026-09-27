import { describe, it, expect } from "vitest";
import { orderStatusLabel, customerStatusLabel, roleLabel, humanize, UNKNOWN_LABEL, riderName, riderLabel } from "../labels";

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

/**
 * Rider identity on staff surfaces. The dispatch console used to say
 * "Current rider: #12" and "dispatched to rider 1" — database ids on the
 * highest-pressure screen in the product. These two helpers are the one place
 * that turns a rider record into words, shared by the dispatch console and the
 * store orders screen.
 */
describe("rider labels", () => {
  const rita = {
    id: 1,
    vehicle_type: "Motorbike",
    average_rating: 4.8,
    total_deliveries: 212,
    user: { name: "Rider Rita" },
  };

  it("names the rider, never the id", () => {
    expect(riderName(rita)).toBe("Rider Rita");
  });

  it("falls back to the id when the profile carries no usable name", () => {
    expect(riderName({ id: 7, user: { name: "   " } })).toBe("rider #7");
    expect(riderName({ id: 7, user: null })).toBe("rider #7");
    expect(riderName({ id: 7 })).toBe("rider #7");
  });

  it("gives a dispatcher everything needed to choose between riders", () => {
    expect(riderLabel(rita)).toBe("Rider Rita — Motorbike · ★ 4.8 · 212 deliveries");
  });

  it("singularises one delivery", () => {
    expect(riderLabel({ ...rita, average_rating: 5, total_deliveries: 1 })).toBe(
      "Rider Rita — Motorbike · ★ 5.0 · 1 delivery",
    );
  });

  it("calls a rider with no history New rather than ★ 0.0", () => {
    const label = riderLabel({
      id: 2,
      vehicle_type: "Bicycle",
      average_rating: 0,
      total_deliveries: 0,
      user: { name: "New Rider" },
    });
    expect(label).toBe("New Rider — Bicycle · New");
    expect(label).not.toContain("0.0");
  });

  it("assumes a bike when the vehicle is missing", () => {
    expect(riderLabel({ id: 3, vehicle_type: null, user: { name: "Vusi" } })).toBe(
      "Vusi — Bike · New",
    );
  });

  it("tolerates the decimal strings this API returns", () => {
    expect(
      riderLabel({
        ...rita,
        average_rating: "4.75" as unknown as number,
        total_deliveries: "212" as unknown as number,
      }),
    ).toBe("Rider Rita — Motorbike · ★ 4.8 · 212 deliveries");
  });

  it("treats a rating without deliveries as still new", () => {
    expect(riderLabel({ ...rita, total_deliveries: 0 })).toBe(
      "Rider Rita — Motorbike · New",
    );
  });
});
