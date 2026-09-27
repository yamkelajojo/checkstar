import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";

/**
 * MapContainer — the web map surface (Leaflet under the hood).
 *
 * Leaflet is mocked so the tests assert the *contract* the component owes the
 * rest of the system: which tiles it asks for, that markers survive arriving
 * before the map chunk loads, and that a tile outage is explained instead of
 * showing a black rectangle.
 */
const leaflet = vi.hoisted(() => {
  const state = {
    maps: [] as any[],
    tileLayers: [] as any[],
    markers: [] as any[],
    divIcons: [] as any[],
  };
  return { state };
});

vi.mock("leaflet", () => {
  const makeMap = (el: unknown, opts: unknown) => {
    const handlers: Record<string, (e?: unknown) => void> = {};
    const instance = {
      el,
      opts,
      handlers,
      on: (ev: string, cb: (e?: unknown) => void) => {
        handlers[ev] = cb;
        return instance;
      },
      whenReady: (cb: () => void) => {
        cb();
        return instance;
      },
      remove: vi.fn(),
      setView: vi.fn(),
      addLayer: vi.fn(),
      removeLayer: vi.fn(),
      fitBounds: vi.fn(),
      invalidateSize: vi.fn(),
    };
    leaflet.state.maps.push(instance);
    return instance;
  };

  const makeTileLayer = (url: string, options: unknown) => {
    const handlers: Record<string, () => void> = {};
    const layer = {
      url,
      options,
      on: (ev: string, cb: () => void) => {
        handlers[ev] = cb;
        return layer;
      },
      addTo: vi.fn(),
      fire: (ev: string) => handlers[ev]?.(),
    };
    leaflet.state.tileLayers.push(layer);
    return layer;
  };

  return {
    map: makeMap,
    tileLayer: makeTileLayer,
    marker: (position: unknown, options: unknown) => {
      // Leaflet's marker API is chainable: addTo/bindPopup/bindTooltip all
      // return the marker, and MapContainer relies on that.
      const marker: any = { position, options };
      marker.addTo = vi.fn(() => marker);
      marker.bindPopup = vi.fn(() => marker);
      marker.bindTooltip = vi.fn(() => marker);
      leaflet.state.markers.push(marker);
      return marker;
    },
    divIcon: (opts: unknown) => {
      leaflet.state.divIcons.push(opts);
      return opts;
    },
    latLngBounds: (pts: unknown) => ({ pts }),
  };
});

import MapContainer from "../MapContainer";

beforeEach(() => {
  leaflet.state.maps = [];
  leaflet.state.tileLayers = [];
  leaflet.state.markers = [];
  leaflet.state.divIcons = [];
  vi.unstubAllEnvs();
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("MapContainer tile provider", () => {
  it("requests OpenStreetMap tiles by default", async () => {
    render(<MapContainer markers={[{ position: [-29.8587, 31.0218] }]} />);

    await waitFor(() => expect(leaflet.state.tileLayers).toHaveLength(1));
    expect(leaflet.state.tileLayers[0].url).toBe(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    );
    expect(leaflet.state.tileLayers[0].options.attribution).toMatch(
      /OpenStreetMap/,
    );
    expect(leaflet.state.tileLayers[0].options.maxZoom).toBe(18);
  });

  it("requests Mapbox tiles when NEXT_PUBLIC_MAPBOX_TOKEN is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "pk.live.abc");

    render(<MapContainer markers={[{ position: [-29.8587, 31.0218] }]} />);

    await waitFor(() => expect(leaflet.state.tileLayers).toHaveLength(1));
    const layer = leaflet.state.tileLayers[0];
    expect(layer.url).toContain("api.mapbox.com");
    expect(layer.url).toContain("access_token=pk.live.abc");
    // 512px tiles need both hints or Leaflet mis-scales every zoom level.
    expect(layer.options.tileSize).toBe(512);
    expect(layer.options.zoomOffset).toBe(-1);
    expect(layer.options.attribution).toMatch(/Mapbox/);
    expect(layer.options.maxZoom).toBe(19);
    // The documented Styles Static Tiles API. The legacy v4 raster endpoint
    // (mapbox.streets) is deprecated and answers 410 Gone — a token holder
    // would see an empty map, so this is asserted, not assumed.
    expect(layer.url).toContain("/styles/v1/");
    expect(layer.url).not.toContain("/v4/");
  });
});

describe("MapContainer resilience", () => {
  it("explains a tile outage instead of showing a black rectangle", async () => {
    render(<MapContainer />);

    await waitFor(() => expect(leaflet.state.tileLayers).toHaveLength(1));
    const layer = leaflet.state.tileLayers[0];

    // Three consecutive failures with zero successes = outage.
    layer.fire("tileerror");
    layer.fire("tileerror");
    expect(screen.queryByRole("status")).toBeNull();
    layer.fire("tileerror");

    expect(await screen.findByRole("status")).toHaveTextContent(
      /Map unavailable right now/,
    );
  });

  it("recovers the notice once a tile eventually loads", async () => {
    render(<MapContainer />);

    await waitFor(() => expect(leaflet.state.tileLayers).toHaveLength(1));
    const layer = leaflet.state.tileLayers[0];
    layer.fire("tileerror");
    layer.fire("tileerror");
    layer.fire("tileerror");
    expect(await screen.findByRole("status")).toBeTruthy();

    layer.fire("tileload");
    await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
  });

  it("does not declare an outage when some tiles succeed", async () => {
    render(<MapContainer />);

    await waitFor(() => expect(leaflet.state.tileLayers).toHaveLength(1));
    const layer = leaflet.state.tileLayers[0];
    layer.fire("tileload");
    layer.fire("tileerror");
    layer.fire("tileerror");
    layer.fire("tileerror");

    // A single loaded tile proves connectivity; transient errors are normal.
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByRole("status")).toBeNull();
  });
});

describe("MapContainer markers", () => {
  it("adds markers with the branded Checkstar pin, not Leaflet's blue default", async () => {
    render(
      <MapContainer
        markers={[
          { position: [-29.8587, 31.0218], popup: "Checkstar Durban Central" },
        ]}
      />,
    );

    await waitFor(() => expect(leaflet.state.markers).toHaveLength(1));
    expect(leaflet.state.markers[0].position).toEqual([-29.8587, 31.0218]);
    // The pin is a divIcon carrying the brand SVG.
    expect(leaflet.state.divIcons.length).toBeGreaterThan(0);
    expect(leaflet.state.divIcons[0].html).toContain("EB6522");
    expect(leaflet.state.markers[0].bindPopup).toHaveBeenCalledWith(
      "Checkstar Durban Central",
    );
  });

  it("still places markers that arrive after mount (data races the map init)", async () => {
    const { rerender } = render(<MapContainer markers={[]} />);

    await waitFor(() => expect(leaflet.state.maps).toHaveLength(1));

    rerender(<MapContainer markers={[{ position: [-29.835, 30.972] }]} />);

    await waitFor(() => expect(leaflet.state.markers).toHaveLength(1));
    expect(leaflet.state.markers[0].position).toEqual([-29.835, 30.972]);
  });

  it("replaces markers instead of stacking them when the list changes", async () => {
    const { rerender } = render(
      <MapContainer markers={[{ position: [-29.835, 30.972] }]} />,
    );
    await waitFor(() => expect(leaflet.state.markers).toHaveLength(1));

    rerender(
      <MapContainer
        markers={[
          { position: [-29.84, 30.99] },
          { position: [-29.86, 31.0 ] },
        ]}
      />,
    );

    await waitFor(() => expect(leaflet.state.markers).toHaveLength(3));
    // The stale marker is removed from the map instance.
    expect(leaflet.state.maps[0].removeLayer).toHaveBeenCalledTimes(1);
  });
});
