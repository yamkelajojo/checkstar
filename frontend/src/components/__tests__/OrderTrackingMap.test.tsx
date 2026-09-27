import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";

/**
 * OrderTrackingMap — the screen a customer stares at while dinner is in transit.
 *
 * Covered here because it is the surface where three systems meet: the rider
 * location poll (battery/network conscious), the route geometry decoder, and
 * Leaflet. Every one of those can fail on its own, and each failure has to
 * degrade into copy a human can act on rather than an empty grey box.
 */

// --- motion: render the real DOM, drop the animation layer -----------------
vi.mock("motion/react", () => {
  // Cache one component per tag: a fresh forwardRef on every property access
  // would remount the tree each render and loop the effects.
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

// --- data layer ------------------------------------------------------------
const query = vi.hoisted(() => ({
  riderLocation: null as any,
  geometry: null as any,
  riderPollArgs: [] as Array<[unknown, unknown]>,
  geometryPollArgs: [] as Array<unknown[]>,
}));

vi.mock("@/lib/query", () => ({
  useOrderRiderLocation: (orderId: unknown, enabled: unknown) => {
    query.riderPollArgs.push([orderId, enabled]);
    return { data: query.riderLocation };
  },
  useRouteGeometry: (...args: unknown[]) => {
    query.geometryPollArgs.push(args);
    return { data: query.geometry };
  },
}));

vi.mock("@/lib/polyline", () => ({
  decodePolyline: (encoded: string) => {
    if (encoded === "BAD") throw new Error("malformed polyline");
    return [
      { lat: -29.85, lng: 31.01 },
      { lat: -29.86, lng: 31.02 },
      { lat: -29.87, lng: 31.03 },
    ];
  },
}));

// --- map double: records exactly what the tracker asks the map to draw ------
const map = vi.hoisted(() => ({ props: null as any }));

vi.mock("@/components/MapContainer", () => ({
  default: (props: any) => {
    map.props = props;
    // The real MapContainer hands its Leaflet instance back through
    // onMapReady once the chunk has loaded; the polyline effect waits for it.
    React.useEffect(() => {
      props.onMapReady?.({
        __isMapDouble: true,
        removeLayer: () => {},
        fitBounds: () => {},
      });
    }, [props.onMapReady]);
    return React.createElement("div", { "data-testid": "map" });
  },
}));

// --- leaflet double: records the polyline the tracker draws -----------------
const leaflet = vi.hoisted(() => ({ polylines: [] as any[] }));

vi.mock("leaflet", () => ({
  polyline: (latlngs: unknown, options: unknown) => {
    const layer = { latlngs, options, addTo: () => layer, remove: () => {} };
    leaflet.polylines.push(layer);
    return layer;
  },
}));

import OrderTrackingMap from "../OrderTrackingMap";

const COORDS = {
  storeLat: -29.8587,
  storeLng: 31.0218,
  deliveryLat: -29.8811,
  deliveryLng: 30.9911,
};

const baseProps = {
  orderId: 42,
  storeName: "Checkstar Durban Central",
  deliveryAddress: "12 Beachwood Rd, Umhlanga",
  ...COORDS,
};

const iso = (msAgo: number) => new Date(Date.now() - msAgo).toISOString();

beforeEach(() => {
  query.riderLocation = null;
  query.geometry = null;
  query.riderPollArgs = [];
  query.geometryPollArgs = [];
  map.props = null;
  leaflet.polylines = [];
  vi.useRealTimers();
});

afterEach(() => cleanup());

describe("OrderTrackingMap — degraded states", () => {
  it("explains a missing-coordinate order instead of rendering an empty map", () => {
    render(
      <OrderTrackingMap
        orderId={42}
        storeName="Checkstar Durban Central"
        deliveryAddress="12 Beachwood Rd, Umhlanga"
      />,
    );

    expect(screen.getByText("Map unavailable")).toBeTruthy();
    expect(screen.getByText("Delivery coordinates not set")).toBeTruthy();
    // The address is still shown: the customer keeps the information they need.
    expect(screen.getByText("12 Beachwood Rd, Umhlanga")).toBeTruthy();
    expect(screen.queryByTestId("map")).toBeNull();
  });

  it("does not poll for rider location when the order is already delivered", () => {
    render(<OrderTrackingMap {...baseProps} orderStatus="delivered" />);

    expect(query.riderPollArgs[0][1]).toBe(false);
  });

  it("polls while the order is still moving", () => {
    render(<OrderTrackingMap {...baseProps} orderStatus="out_for_delivery" />);
    expect(query.riderPollArgs[0][1]).toBe(true);
  });
});

describe("OrderTrackingMap — rider state", () => {
  it("shows 'waiting for rider' copy while the order is being prepared", () => {
    render(<OrderTrackingMap {...baseProps} orderStatus="confirmed" />);

    expect(screen.getByText("Preparing Order")).toBeTruthy();
    expect(screen.getByText("Waiting for rider")).toBeTruthy();
    expect(
      screen.getByText("Preparing your order — a rider will be assigned shortly"),
    ).toBeTruthy();
    // No rider yet: the info row keeps an explicit dash, not a blank cell.
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("flips to LIVE with the rider's name once a fresh ping arrives", async () => {
    query.riderLocation = {
      latitude: -29.87,
      longitude: 31.005,
      recorded_at: iso(5_000),
    };

    render(
      <OrderTrackingMap
        {...baseProps}
        orderStatus="out_for_delivery"
        riderName="Sipho"
      />,
    );

    expect(screen.getByText("Live Tracking")).toBeTruthy();
    expect(screen.getByText("LIVE")).toBeTruthy();
    expect(screen.queryByText("STALE")).toBeNull();
    expect(screen.getByText("Sipho")).toBeTruthy();

    await waitFor(() => expect(map.props).toBeTruthy());
    const riderMarker = map.props.markers.find((m: any) =>
      String(m.popup).startsWith("Sipho"),
    );
    expect(riderMarker.position).toEqual([-29.87, 31.005]);
    expect(riderMarker.popup).toContain("live");
  });

  it("marks a rider ping older than 90s as STALE rather than pretending it is live", async () => {
    query.riderLocation = {
      latitude: -29.87,
      longitude: 31.005,
      recorded_at: iso(120_000),
    };

    render(
      <OrderTrackingMap {...baseProps} orderStatus="out_for_delivery" riderName="Sipho" />,
    );

    expect(screen.getByText("STALE")).toBeTruthy();
    expect(screen.queryByText("LIVE")).toBeNull();

    await waitFor(() => expect(map.props).toBeTruthy());
    const riderMarker = map.props.markers.find((m: any) =>
      String(m.popup).startsWith("Sipho"),
    );
    expect(riderMarker.popup).toContain("stale");
  });
});

describe("OrderTrackingMap — what it asks the map to draw", () => {
  it("pins store, delivery and rider, and fits the bounds around all of them", async () => {
    query.riderLocation = {
      latitude: -29.87,
      longitude: 31.005,
      recorded_at: iso(5_000),
    };
    query.geometry = "ENC";

    render(<OrderTrackingMap {...baseProps} orderStatus="out_for_delivery" />);

    await waitFor(() => expect(map.props).toBeTruthy());
    const positions = map.props.markers.map((m: any) => m.position);
    expect(positions).toContainEqual([-29.8587, 31.0218]);
    expect(positions).toContainEqual([-29.8811, 30.9911]);
    expect(positions).toContainEqual([-29.87, 31.005]);

    // Store marker carries the store name as its popup/tooltip.
    const store = map.props.markers.find(
      (m: any) => m.popup === "Checkstar Durban Central",
    );
    expect(store).toBeTruthy();

    // fitBounds includes the decoded route so the whole journey is on screen.
    expect(map.props.fitBounds).toContainEqual([-29.85, 31.01]);
    expect(map.props.fitBounds.length).toBeGreaterThan(3);
  });

  it("draws the decoded route in brand orange", async () => {
    query.geometry = "ENC";

    render(<OrderTrackingMap {...baseProps} orderStatus="out_for_delivery" />);

    await waitFor(() => expect(leaflet.polylines.length).toBeGreaterThan(0));
    const solid = leaflet.polylines.find((p) => p.options.weight === 4);
    expect(solid.options.color).toBe("#EB6522");
    expect(solid.latlngs.length).toBe(3);
  });

  it("falls back to a dashed straight line when the route cannot be decoded", async () => {
    query.geometry = "BAD";

    render(<OrderTrackingMap {...baseProps} orderStatus="out_for_delivery" />);

    await waitFor(() => expect(leaflet.polylines.length).toBeGreaterThan(0));
    const dashed = leaflet.polylines.find((p) => p.options.dashArray);
    expect(dashed).toBeTruthy();
    expect(dashed.options.color).toBe("#EB6522");
    expect(dashed.latlngs).toEqual([
      [-29.8587, 31.0218],
      [-29.8811, 30.9911],
    ]);
  });

  it("fits the bounds around just the two endpoints when there is no rider or route yet", async () => {
    render(
      <OrderTrackingMap
        orderId={7}
        storeName="Checkstar Umhlanga"
        storeLat={-29.8587}
        storeLng={31.0218}
        deliveryLat={-29.8811}
        deliveryLng={30.9911}
        orderStatus="pending"
      />,
    );

    await waitFor(() => expect(map.props).toBeTruthy());
    expect(map.props.fitBounds).toEqual([
      [-29.8587, 31.0218],
      [-29.8811, 30.9911],
    ]);
  });
});
