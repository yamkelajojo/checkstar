import { describe, it, expect } from "vitest";
import { createPrototypeBankingDetails } from "../prototype-banking";

/**
 * The prototype no longer asks riders for banking details. Instead the web
 * client fabricates a clearly-labelled dummy payload so the API contract
 * stays exercised end-to-end. These tests pin that fabrication down so it
 * can never accidentally look like real money infrastructure.
 */

describe("createPrototypeBankingDetails", () => {
  it("returns the documented shape with every field populated", () => {
    const details = createPrototypeBankingDetails("sipho@checkstar.co.za");

    expect(details).toEqual({
      bank: "Checkstar Prototype Bank",
      account_number: details.account_number,
      branch_code: "PROTOTYPE-000000",
      account_type: "savings",
    });
    expect(details.bank).toBe("Checkstar Prototype Bank");
    expect(details.branch_code).toBe("PROTOTYPE-000000");
    expect(details.account_type).toBe("savings");
  });

  it("generates a 10-digit numeric account number", () => {
    const details = createPrototypeBankingDetails("naledi@checkstar.co.za");
    expect(details.account_number).toMatch(/^\d{10}$/);
  });

  it("is deterministic for the same seed", () => {
    const a = createPrototypeBankingDetails("same@checkstar.co.za");
    const b = createPrototypeBankingDetails("same@checkstar.co.za");
    expect(a.account_number).toBe(b.account_number);
  });

  it("varies the account number across different seeds", () => {
    const a = createPrototypeBankingDetails("one@checkstar.co.za");
    const b = createPrototypeBankingDetails("two@checkstar.co.za");
    expect(a.account_number).not.toBe(b.account_number);
  });

  it("falls back to a random account number without a seed", () => {
    const details = createPrototypeBankingDetails();
    expect(details.account_number).toMatch(/^\d{10}$/);
  });
});
