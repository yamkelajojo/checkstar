import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";

/**
 * RegisterClient — customer sign-up.
 *
 * Pinned behaviour:
 *   - the social options (Google/Apple) are present but purely decorative:
 *     they are buttons that raise a "coming soon" toast and never trigger
 *     any auth call,
 *   - the "Want to deliver? Register as a Rider" paragraph is gone from this
 *     page (rider sign-up has its own entry points elsewhere),
 *   - the password field keeps the single animated reveal toggle,
 *   - the form still validates and registers normally.
 */

vi.mock("motion/react", async () => (await import("@/test/motion-mock")).default);

const toastInfo = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({ toast: { info: toastInfo } }));

const nav = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: nav.push, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/auth/register",
}));

const auth = vi.hoisted(() => ({
  isAuthenticated: false,
  register: vi.fn(),
  checkAuth: vi.fn(),
}));
vi.mock("@/stores/auth-store", () => ({ useAuthStore: () => auth }));

import RegisterClient from "../RegisterClient";

beforeEach(() => {
  nav.push.mockReset();
  auth.isAuthenticated = false;
  auth.register.mockReset().mockResolvedValue(undefined);
  auth.checkAuth.mockReset().mockResolvedValue(undefined);
  toastInfo.mockReset();
});

afterEach(() => cleanup());

const fillForm = () => {
  fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: "Naledi Mokoena" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "naledi@checkstar.co.za" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
  fireEvent.change(screen.getByLabelText("Confirm Password"), {
    target: { value: "password123" },
  });
};

describe("RegisterClient — decorative social options", () => {
  it("shows both Google and Apple sign-up buttons above the form", () => {
    render(<RegisterClient />);

    expect(screen.getByRole("button", { name: /sign up with google/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /sign up with apple/i })).toBeTruthy();
    expect(screen.getByText(/or continue with email/i)).toBeTruthy();
  });

  it("never triggers an auth call when a social button is clicked", async () => {
    render(<RegisterClient />);

    fireEvent.click(screen.getByRole("button", { name: /sign up with google/i }));
    fireEvent.click(screen.getByRole("button", { name: /sign up with apple/i }));

    await waitFor(() => expect(toastInfo).toHaveBeenCalledTimes(2));
    expect(toastInfo.mock.calls[0][0]).toMatch(/google/i);
    expect(toastInfo.mock.calls[1][0]).toMatch(/apple/i);
    expect(auth.register).not.toHaveBeenCalled();
  });
});

describe("RegisterClient — rider link removal", () => {
  it("no longer advertises rider registration on this page", () => {
    render(<RegisterClient />);
    expect(screen.queryByText(/register as a rider/i)).toBeNull();
    expect(screen.queryByText(/want to deliver/i)).toBeNull();
    // The customer-facing sign-in link must survive.
    expect(screen.getByRole("link", { name: "Sign in" }).getAttribute("href")).toBe("/auth/login");
  });
});

describe("RegisterClient — password reveal", () => {
  it("keeps exactly one reveal toggle, with the announced pressed contract", () => {
    render(<RegisterClient />);

    const toggle = screen.getByLabelText("Show password");
    fireEvent.click(toggle);
    expect(screen.getByLabelText("Password").getAttribute("type")).toBe("text");
    expect(screen.getByLabelText("Hide password").getAttribute("aria-pressed")).toBe("true");
  });
});

describe("RegisterClient — form behaviour", () => {
  it("rejects mismatched passwords before calling the API", async () => {
    render(<RegisterClient />);

    fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: "X" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "x@y.co.za" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "different" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText("Passwords do not match.")).toBeTruthy();
    expect(auth.register).not.toHaveBeenCalled();
  });

  it("submits the filled form to the auth store", async () => {
    render(<RegisterClient />);
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(auth.register).toHaveBeenCalledWith({
        name: "Naledi Mokoena",
        email: "naledi@checkstar.co.za",
        password: "password123",
        password_confirmation: "password123",
        phone: undefined,
      }),
    );
  });
});
