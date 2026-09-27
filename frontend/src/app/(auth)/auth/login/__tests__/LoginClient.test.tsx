import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";

/**
 * LoginClient — the front door for all six Checkstar roles.
 *
 * Three things must not regress here:
 *  1. each role lands on ITS dashboard (a rider sent to /admin is a dead end),
 *  2. a `?redirect=` deep link returns the visitor where they were headed,
 *  3. that same parameter cannot be abused into an open redirect.
 */

vi.mock("motion/react", () => {
  const cache = new Map<string, any>();
  return {
    motion: new Proxy(
      {},
      {
        get: (_t, tag: string) => {
          if (!cache.has(tag)) {
            cache.set(
              tag,
              React.forwardRef((props: any, ref: any) => {
                const {
                  initial,
                  animate,
                  exit,
                  whileInView,
                  whileHover,
                  whileTap,
                  viewport,
                  transition,
                  variants,
                  layout,
                  ...rest
                } = props;
                return React.createElement(tag, { ...rest, ref });
              }),
            );
          }
          return cache.get(tag);
        },
      },
    ),
    useReducedMotion: () => false,
    AnimatePresence: ({ children }: any) => children,
  };
});

vi.mock("@/components/Logo", () => ({
  Logo: () => React.createElement("span", { "data-testid": "logo" }, "Checkstar"),
}));
vi.mock("@/components/Loader", () => ({
  Loader: () => React.createElement("span", { "data-testid": "loader" }),
}));

const nav = vi.hoisted(() => ({
  push: vi.fn(),
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: nav.push, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => nav.params,
  usePathname: () => "/auth/login",
}));

const auth = vi.hoisted(() => ({
  isAuthenticated: false,
  user: null as any,
  login: vi.fn(),
  checkAuth: vi.fn(),
}));

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: () => auth,
}));

import LoginClient from "../LoginClient";

const signIn = async (email = "sipho@checkstar.co.za", password = "password123") => {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
  await waitFor(() => expect(auth.login).toHaveBeenCalled());
};

beforeEach(() => {
  nav.push.mockReset();
  nav.params = new URLSearchParams();
  auth.isAuthenticated = false;
  auth.user = null;
  auth.login.mockReset().mockResolvedValue(undefined);
  auth.checkAuth.mockReset().mockResolvedValue(undefined);
});

afterEach(() => cleanup());

describe("LoginClient form", () => {
  it("greets the visitor and asks for labelled credentials", () => {
    render(<LoginClient />);

    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeTruthy();
    const email = screen.getByLabelText("Email");
    const password = screen.getByLabelText("Password");
    expect(email.getAttribute("type")).toBe("email");
    expect(email.hasAttribute("required")).toBe(true);
    expect(password.getAttribute("type")).toBe("password");
    expect(password.hasAttribute("required")).toBe(true);
  });

  it("restores an existing session on mount", () => {
    render(<LoginClient />);
    expect(auth.checkAuth).toHaveBeenCalledTimes(1);
  });

  it("toggles password visibility with an announced, pressed-state button", () => {
    render(<LoginClient />);

    const toggle = screen.getByLabelText("Show password");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(toggle);
    expect(screen.getByLabelText("Password").getAttribute("type")).toBe("text");
    expect(screen.getByLabelText("Hide password").getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(screen.getByLabelText("Hide password"));
    expect(screen.getByLabelText("Password").getAttribute("type")).toBe("password");
  });

  it("links to password recovery, registration and rider sign-up", () => {
    render(<LoginClient />);

    expect(screen.getByRole("link", { name: "Forgot password?" }).getAttribute("href")).toBe(
      "/auth/forgot-password",
    );
    expect(screen.getByRole("link", { name: "Register here" }).getAttribute("href")).toBe(
      "/auth/register",
    );
    expect(screen.getByRole("link", { name: "Become a Rider" }).getAttribute("href")).toBe(
      "/auth/register/rider",
    );
  });

  it("sends the typed credentials to the auth store", async () => {
    render(<LoginClient />);
    await signIn("owner@checkstar.co.za", "sekret");

    expect(auth.login).toHaveBeenCalledWith("owner@checkstar.co.za", "sekret");
  });

  it("shows progress while signing in and re-enables afterwards", async () => {
    let resolveLogin: () => void = () => {};
    auth.login.mockImplementation(
      () => new Promise<void>((resolve) => { resolveLogin = resolve; }),
    );

    render(<LoginClient />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.co.za" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "pw" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /signing in/i })).toBeTruthy(),
    );
    expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled();

    resolveLogin();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^sign in$/i })).toBeTruthy(),
    );
    expect(screen.getByRole("button", { name: /^sign in$/i })).not.toBeDisabled();
  });

  it("surfaces the API's own message when credentials are rejected", async () => {
    auth.login.mockRejectedValue(new Error("These credentials do not match our records."));

    render(<LoginClient />);
    await signIn("typo@checkstar.co.za", "wrong");

    expect(
      await screen.findByText("These credentials do not match our records."),
    ).toBeTruthy();
  });

  it("falls back to a safe message when the error carries none", async () => {
    auth.login.mockRejectedValue({});

    render(<LoginClient />);
    await signIn("typo@checkstar.co.za", "wrong");

    expect(await screen.findByText("Invalid email or password.")).toBeTruthy();
  });
});

describe("LoginClient role routing", () => {
  const cases: Array<[string, string]> = [
    ["rider", "/rider/dashboard"],
    ["store_owner", "/admin/dashboard"],
    ["store_manager", "/admin/dashboard"],
    ["logistics_officer", "/admin/dashboard"],
    ["developer", "/admin/dashboard"],
    ["customer", "/"],
  ];

  it.each(cases)("sends a %s to %s", async (role, expected) => {
    auth.isAuthenticated = true;
    auth.user = { id: 1, name: "Test User", email: "t@checkstar.co.za", role };

    render(<LoginClient />);

    await waitFor(() => expect(nav.push).toHaveBeenCalledWith(expected));
  });

  it("honours a same-app redirect parameter over the role default", async () => {
    auth.isAuthenticated = true;
    auth.user = { id: 1, name: "Rider", email: "r@checkstar.co.za", role: "rider" };
    nav.params = new URLSearchParams("redirect=/rider/orders/12");

    render(<LoginClient />);

    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/rider/orders/12"));
    expect(nav.push).not.toHaveBeenCalledWith("/rider/dashboard");
  });

  it.each([
    ["a protocol-relative URL", "//evil.example/steal"],
    ["an absolute URL", "https://evil.example/steal"],
    ["a javascript: URL", "javascript:alert(1)"],
  ])("refuses to redirect to %s", async (_label, redirect) => {
    auth.isAuthenticated = true;
    auth.user = { id: 1, name: "Customer", email: "c@checkstar.co.za", role: "customer" };
    nav.params = new URLSearchParams(`redirect=${redirect}`);

    render(<LoginClient />);

    await waitFor(() => expect(nav.push).toHaveBeenCalled());
    expect(nav.push).toHaveBeenCalledWith("/");
    expect(nav.push).not.toHaveBeenCalledWith(redirect);
  });

  it("stays on the form while signed out", () => {
    render(<LoginClient />);
    expect(nav.push).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeTruthy();
  });
});
