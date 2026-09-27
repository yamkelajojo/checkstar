/**
 * Map tile providers for the web client.
 *
 * Checkstar renders every map through Leaflet. The tile *source* is a
 * deployment concern, not a component concern, so it lives here and is chosen
 * once at module scope from the environment:
 *
 *  - No credentials (fresh clone, `npm run dev`, CI): OpenStreetMap raster
 *    tiles. The prototype must show real maps with zero accounts and zero keys.
 *  - `NEXT_PUBLIC_MAPBOX_TOKEN` present: Mapbox raster tiles from the Styles
 *    Static Tiles API through the same Leaflet pipeline (no new dependency, no
 *    build change). `NEXT_PUBLIC_MAPBOX_STYLE` optionally picks the style
 *    (default `mapbox/streets-v12`). Mapbox buys a branded, consistent basemap
 *    and a commercial tile CDN — worth taking when a token exists, never worth
 *    requiring.
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
  /** Mapbox style id ("mapbox/light-v11"). Optional; defaults to streets. */
  NEXT_PUBLIC_MAPBOX_STYLE?: string | null;
}

/**
 * The documented Styles Static Tiles API. The legacy v4 raster endpoint
 * (`api.mapbox.com/v4/mapbox.streets/...`) is deprecated by Mapbox and answers
 * 410 Gone — using it would hand a paying operator an empty map, so the URL
 * shape is asserted in tests rather than left to memory.
 * Source: docs.mapbox.com — "Use a Mapbox style in Leaflet".
 */
const MAPBOX_TILES_BASE = "https://api.mapbox.com/styles/v1";

const DEFAULT_MAPBOX_STYLE = "mapbox/streets-v12";

/**
 * A style id is exactly `owner/style`, lowercase: it is interpolated into a URL
 * path, so anything else (traversal, query strings, extra segments) is refused
 * and the default is used instead.
 */
const STYLE_ID_PATTERN = /^[a-z0-9][a-z0-9_-]*\/[a-z0-9][a-z0-9_-]*$/;

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
export function getTileProvider(
  // The literal `process.env.NEXT_PUBLIC_*` expressions matter: Next.js inlines
  // those values at build time by textual replacement, so passing the whole
  // `process.env` object would ship nothing to the browser.
  env: TileEnv = {
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    NEXT_PUBLIC_MAPBOX_STYLE: process.env.NEXT_PUBLIC_MAPBOX_STYLE,
  },
): TileProvider {
  const token = (env?.NEXT_PUBLIC_MAPBOX_TOKEN ?? "").trim();
  // A style without a token does nothing, so it never leaves the OSM default.
  if (!token) return OSM_PROVIDER;

  const requestedStyle = (env?.NEXT_PUBLIC_MAPBOX_STYLE ?? "").trim();
  const style = STYLE_ID_PATTERN.test(requestedStyle)
    ? requestedStyle
    : DEFAULT_MAPBOX_STYLE;

  return {
    id: "mapbox",
    label: `Mapbox ${style}`,
    // `/tiles/256/...@2x` returns 512px raster tiles, which Leaflet addresses
    // with tileSize 512 + zoomOffset -1. Mapbox styles serve up to zoom 19.
    url: `${MAPBOX_TILES_BASE}/${style}/tiles/256/{z}/{x}/{y}@2x?access_token=${encodeURIComponent(token)}`,
    attribution: "&copy; Mapbox &copy; OpenStreetMap contributors",
    maxZoom: 19,
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
