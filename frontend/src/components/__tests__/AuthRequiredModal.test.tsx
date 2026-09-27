import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";

/**
 * AuthRequiredModal — the gate every guest hits at checkout.
 *
 * It had no test file at all. One real defect lived in that gap: focus never
 * moved into the dialog, so a keyboard guest tabbed through the page *behind*
 * the overlay and had no way back. That now comes from the shared
 * `useDialogFocus` hook (also used by admin/Modal and CartDrawer), and the
 * dialog lands on "Sign in" rather than on the dismiss button — a guest stopped
 * at checkout should arrive on the way forward.
 *
 * The rest of this suite locks in behaviour that was already right but
 * unprotected: the redirect round-trip, Escape/backdrop dismissal, and the fact
 * that a click *inside* the card does not dismiss it (the card stops
 * propagation, so aiming at a button and missing cannot throw the guest out).
 */

vi.mock("motion/react", async () => (await import("@/test/motion-mock")).default);

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: any) =>
    React.createElement("a", { href, ...rest }, children),
}));

import AuthRequiredModal from "../AuthRequiredModal";

const onClose = vi.fn();

afterEach(() => {
  cleanup();
  onClose.mockReset();
  document.querySelectorAll("body > button").forEach((node) => node.remove());
  document.body.style.overflow = "";
});

/** A button outside React, standing in for the checkout button that opened this. */
function outsideTrigger(): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Checkout";
  document.body.appendChild(button);
  button.focus();
  return button;
}

function openFromTrigger(props: { redirectTo?: string } = {}) {
  const trigger = outsideTrigger();
  const view = render(<AuthRequiredModal open={false} onClose={onClose} {...props} />);
  view.rerender(<AuthRequiredModal open onClose={onClose} {...props} />);
  return { trigger, view, dialog: screen.getByRole("dialog") };
}

describe("AuthRequiredModal", () => {
  it("renders nothing while closed", () => {
    const { container } = render(<AuthRequiredModal open={false} onClose={onClose} />);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(screen.queryByText("Sign in to check out")).toBeNull();
  });

  it("announces itself as a modal dialog labelled by its heading", () => {
    render(<AuthRequiredModal open onClose={onClose} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog).toHaveAccessibleName("Sign in to check out");
  });

  it("says why the guest is being stopped, instead of just demanding a login", () => {
    render(<AuthRequiredModal open onClose={onClose} />);
    expect(screen.getByText(/browsing as a guest/i)).toBeInTheDocument();
  });

  it("sends the guest back to the page they came from after signing in", () => {
    render(<AuthRequiredModal open onClose={onClose} redirectTo="/products/fresh-spinach" />);

    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/auth/login?redirect=%2Fproducts%2Ffresh-spinach",
    );
  });

  it("defaults the return path to the cart", () => {
    render(<AuthRequiredModal open onClose={onClose} />);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/auth/login?redirect=%2Fcart",
    );
  });

  it("offers registration as an equal option, and mentions the app", () => {
    render(<AuthRequiredModal open onClose={onClose} />);
    expect(screen.getByRole("link", { name: "Create an account" })).toHaveAttribute(
      "href",
      "/auth/register",
    );
    expect(screen.getByText(/Checkstar app/i)).toBeInTheDocument();
  });

  it("closes on Escape", () => {
    render(<AuthRequiredModal open onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on the close button", () => {
    render(<AuthRequiredModal open onClose={onClose} />);
    fireEvent.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when the backdrop behind the card is clicked", () => {
    render(<AuthRequiredModal open onClose={onClose} />);
    // The card sits centred in a full-screen layer; click the layer itself.
    fireEvent.click(screen.getByRole("dialog"), { clientX: 2, clientY: 2 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does NOT close when the guest clicks inside the card", () => {
    render(<AuthRequiredModal open onClose={onClose} />);

    // The dismiss layer is the card's parent, so this only holds because the
    // card stops propagation. Without that, aiming at a button and missing
    // would throw the guest out of the dialog.
    fireEvent.click(screen.getByText("Sign in to check out"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("ignores Escape while closed", () => {
    render(<AuthRequiredModal open={false} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("AuthRequiredModal focus management", () => {
  const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  it("moves focus into the dialog when it opens", () => {
    const { trigger, dialog } = openFromTrigger();

    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).not.toBe(trigger);
  });

  it("lands on the sign-in action, not on the dismiss button", () => {
    openFromTrigger();
    // The first focusable element inside the card is the close button; a guest
    // stopped at checkout should land on the way forward.
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveFocus();
  });

  it("traps Tab inside the dialog", () => {
    const { dialog } = openFromTrigger();
    const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
    expect(focusables.length).toBeGreaterThan(3);

    focusables[focusables.length - 1].focus();
    fireEvent.keyDown(document, { key: "Tab" });

    expect(document.activeElement).toBe(focusables[0]);
  });

  it("returns focus to the control that opened it", () => {
    const { trigger, view } = openFromTrigger();

    view.rerender(<AuthRequiredModal open={false} onClose={onClose} />);

    expect(document.activeElement).toBe(trigger);
  });

  it("locks background scroll while open and releases it on close", () => {
    const { view } = openFromTrigger();
    expect(document.body.style.overflow).toBe("hidden");

    view.rerender(<AuthRequiredModal open={false} onClose={onClose} />);
    expect(document.body.style.overflow).toBe("");
  });
});
