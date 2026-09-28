import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";

/**
 * Select — Checkstar's styled, animated dropdown.
 *
 * Native <select> popups are painted by the OS (grey system menus that ignore
 * the design system). This component replaces them app-wide. The contract the
 * tests pin down:
 *   - trigger exposes combobox semantics and the selected label,
 *   - label htmlFor keeps working (a <button> is labelable),
 *   - mouse and keyboard can both open, navigate and commit a choice,
 *   - Escape and outside clicks dismiss without committing,
 *   - a value with no matching option shows the placeholder.
 */

vi.mock("motion/react", async () => (await import("@/test/motion-mock")).default);

import Select from "../select";

const VEHICLES = [
  { value: "bicycle", label: "Bicycle" },
  { value: "motorbike", label: "Motorbike" },
  { value: "car", label: "Car" },
  { value: "scooter", label: "E-Scooter", disabled: true },
] as const;

function renderSelect(props: Partial<React.ComponentProps<typeof Select>> = {}) {
  const onChange = vi.fn();
  const utils = render(
    <div>
      <label htmlFor="vehicle">Vehicle type</label>
      <Select
        id="vehicle"
        value="motorbike"
        onChange={onChange}
        options={VEHICLES}
        {...props}
      />
      <button type="button">Outside</button>
    </div>,
  );
  return { onChange, ...utils };
}

afterEach(() => cleanup());

describe("Select trigger", () => {
  it("shows the selected option's label with combobox semantics", () => {
    renderSelect();

    const trigger = screen.getByRole("combobox");
    expect(within(trigger).getByText("Motorbike")).toBeTruthy();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-haspopup")).toBe("listbox");
  });

  it("is reachable through its <label htmlFor> — buttons are labelable", () => {
    renderSelect();
    expect(screen.getByLabelText("Vehicle type").getAttribute("role")).toBe("combobox");
  });

  it("shows the placeholder when the value matches no option", () => {
    renderSelect({ value: "", placeholder: "Select a vehicle" });
    expect(within(screen.getByRole("combobox")).getByText("Select a vehicle")).toBeTruthy();
  });

  it("does not open when disabled", () => {
    renderSelect({ disabled: true });
    fireEvent.click(screen.getByRole("combobox"));
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});

describe("Select — mouse interaction", () => {
  it("opens on click and lists every option with selection marked", () => {
    renderSelect();

    fireEvent.click(screen.getByRole("combobox"));
    expect(screen.getByRole("combobox").getAttribute("aria-expanded")).toBe("true");

    const options = screen.getAllByRole("option");
    expect(options.map((o) => o.textContent?.replace(/\s+/g, " ").trim())).toEqual([
      "Bicycle",
      "Motorbike",
      "Car",
      "E-Scooter",
    ]);
    expect(options[1].getAttribute("aria-selected")).toBe("true");
    expect(options[0].getAttribute("aria-selected")).toBe("false");
    expect(options[3].getAttribute("aria-disabled")).toBe("true");
  });

  it("commits a clicked option, fires onChange and closes", () => {
    const onChange = vi.fn();
    function Stateful() {
      const [value, setValue] = React.useState("motorbike");
      return (
        <Select
          id="vehicle"
          value={value}
          onChange={(v) => {
            onChange(v);
            setValue(v);
          }}
          options={VEHICLES}
        />
      );
    }
    render(<Stateful />);

    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", { name: /car/i }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("car");
    expect(screen.queryByRole("listbox")).toBeNull();
    // Trigger now reflects the new value.
    expect(within(screen.getByRole("combobox")).getByText("Car")).toBeTruthy();
  });

  it("never fires onChange for a disabled option", () => {
    const { onChange } = renderSelect();

    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", { name: /e-scooter/i }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("listbox")).toBeTruthy(); // stays open
  });

  it("closes when clicking outside", () => {
    renderSelect();

    fireEvent.click(screen.getByRole("combobox"));
    expect(screen.getByRole("listbox")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});

describe("Select — keyboard interaction", () => {
  it("opens with Enter, moves with arrows, commits with Enter", () => {
    const { onChange } = renderSelect();
    const trigger = screen.getByRole("combobox");

    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(screen.getByRole("listbox")).toBeTruthy();

    // Selection starts on the current value (Motorbike, index 1).
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith("car");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("opens with ArrowDown and wraps movement to enabled options only", () => {
    const { onChange } = renderSelect();
    const trigger = screen.getByRole("combobox");

    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(screen.getByRole("listbox")).toBeTruthy();

    // From Motorbike(1): Down → Car(2), Down → skip disabled Scooter → Bicycle(0)
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith("bicycle");
  });

  it("Escape dismisses without committing", () => {
    const { onChange } = renderSelect();
    const trigger = screen.getByRole("combobox");

    fireEvent.keyDown(trigger, { key: "Enter" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "Escape" });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("Home and End jump to the first and last enabled options", () => {
    const { onChange } = renderSelect();
    const trigger = screen.getByRole("combobox");

    fireEvent.keyDown(trigger, { key: "Enter" });
    fireEvent.keyDown(trigger, { key: "End" });
    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("car"); // last enabled option

    fireEvent.keyDown(trigger, { key: "Enter" });
    fireEvent.keyDown(trigger, { key: "Home" });
    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("bicycle");
  });

  it("finds an option by typing its letters", () => {
    const { onChange } = renderSelect();
    const trigger = screen.getByRole("combobox");

    fireEvent.keyDown(trigger, { key: "Enter" });
    fireEvent.keyDown(trigger, { key: "c" });
    fireEvent.keyDown(trigger, { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith("car");
  });
});
