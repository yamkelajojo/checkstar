import { describe, it, expect } from "vitest";
import { decodePolyline, computeBounds, type LatLng } from "../polyline";

/**
 * Route geometry helpers.
 *
 * `computeBounds` is fed coordinates straight off the API, where Laravel's
 * `decimal:7` cast serialises them as strings ("-29.8350000") even though
 * `LatLng` is typed numeric. Compared as strings, bounds come out
 * lexicographic — wrong for mixed signs and wrong length — so the helper
 * coerces and drops anything non-numeric before it reaches Leaflet.
 */

// Canonical example from the Google encoded-polyline documentation.
const ENCODED = "_p~iF~ps|U_ulLnnqC_mqNvxq`@";

describe("decodePolyline", () => {
  it("decodes the documented Google example", () => {
    const points = decodePolyline(ENCODED);

    expect(points).toHaveLength(3);
    expect(points[0].lat).toBeCloseTo(38.5, 5);
    expect(points[0].lng).toBeCloseTo(-120.2, 5);
    expect(points[2].lat).toBeCloseTo(43.252, 4);
    expect(points[2].lng).toBeCloseTo(-126.453, 4);
  });

  it("always yields finite numbers", () => {
    for (const p of decodePolyline(ENCODED)) {
      expect(typeof p.lat).toBe("number");
      expect(typeof p.lng).toBe("number");
      expect(Number.isFinite(p.lat)).toBe(true);
      expect(Number.isFinite(p.lng)).toBe(true);
    }
  });

  it("returns an empty route for an empty geometry", () => {
    expect(decodePolyline("")).toEqual([]);
  });
});

describe("computeBounds", () => {
  it("returns null when there is nothing to bound", () => {
    expect(computeBounds([])).toBeNull();
  });

  it("bounds numeric coordinates", () => {
    const bounds = computeBounds([
      { lat: -29.835, lng: 30.972 },
      { lat: -29.8167, lng: 30.8833 },
    ]);

    expect(bounds).toEqual([
      [-29.835, 30.8833],
      [-29.8167, 30.972],
    ]);
  });

  it("bounds decimal-string coordinates numerically, not lexicographically", () => {
    // The real wire shape from GET /api/rider/active-deliveries.
    const fromApi = [
      { lat: "-29.8350000", lng: "30.9720000" },
      { lat: "-29.8167000", lng: "30.8833000" },
    ] as unknown as LatLng[];

    const bounds = computeBounds(fromApi);

    expect(bounds).not.toBeNull();
    for (const corner of bounds!) {
      expect(typeof corner[0]).toBe("number");
      expect(typeof corner[1]).toBe("number");
      expect(Number.isFinite(corner[0])).toBe(true);
      expect(Number.isFinite(corner[1])).toBe(true);
    }
    expect(bounds![0]).toEqual([-29.835, 30.8833]);
    expect(bounds![1]).toEqual([-29.8167, 30.972]);
  });

  it("orders mixed-sign longitudes correctly", () => {
    // Lexicographic comparison would put "9.5" after "30.5"; numeric does not.
    const bounds = computeBounds([
      { lat: "-29.9", lng: "-30.5" },
      { lat: "-29.8", lng: "9.5" },
    ] as unknown as LatLng[]);

    expect(bounds![0][1]).toBe(-30.5);
    expect(bounds![1][1]).toBe(9.5);
  });

  it("ignores points that are not coordinates at all", () => {
    expect(
      computeBounds([
        { lat: "not-a-coordinate", lng: "30.972" },
        { lat: null, lng: null },
      ] as unknown as LatLng[]),
    ).toBeNull();

    const partial = computeBounds([
      { lat: "garbage", lng: "garbage" },
      { lat: "-29.835", lng: "30.972" },
    ] as unknown as LatLng[]);

    expect(partial).toEqual([
      [-29.835, 30.972],
      [-29.835, 30.972],
    ]);
  });
});
