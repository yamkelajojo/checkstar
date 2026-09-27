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
    expect(provider.tileSize).toBeUndefined();
    expect(provider.zoomOffset).toBeUndefined();
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
    // The documented Styles Static Tiles API — NOT the deprecated v4 raster
    // endpoint (`/v4/mapbox.streets/...`), which Mapbox retired: requests come
    // back 410 Gone / blank, i.e. a token holder would see an empty map.
    // Source: docs.mapbox.com "Use a Mapbox style in Leaflet".
    expect(provider.url).toBe(
      "https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=pk.test.123",
    );
    expect(provider.url).not.toContain("/v4/");
    expect(provider.url).toContain("{z}");
    expect(provider.url).toContain("{x}");
    expect(provider.url).toContain("{y}");
    // @2x returns 512px tiles; Leaflet needs both hints or every zoom level
    // renders at the wrong scale.
    expect(provider.tileSize).toBe(512);
    expect(provider.zoomOffset).toBe(-1);
    // Mapbox styles are served to zoom 19 (OSM raster stops at 18).
    expect(provider.maxZoom).toBe(19);
    expect(provider.attribution).toMatch(/Mapbox/i);
    expect(provider.attribution).toMatch(/OpenStreetMap/i);
  });

  it("lets an operator pick a different Mapbox style without touching code", () => {
    const provider = getTileProvider({
      NEXT_PUBLIC_MAPBOX_TOKEN: "pk.test.123",
      NEXT_PUBLIC_MAPBOX_STYLE: "mapbox/light-v11",
    });

    expect(provider.url).toContain("/styles/v1/mapbox/light-v11/tiles/256/");
    expect(provider.label).toMatch(/light-v11/i);
  });

  it("ignores a style value that is not a plain owner/style id", () => {
    // The style id is interpolated into a URL path: anything that could escape
    // the path (traversal, query strings, slashes beyond owner/style) falls
    // back to the default rather than building a surprising request.
    ["../../evil", "mapbox/streets-v12?x=1", "mapbox/streets-v12/extra", " ", "MAPBOX/STREETS-V12"].forEach(
      (style) => {
        const provider = getTileProvider({
          NEXT_PUBLIC_MAPBOX_TOKEN: "pk.test.123",
          NEXT_PUBLIC_MAPBOX_STYLE: style,
        });
        expect(provider.url).toContain("/styles/v1/mapbox/streets-v12/tiles/256/");
      },
    );
  });

  it("falls back to OpenStreetMap when a style is set but no token exists", () => {
    const provider = getTileProvider({ NEXT_PUBLIC_MAPBOX_STYLE: "mapbox/light-v11" });
    expect(provider.id).toBe("osm");
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
