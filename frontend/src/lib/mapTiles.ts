/**
 * Map tile providers for the web client.
 *
 * Checkstar renders every map through Leaflet. The tile *source* is a
 * deployment concern, not a component concern, so it lives here and is chosen
 * once at module scope from the environment:
 *
 *  - No credentials (fresh clone, `npm run dev`, CI): OpenStreetMap raster
 *    tiles. The prototype must show real maps with zero accounts and zero keys.
 *  - `NEXT_PUBLIC_MAPBOX_TOKEN` present: Mapbox raster tiles through the same
 *    Leaflet pipeline (no new dependency, no build change). Mapbox buys a
 *    branded, consistent basemap and a commercial tile CDN — worth taking when
 *    a token exists, never worth requiring.
 *
 * Mobile deliberately does NOT use Mapbox: `@rnmapbox/maps` needs custom native
 * code, so it cannot run in Expo Go, and the fleet is pinned to Expo Go
 * (SDK 57). See docs/adr/0003-map-providers.md.
 */

/** OpenStreetMap raster tiles — the zero-credential default. */
export const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

/** Attribution OSM requires whenever its tiles are shown. */
export const OSM_ATTRIBUTION = "&copy; OpenStreetMap contributors";

export type TileProviderId = "osm" | "mapbox";

export interface TileProvider {
  /** Stable id, safe to log (never contains the token). */
  id: TileProviderId;
  /** Human-readable name for debug output and docs. */
  label: string;
  /** Leaflet TileLayer URL template. */
  url: string;
  /** Attribution string — must never contain credentials. */
  attribution: string;
  /** Highest zoom the provider serves. */
  maxZoom: number;
  /**
   * Mapbox serves 512px raster tiles; Leaflet needs both of these or every
   * zoom level renders at the wrong scale. Absent for 256px providers.
   */
  tileSize?: number;
  zoomOffset?: number;
}

interface TileEnv {
  NEXT_PUBLIC_MAPBOX_TOKEN?: string | null;
}

const OSM_PROVIDER: TileProvider = {
  id: "osm",
  label: "OpenStreetMap",
  url: OSM_TILE_URL,
  attribution: OSM_ATTRIBUTION,
  maxZoom: 18,
};

/**
 * Resolve the tile provider for an environment.
 *
 * Pure and injectable so it can be tested without mutating `process.env`, and
 * so a blank or whitespace-only token (a pasted `.env` line with nothing after
 * the `=`) falls back to OSM instead of requesting tiles that 401.
 */
export function getTileProvider(env: TileEnv = process.env): TileProvider {
  const token = (env?.NEXT_PUBLIC_MAPBOX_TOKEN ?? "").trim();
  if (!token) return OSM_PROVIDER;

  return {
    id: "mapbox",
    label: "Mapbox Streets",
    // v4 raster endpoint: the @2x variant returns 512px tiles, which Leaflet
    // addresses with tileSize 512 + zoomOffset -1.
    url: `https://api.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}@2x.png?access_token=${encodeURIComponent(token)}`,
    attribution: "&copy; Mapbox &copy; OpenStreetMap contributors",
    maxZoom: 18,
    tileSize: 512,
    zoomOffset: -1,
  };
}

/**
 * Options object for `L.tileLayer` derived from a provider — kept next to the
 * provider so no map surface can forget the 512px hints.
 */
export function tileLayerOptions(provider: TileProvider) {
  return {
    attribution: provider.attribution,
    maxZoom: provider.maxZoom,
    ...(provider.tileSize ? { tileSize: provider.tileSize } : {}),
    ...(provider.zoomOffset != null ? { zoomOffset: provider.zoomOffset } : {}),
  };
}
