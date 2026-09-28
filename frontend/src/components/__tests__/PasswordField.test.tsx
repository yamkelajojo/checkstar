import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";

/**
 * PasswordField — the shared password input with ONE reveal toggle.
 *
 * Windows Chromium paints its own "reveal" eye inside password inputs
 * (the `::-ms-reveal` pseudo-element), which historically doubled up with
 * Checkstar's custom button. These tests pin the contract that keeps the
 * field coherent:
 *   - exactly one toggle button, labelled "Show password"/"Hide password",
 *   - the button mirrors pressed state via aria-pressed,
 *   - toggling flips the input type between password and text,
 *   - label association survives so form tests and screen readers work.
 */

vi.mock("motion/react", async () => (await import("@/test/motion-mock")).default);

import PasswordField from "../PasswordField";

afterEach(() => cleanup());

describe("PasswordField", () => {
  it("renders a labelled password input with a single reveal toggle", () => {
    render(<PasswordField id="pw" label="Password" value="" onChange={() => {}} />);

    const input = screen.getByLabelText("Password");
    expect(input.getAttribute("type")).toBe("password");

    // Exactly one toggle — no second eye, ever.
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(1);
    expect(buttons[0].getAttribute("aria-label")).toBe("Show password");
    expect(buttons[0].getAttribute("aria-pressed")).toBe("false");
  });

  it("still exposes exactly one toggle after the visitor types", () => {
    render(<PasswordField id="pw" label="Password" value="hunter22" onChange={() => {}} />);
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("reveals the text on click and hides it again on the next click", () => {
    render(<PasswordField id="pw" label="Password" value="" onChange={() => {}} />);

    fireEvent.click(screen.getByLabelText("Show password"));
    expect(screen.getByLabelText("Password").getAttribute("type")).toBe("text");
    expect(screen.getByLabelText("Hide password").getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(screen.getByLabelText("Hide password"));
    expect(screen.getByLabelText("Password").getAttribute("type")).toBe("password");
    expect(screen.getByLabelText("Show password").getAttribute("aria-pressed")).toBe("false");
  });

  it("forwards typed characters through onChange", () => {
    const onChange = vi.fn();
    render(<PasswordField id="pw" label="Password" value="" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "abc" } });
    expect(onChange).toHaveBeenCalledWith("abc");
  });

  it("fires onEnter when Enter is pressed", () => {
    const onEnter = vi.fn();
    render(
      <PasswordField id="pw" label="Password" value="" onChange={() => {}} onEnter={onEnter} />,
    );

    fireEvent.keyDown(screen.getByLabelText("Password"), { key: "Enter" });
    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it("keeps the toggle mounted to the field rather than the input", () => {
    render(<PasswordField id="pw" label="Password" value="" onChange={() => {}} />);
    const toggle = screen.getByLabelText("Show password");
    expect(toggle.getAttribute("type")).toBe("button");
    // A native submit button inside a form would trigger submission.
  });
});
