import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";

/**
 * RiderRegisterClient — rider sign-up for the prototype.
 *
 * The banking form was removed on purpose: riders must not be asked for bank
 * details in the prototype. Instead a clearly-labelled dummy payload is
 * fabricated at submit time (see lib/prototype-banking). Pinned here:
 *   - no banking inputs are rendered at all,
 *   - the submitted payload still carries `banking_details` (API contract
 *     intact, mobile flow unaffected),
 *   - the vehicle choice uses the styled Select and reaches the payload.
 */

vi.mock("motion/react", async () => (await import("@/test/motion-mock")).default);

const nav = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: nav.push, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/auth/register/rider",
}));

const auth = vi.hoisted(() => ({
  isAuthenticated: false,
  registerRider: vi.fn(),
  checkAuth: vi.fn(),
}));
vi.mock("@/stores/auth-store", () => ({ useAuthStore: () => auth }));

import RiderRegisterClient from "../RiderRegisterClient";

beforeEach(() => {
  nav.push.mockReset();
  auth.isAuthenticated = false;
  auth.registerRider.mockReset().mockResolvedValue(undefined);
  auth.checkAuth.mockReset().mockResolvedValue(undefined);
});

afterEach(() => cleanup());

const fillBasics = () => {
  fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: "Thabo Nkosi" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "thabo@checkstar.co.za" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
  fireEvent.change(screen.getByLabelText("Confirm Password"), {
    target: { value: "password123" },
  });
};

describe("RiderRegisterClient — banking inputs removed", () => {
  it("renders no banking fields whatsoever", () => {
    render(<RiderRegisterClient />);

    expect(screen.queryByText(/banking details/i)).toBeNull();
    expect(screen.queryByLabelText(/bank name/i)).toBeNull();
    expect(screen.queryByLabelText(/account number/i)).toBeNull();
    expect(screen.queryByLabelText(/branch code/i)).toBeNull();
    expect(screen.queryByLabelText(/account type/i)).toBeNull();
  });
});

describe("RiderRegisterClient — submission", () => {
  it("auto-generates clearly-labelled prototype banking details on submit", async () => {
    render(<RiderRegisterClient />);
    fillBasics();
    fireEvent.click(screen.getByRole("button", { name: /register as rider/i }));

    await waitFor(() => expect(auth.registerRider).toHaveBeenCalledTimes(1));
    const payload = auth.registerRider.mock.calls[0][0];

    expect(payload.name).toBe("Thabo Nkosi");
    expect(payload.email).toBe("thabo@checkstar.co.za");
    expect(payload.vehicle_type).toBe("motorbike"); // default from the Select

    // The dummy record is obviously fake, not a placeholder someone could
    // mistake for real money data.
    expect(payload.banking_details).toEqual({
      bank: "Checkstar Prototype Bank",
      account_number: expect.stringMatching(/^\d{10}$/),
      branch_code: "PROTOTYPE-000000",
      account_type: "savings",
    });
  });

  it("generates stable banking details for the same email", async () => {
    render(<RiderRegisterClient />);
    fillBasics();
    fireEvent.click(screen.getByRole("button", { name: /register as rider/i }));
    await waitFor(() => expect(auth.registerRider).toHaveBeenCalledTimes(1));
    const first = auth.registerRider.mock.calls[0][0].banking_details.account_number;

    cleanup();
    render(<RiderRegisterClient />);
    fillBasics();
    fireEvent.click(screen.getByRole("button", { name: /register as rider/i }));
    await waitFor(() => expect(auth.registerRider).toHaveBeenCalledTimes(2));
    const second = auth.registerRider.mock.calls[1][0].banking_details.account_number;

    expect(second).toBe(first);
  });

  it("sends the vehicle picked from the styled Select", async () => {
    render(<RiderRegisterClient />);
    fillBasics();

    fireEvent.click(screen.getByLabelText("Vehicle Type"));
    fireEvent.click(screen.getByRole("option", { name: "Bicycle" }));

    fireEvent.click(screen.getByRole("button", { name: /register as rider/i }));
    await waitFor(() => expect(auth.registerRider).toHaveBeenCalled());
    expect(auth.registerRider.mock.calls[0][0].vehicle_type).toBe("bicycle");
  });

  it("still blocks mismatched passwords before hitting the API", () => {
    render(<RiderRegisterClient />);
    fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: "X" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "x@y.co.za" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "nope" } });
    fireEvent.click(screen.getByRole("button", { name: /register as rider/i }));

    expect(auth.registerRider).not.toHaveBeenCalled();
  });
});
