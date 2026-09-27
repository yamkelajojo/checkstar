import { describe, expect, it, vi } from "vitest";
import { useRef } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { useDialogFocus } from "../useDialogFocus";

/**
 * The dialog keyboard/focus contract, in one place.
 *
 * `admin/Modal.tsx` invented this behaviour and got it right (focus in, Tab
 * trap, focus restore, Escape, scroll lock). `CartDrawer.tsx` — a modal in
 * everything but name — only had Escape, so opening the cart left focus on the
 * page behind it and Tab walked straight out of the drawer. This suite pins the
 * shared hook both now use; Modal.test.tsx and CartDrawer.test.tsx pin the
 * components that wrap it.
 */

interface HarnessProps {
  open: boolean;
  onClose: () => void;
  /** Lock body scroll while open. A drawer that shares the page's scrollbar opts out. */
  lockScroll?: boolean;
  /** Render a dialog with no focusable controls at all. */
  empty?: boolean;
  /** Send initial focus somewhere other than the first control. */
  initialFocus?: "first" | "last";
}

function Harness({
  open,
  onClose,
  lockScroll = true,
  empty = false,
  initialFocus = "first",
}: HarnessProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef<HTMLButtonElement>(null);

  useDialogFocus({
    open,
    onClose,
    panelRef,
    lockScroll,
    initialFocusRef: initialFocus === "last" ? lastRef : undefined,
  });

  return (
    <div>
      <button type="button" data-testid="trigger">
        Open
      </button>
      {open ? (
        <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Test dialog" tabIndex={-1}>
          {empty ? (
            <p>No controls in here.</p>
          ) : (
            <>
              <button type="button" data-testid="first">
                First
              </button>
              <input data-testid="middle" aria-label="Middle" />
              <button type="button" ref={lastRef} data-testid="last">
                Last
              </button>
              <button type="button" disabled data-testid="disabled">
                Disabled
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

/** Mount closed, put focus on the trigger, then open — the real sequence. */
function openFromTrigger(props: Omit<HarnessProps, "open" | "onClose"> = {}) {
  const onClose = vi.fn();
  const view = render(<Harness open={false} onClose={onClose} {...props} />);
  const trigger = screen.getByTestId("trigger");
  trigger.focus();
  view.rerender(<Harness open onClose={onClose} {...props} />);
  return { onClose, trigger, view, close: () => view.rerender(<Harness open={false} onClose={onClose} {...props} />) };
}

describe("useDialogFocus", () => {
  it("moves focus into the dialog when it opens", () => {
    openFromTrigger();
    expect(screen.getByTestId("first")).toHaveFocus();
  });

  it("focuses the panel itself when the dialog holds no focusable controls", () => {
    openFromTrigger({ empty: true });
    expect(screen.getByRole("dialog")).toHaveFocus();
  });

  it("honours an explicit initial focus target", () => {
    openFromTrigger({ initialFocus: "last" });
    expect(screen.getByTestId("last")).toHaveFocus();
  });

  it("skips disabled controls when picking the first focusable", () => {
    openFromTrigger();
    expect(screen.getByTestId("disabled")).not.toHaveFocus();
  });

  it("closes on Escape", () => {
    const { onClose } = openFromTrigger();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("wraps Tab from the last control back to the first", () => {
    openFromTrigger();
    screen.getByTestId("last").focus();

    fireEvent.keyDown(document, { key: "Tab" });

    expect(screen.getByTestId("first")).toHaveFocus();
  });

  it("wraps Shift+Tab from the first control back to the last", () => {
    openFromTrigger();
    expect(screen.getByTestId("first")).toHaveFocus();

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });

    expect(screen.getByTestId("last")).toHaveFocus();
  });

  it("leaves Tab alone in the middle of the dialog so the browser keeps native order", () => {
    openFromTrigger();
    screen.getByTestId("middle").focus();

    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    document.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(screen.getByTestId("middle")).toHaveFocus();
  });

  it("ignores keys that are not Escape or Tab", () => {
    const { onClose } = openFromTrigger();
    fireEvent.keyDown(document, { key: "Enter" });
    fireEvent.keyDown(document, { key: "a" });
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId("first")).toHaveFocus();
  });

  it("returns focus to whatever had it before the dialog opened", () => {
    const { trigger, close } = openFromTrigger();
    expect(screen.getByTestId("first")).toHaveFocus();

    close();

    expect(trigger).toHaveFocus();
  });

  it("locks body scroll while open and puts back exactly what was there before", () => {
    document.body.style.overflow = "scroll";
    const { view } = openFromTrigger();
    expect(document.body.style.overflow).toBe("hidden");

    view.unmount();
    expect(document.body.style.overflow).toBe("scroll");
    document.body.style.overflow = "";
  });

  it("can be told not to lock scroll", () => {
    document.body.style.overflow = "";
    openFromTrigger({ lockScroll: false });
    expect(document.body.style.overflow).toBe("");
  });

  it("keeps focus where the user put it when the parent re-renders with a fresh onClose", () => {
    // Callers pass an inline arrow (`onClose={() => setCartOpen(false)}`). If the
    // effect depended on that identity it would re-run on every parent render
    // and yank focus back to the first control mid-typing.
    const view = render(<Harness open onClose={() => {}} />);
    screen.getByTestId("middle").focus();

    view.rerender(<Harness open onClose={() => {}} />);

    expect(screen.getByTestId("middle")).toHaveFocus();
  });

  it("calls the most recent onClose even when the parent swapped it after opening", () => {
    const first = vi.fn();
    const second = vi.fn();
    const view = render(<Harness open onClose={first} />);
    view.rerender(<Harness open onClose={second} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
  });

  it("does nothing at all while the dialog is closed", () => {
    const onClose = vi.fn();
    render(<Harness open={false} onClose={onClose} />);

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.keyDown(document, { key: "Tab" });

    expect(onClose).not.toHaveBeenCalled();
    expect(document.body.style.overflow).toBe("");
  });
});
