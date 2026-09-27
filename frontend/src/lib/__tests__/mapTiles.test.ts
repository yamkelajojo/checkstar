import { describe, it, expect } from "vitest";
import { getTileProvider, OSM_TILE_URL, OSM_ATTRIBUTION } from "../mapTiles";

/**
 * Tile provider selection (V-model: this spec was written before the module
 * existed — red first, then the implementation).
 *
 * Decision record: docs/adr/0003-map-providers.md.
 *  - OpenStreetMap raster via Leaflet is the zero-credential default: the
 *    prototype must render maps on a fresh clone with no accounts or keys.
 *  - Mapbox is a *progressive enhancement*: when NEXT_PUBLIC_MAPBOX_TOKEN is
 *    present we switch to Mapbox raster tiles (same Leaflet pipeline, no new
 *    dependency), which buys vector-quality raster tiles, consistent styling
 *    and Mapbox's tile CDN.
 *  - Mobile deliberately stays on react-native-maps: @rnmapbox/maps cannot run
 *    in Expo Go (custom native code), and the fleet is pinned to Expo Go 57.
 */
describe("getTileProvider", () => {
  it("defaults to OpenStreetMap when no token is configured", () => {
    const provider = getTileProvider({});

    expect(provider.id).toBe("osm");
    expect(provider.url).toBe(OSM_TILE_URL);
    expect(provider.attribution).toBe(OSM_ATTRIBUTION);
    expect(provider.maxZoom).toBe(18);
    expect(provider.label).toMatch(/OpenStreetMap/i);
  });

  it("treats an absent env the same as an empty one", () => {
    expect(getTileProvider(undefined).id).toBe("osm");
    expect(getTileProvider().id).toBe("osm");
  });

  it("rejects whitespace-only tokens (a pasted blank .env line)", () => {
    expect(getTileProvider({ NEXT_PUBLIC_MAPBOX_TOKEN: "   " }).id).toBe("osm");
    expect(getTileProvider({ NEXT_PUBLIC_MAPBOX_TOKEN: "" }).id).toBe("osm");
  });

  it("switches to Mapbox raster tiles when a token is present", () => {
    const provider = getTileProvider({ NEXT_PUBLIC_MAPBOX_TOKEN: "pk.test.123" });

    expect(provider.id).toBe("mapbox");
    expect(provider.url).toContain("api.mapbox.com");
    expect(provider.url).toContain("pk.test.123");
    expect(provider.url).toContain("{z}");
    expect(provider.url).toContain("{x}");
    expect(provider.url).toContain("{y}");
    // Mapbox serves 512px raster tiles; Leaflet needs both hints or the map
    // renders at the wrong scale.
    expect(provider.tileSize).toBe(512);
    expect(provider.zoomOffset).toBe(-1);
    expect(provider.attribution).toMatch(/Mapbox/i);
    expect(provider.attribution).toMatch(/OpenStreetMap/i);
  });

  it("trims the token before embedding it in the tile URL", () => {
    const provider = getTileProvider({ NEXT_PUBLIC_MAPBOX_TOKEN: "  pk.trimmed  " });

    expect(provider.id).toBe("mapbox");
    expect(provider.url).toContain("access_token=pk.trimmed");
    expect(provider.url).not.toContain("pk.trimmed%20");
  });

  it("never leaks the token into the attribution string", () => {
    const provider = getTileProvider({ NEXT_PUBLIC_MAPBOX_TOKEN: "pk.secret" });

    expect(provider.attribution).not.toContain("pk.secret");
  });
});
