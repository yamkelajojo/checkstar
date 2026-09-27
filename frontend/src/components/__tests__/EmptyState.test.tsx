import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { Package, Heart } from "lucide-react";

// Callers pass a real next/link; the double keeps the href assertable.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: any) =>
    React.createElement("a", { href, ...rest }, children),
}));

import Link from "next/link";
import EmptyState from "../EmptyState";
import ErrorNotice from "../ErrorNotice";

/**
 * The storefront's empty and error states.
 *
 * The admin kit already had one `EmptyState` and one `ErrorState`, and mobile
 * has a shared `EmptyState` with a documented shape (bare glyph → title →
 * caption → optional action). The storefront had neither: "No orders yet",
 * "No favorites yet", "Nothing here yet — check back soon.", "No products in
 * this sale yet" and a family of `bg-accent/10 border-accent/30` error divs,
 * each with its own icon size, padding, weight and button label. Same product,
 * four dialects — and an empty state is the first screen a new customer sees.
 *
 * The contract these two components now own:
 *   title   = what is missing / what failed
 *   caption = what to do next / why, if the API said
 *   action  = the way forward (one, not three)
 */

describe("EmptyState", () => {
  it("names what is missing and says what to do next", () => {
    render(
      <EmptyState
        icon={Package}
        title="No orders yet"
        caption="Place your first order and it will show up here."
      />,
    );

    expect(
      screen.getByRole("heading", { name: "No orders yet" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Place your first order and it will show up here."),
    ).toBeInTheDocument();
  });

  it("draws the icon it is given", () => {
    const { container } = render(<EmptyState icon={Heart} title="No favorites yet" />);
    expect(container.querySelector("svg.lucide-heart")).not.toBeNull();
  });

  it("works without an icon (some slots already have one)", () => {
    const { container } = render(<EmptyState title="Nothing here yet" />);
    expect(container.querySelector("svg")).toBeNull();
    expect(screen.getByRole("heading", { name: "Nothing here yet" })).toBeInTheDocument();
  });

  it("renders the caller's action, so the way forward keeps its own styling", () => {
    render(
      <EmptyState
        title="No favorites yet"
        caption="Tap the heart on any product to save it."
        action={<Link href="/products">Browse products</Link>}
      />,
    );

    expect(screen.getByRole("link", { name: "Browse products" })).toHaveAttribute(
      "href",
      "/products",
    );
  });

  it("offers no action when there is nothing to do", () => {
    render(<EmptyState title="No products in this sale yet" caption="Check back soon." />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("has a compact form for narrow slots like carousels", () => {
    const { container, rerender } = render(<EmptyState title="Nothing here yet" />);
    const tall = (container.firstElementChild as HTMLElement).className;

    rerender(<EmptyState title="Nothing here yet" compact />);
    const short = (container.firstElementChild as HTMLElement).className;

    expect(tall).toMatch(/py-20/);
    expect(short).toMatch(/py-10/);
  });

  it("is the same shape on every surface: one heading, one caption, one action", () => {
    render(
      <EmptyState
        icon={Package}
        title="No orders yet"
        caption="Place your first order."
        action={<button type="button">Start shopping</button>}
      />,
    );

    expect(screen.getAllByRole("heading")).toHaveLength(1);
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });
});

describe("ErrorNotice", () => {
  it("announces itself to assistive technology as an alert", () => {
    render(<ErrorNotice title="We couldn't load your orders" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("says what failed, and why when the API gave a reason", () => {
    render(
      <ErrorNotice title="We couldn't load your orders" message="Network timeout" />,
    );

    expect(screen.getByText("We couldn't load your orders")).toBeInTheDocument();
    expect(screen.getByText("Network timeout")).toBeInTheDocument();
  });

  it("offers a retry that actually retries", () => {
    const onRetry = vi.fn();
    render(<ErrorNotice title="We couldn't load your orders" onRetry={onRetry} />);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows no retry button when there is nothing to retry", () => {
    render(<ErrorNotice title="This link is no longer valid" />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("disables the retry while a retry is in flight, and says so", () => {
    const onRetry = vi.fn();
    render(<ErrorNotice title="We couldn't load your orders" onRetry={onRetry} retrying />);

    const button = screen.getByRole("button", { name: /Trying again/ });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it("falls back to honest house wording when the caller knows nothing", () => {
    render(<ErrorNotice />);
    // Not "Something went wrong." on its own: say what the person can do.
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/try again/i)).toBeInTheDocument();
  });

  it("accepts an Error object, so callers can pass the query error straight in", () => {
    render(<ErrorNotice error={new Error("Failed to fetch")} />);
    expect(screen.getByText("Failed to fetch")).toBeInTheDocument();
  });

  it("prefers an explicit message over the error object", () => {
    render(<ErrorNotice error={new Error("Failed to fetch")} message="The store is offline" />);
    expect(screen.getByText("The store is offline")).toBeInTheDocument();
    expect(screen.queryByText("Failed to fetch")).toBeNull();
  });

  it("ignores an error object with no usable message", () => {
    render(<ErrorNotice error={new Error("")} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it("has a compact form for inline slots", () => {
    const { container, rerender } = render(<ErrorNotice title="We couldn't load your orders" />);
    const block = (container.firstElementChild as HTMLElement).className;

    rerender(<ErrorNotice title="We couldn't load your orders" compact />);
    const inline = (container.firstElementChild as HTMLElement).className;

    expect(block).toMatch(/p-6/);
    expect(inline).toMatch(/px-4/);
  });
});
