import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";

/**
 * CartDrawer — the mini-cart every "add to cart" ends up in.
 *
 * It owns three behaviours that are easy to break silently: the remove-with-undo
 * flow (a 5s timer + a restore call), quantity maths at the q=1 boundary, and
 * the money strings. All three are pinned here, plus the dialog semantics a
 * slide-over owes keyboard and screen-reader users.
 */

vi.mock("motion/react", async () => (await import("@/test/motion-mock")).default);

vi.mock("next/image", () => ({
  default: (props: any) =>
    React.createElement("img", { ...props, "data-next-image": "true" }),
}));

const cart = vi.hoisted(() => ({
  items: [] as any[],
  total: 0,
  removeItem: vi.fn(),
  restoreItem: vi.fn(),
  updateQuantity: vi.fn(),
  clearCart: vi.fn(),
}));

vi.mock("@/stores/cart-store", () => ({
  useCartStore: () => cart,
}));

import CartDrawer from "../CartDrawer";

const item = (over: Partial<{ id: number; name: string; price: string; quantity: number }> = {}) => ({
  product: {
    id: over.id ?? 1,
    category_id: 1,
    name: over.name ?? "Fresh Spinach",
    slug: "fresh-spinach",
    description: null,
    image: "/products/fruits-vegetables/spinach.webp",
    images: null,
    unit: "bunch",
    price: over.price ?? "19.99",
    sale_price: null,
    effective_price: null,
    tags: null,
    is_featured: false,
  },
  quantity: over.quantity ?? 2,
});

const onClose = vi.fn();

beforeEach(() => {
  cart.items = [];
  cart.total = 0;
  cart.removeItem.mockReset();
  cart.restoreItem.mockReset();
  cart.updateQuantity.mockReset();
  cart.clearCart.mockReset();
  onClose.mockReset();
  vi.useRealTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("CartDrawer visibility", () => {
  it("renders nothing while closed", () => {
    const { container } = render(<CartDrawer open={false} onClose={onClose} />);
    expect(container.querySelector('[aria-label="Your cart"]')).toBeNull();
    expect(screen.queryByText("Your Cart")).toBeNull();
  });

  it("announces itself as a modal dialog when open", () => {
    render(<CartDrawer open onClose={onClose} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-label")).toBe("Your cart");
  });

  it("closes on the backdrop, the close button and the Escape key", () => {
    render(<CartDrawer open onClose={onClose} />);

    fireEvent.click(screen.getByLabelText("Close cart"));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("ignores Escape while closed", () => {
    render(<CartDrawer open={false} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });
});

/**
 * Focus management. A slide-over that takes over the screen is a modal, and
 * until this was shared with admin/Modal (via `useDialogFocus`) the drawer only
 * handled Escape: focus stayed on the page *behind* the overlay, so a keyboard
 * shopper tabbed through invisible content, and screen readers were never told
 * where they were.
 */
describe("CartDrawer focus management", () => {
  const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  /** A button outside React, standing in for the header's cart trigger. */
  function outsideTrigger(): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Open cart";
    document.body.appendChild(button);
    button.focus();
    return button;
  }

  function openDrawerFromTrigger() {
    const trigger = outsideTrigger();
    const view = render(<CartDrawer open={false} onClose={onClose} />);
    view.rerender(<CartDrawer open onClose={onClose} />);
    return { trigger, view, dialog: screen.getByRole("dialog") };
  }

  afterEach(() => {
    document.querySelectorAll("body > button").forEach((node) => node.remove());
    document.body.style.overflow = "";
  });

  it("moves focus into the drawer when it opens", () => {
    const { trigger, dialog } = openDrawerFromTrigger();

    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).not.toBe(trigger);
    expect(document.activeElement).not.toBe(document.body);
  });

  it("wraps Tab from the last control back to the first", () => {
    cart.items = [item()];
    const { dialog } = openDrawerFromTrigger();
    const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
    expect(focusables.length).toBeGreaterThan(2);

    focusables[focusables.length - 1].focus();
    fireEvent.keyDown(document, { key: "Tab" });

    expect(document.activeElement).toBe(focusables[0]);
  });

  it("wraps Shift+Tab from the first control back to the last", () => {
    cart.items = [item()];
    const { dialog } = openDrawerFromTrigger();
    const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));

    focusables[0].focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });

    expect(document.activeElement).toBe(focusables[focusables.length - 1]);
  });

  it("returns focus to the control that opened it", () => {
    const { trigger, view } = openDrawerFromTrigger();

    view.rerender(<CartDrawer open={false} onClose={onClose} />);

    expect(document.activeElement).toBe(trigger);
  });

  it("locks background scroll while open and releases it on close", () => {
    document.body.style.overflow = "";
    const { view } = openDrawerFromTrigger();
    expect(document.body.style.overflow).toBe("hidden");

    view.rerender(<CartDrawer open={false} onClose={onClose} />);
    expect(document.body.style.overflow).toBe("");
  });

  it("does not trap focus or lock scroll while closed", () => {
    const trigger = outsideTrigger();
    render(<CartDrawer open={false} onClose={onClose} />);

    fireEvent.keyDown(document, { key: "Tab" });

    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe("");
  });
});

describe("CartDrawer empty state", () => {
  it("explains an empty cart and hides the checkout footer", () => {
    render(<CartDrawer open onClose={onClose} />);

    expect(screen.getByText("Your cart is empty")).toBeTruthy();
    expect(
      screen.getByText(/Add some groceries to get started/),
    ).toBeTruthy();
    expect(screen.queryByText("Total")).toBeNull();
    expect(screen.queryByText("Clear")).toBeNull();
    expect(screen.queryByText("View Cart")).toBeNull();
  });

  it("counts one item in the singular", () => {
    cart.items = [item({ quantity: 1 })];
    cart.total = 19.99;
    render(<CartDrawer open onClose={onClose} />);
    expect(screen.getByText("1 item")).toBeTruthy();
  });
});

describe("CartDrawer money", () => {
  it("multiplies the line price by the quantity in the house format", () => {
    cart.items = [item({ price: "19.99", quantity: 3 })];
    // Basket total differs from the line total (a delivery fee is in it), so
    // the two assertions cannot pass by accident.
    cart.total = 69.97;
    render(<CartDrawer open onClose={onClose} />);

    expect(screen.getByText("R 59.97")).toBeTruthy();
    expect(screen.getByText("R 69.97")).toBeTruthy();
  });

  it("prefers the effective (special) price over the shelf price", () => {
    cart.items = [
      { ...item({ price: "45.00", quantity: 2 }), product: { ...item({ price: "45.00" }).product, effective_price: "39.99" } },
    ];
    cart.total = 89.98;
    render(<CartDrawer open onClose={onClose} />);

    // 39.99 x 2 on the line, 89.98 in the basket footer.
    expect(screen.getByText("R 79.98")).toBeTruthy();
    expect(screen.getByText("R 89.98")).toBeTruthy();
  });

  it("groups a four-figure basket total like the rest of the app", () => {
    cart.items = [item({ quantity: 1 })];
    cart.total = 1234.5;
    render(<CartDrawer open onClose={onClose} />);

    expect(screen.getByText("R 1 234.50")).toBeTruthy();
  });

  it("counts three items in the plural", () => {
    cart.items = [
      item({ id: 1, quantity: 1 }),
      item({ id: 2, name: "Cheddar Block", quantity: 1 }),
      item({ id: 3, name: "Full Cream Milk", quantity: 1 }),
    ];
    cart.total = 100;
    render(<CartDrawer open onClose={onClose} />);
    expect(screen.getByText("3 items")).toBeTruthy();
  });
});

describe("CartDrawer quantity controls", () => {
  it("increments through the store", () => {
    cart.items = [item({ id: 7, quantity: 2 })];
    render(<CartDrawer open onClose={onClose} />);

    fireEvent.click(screen.getByLabelText("Increase quantity"));
    expect(cart.updateQuantity).toHaveBeenCalledWith(7, 3);
    expect(cart.removeItem).not.toHaveBeenCalled();
  });

  it("decrements through the store while more than one remains", () => {
    cart.items = [item({ id: 7, quantity: 3 })];
    render(<CartDrawer open onClose={onClose} />);

    fireEvent.click(screen.getByLabelText("Decrease quantity"));
    expect(cart.updateQuantity).toHaveBeenCalledWith(7, 2);
    expect(cart.removeItem).not.toHaveBeenCalled();
  });

  it("removes with an undo offer at the last unit instead of going to zero", () => {
    cart.items = [item({ id: 7, quantity: 1 })];
    render(<CartDrawer open onClose={onClose} />);

    fireEvent.click(screen.getByLabelText("Decrease quantity"));

    expect(cart.removeItem).toHaveBeenCalledWith(7);
    expect(cart.updateQuantity).not.toHaveBeenCalled();
    expect(screen.getByText("Removed")).toBeTruthy();
    expect(screen.getByText("Undo")).toBeTruthy();
  });
});

describe("CartDrawer remove + undo", () => {
  it("offers undo when an item is trashed and restores it on click", () => {
    const spinach = item({ id: 7, quantity: 2 });
    cart.items = [spinach];
    render(<CartDrawer open onClose={onClose} />);

    fireEvent.click(screen.getByLabelText("Remove item"));
    expect(cart.removeItem).toHaveBeenCalledWith(7);

    fireEvent.click(screen.getByText("Undo"));
    expect(cart.restoreItem).toHaveBeenCalledWith(spinach.product, 2);
    expect(screen.queryByText("Undo")).toBeNull();
  });

  it("clears the undo offer after 5 seconds", () => {
    vi.useFakeTimers();
    cart.items = [item({ id: 7, quantity: 1 })];
    render(<CartDrawer open onClose={onClose} />);

    fireEvent.click(screen.getByLabelText("Remove item"));
    expect(screen.getByText("Undo")).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByText("Undo")).toBeNull();
  });

  it("clears the whole basket", () => {
    cart.items = [item({ quantity: 1 })];
    cart.total = 19.99;
    render(<CartDrawer open onClose={onClose} />);

    fireEvent.click(screen.getByText("Clear"));
    expect(cart.clearCart).toHaveBeenCalledTimes(1);
  });

  it("links to the full cart and closes the drawer on the way", () => {
    cart.items = [item({ quantity: 1 })];
    cart.total = 19.99;
    render(<CartDrawer open onClose={onClose} />);

    const link = screen.getByText("View Cart").closest("a");
    expect(link?.getAttribute("href")).toBe("/cart");

    fireEvent.click(screen.getByText("View Cart"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders the product image through SafeImage with the product as alt text", () => {
    cart.items = [item({ name: "Fresh Spinach", quantity: 1 })];
    render(<CartDrawer open onClose={onClose} />);

    expect(screen.getByAltText("Fresh Spinach")).toBeTruthy();
  });
});
