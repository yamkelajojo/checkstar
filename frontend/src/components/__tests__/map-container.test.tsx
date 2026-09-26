import { render, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import MapContainer from "@/components/MapContainer";

const invalidateSize = vi.fn();

vi.mock("leaflet", () => {
  const marker = {
    addTo: vi.fn(() => marker),
    bindPopup: vi.fn(),
    bindTooltip: vi.fn(),
  };

  const map = {
    invalidateSize,
    remove: vi.fn(),
    whenReady: (cb: () => void) => cb(),
    fitBounds: vi.fn(),
    removeLayer: vi.fn(),
  };

  const tileLayer = {
    on: vi.fn(),
    addTo: vi.fn(() => tileLayer),
  };

  const L = {
    map: vi.fn(() => map),
    tileLayer: vi.fn(() => tileLayer),
    marker: vi.fn(() => marker),
    divIcon: vi.fn(() => ({})),
  };

  return {
    __esModule: true,
    ...L,
    default: L,
  };
});

describe("MapContainer", () => {
  beforeEach(() => {
    invalidateSize.mockClear();
  });

  it("refreshes the map when the container size changes", async () => {
    let callback: ResizeObserverCallback | null = null;
    class MockResizeObserver {
      constructor(cb: ResizeObserverCallback) {
        callback = cb;
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    }

    vi.stubGlobal("ResizeObserver", MockResizeObserver as any);

    const { container } = render(
      <MapContainer center={[-29.825, 31.0]} zoom={12.5} />,
    );

    await waitFor(() => {
      expect(invalidateSize).toHaveBeenCalled();
    });

    expect(callback).not.toBeNull();

    act(() => {
      callback?.(
        [
          {
            target: container.firstElementChild,
          } as ResizeObserverEntry,
        ],
        new MockResizeObserver(() => {}),
      );
    });

    await waitFor(() => {
      expect(invalidateSize.mock.calls.length).toBeGreaterThan(1);
    });
  });
});
