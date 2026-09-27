#!/usr/bin/env node
/**
 * Live Mapbox tile smoke check.
 *
 * Unit tests pin the tile URL contract (src/lib/__tests__/mapTiles.test.ts),
 * but only a real request proves a real token works — and that has to happen on
 * a machine that can reach api.mapbox.com (CI and sandboxes often cannot).
 *
 *   node scripts/check-mapbox-tiles.mjs
 *
 * Reads NEXT_PUBLIC_MAPBOX_TOKEN (and optionally NEXT_PUBLIC_MAPBOX_STYLE) from
 * the environment or from frontend/.env.local / .env, then fetches one tile over
 * Durban using the exact URL shape src/lib/mapTiles.ts builds.
 *
 * Exits 0 when tiles are served (or when no token is configured, because the
 * app then runs on keyless OpenStreetMap by design), 1 when a token is present
 * but the request fails — i.e. a misconfigured deployment, not a missing feature.
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = join(HERE, "..");
const SOURCE_OF_TRUTH = join(FRONTEND_ROOT, "src", "lib", "mapTiles.ts");

const DEFAULT_STYLE = "mapbox/streets-v12";
// A style id is exactly `owner/style`, lowercase (mirrors mapTiles.ts).
const STYLE_ID_PATTERN = /^[a-z0-9][a-z0-9_-]*\/[a-z0-9][a-z0-9_-]*$/;

/** Read NEXT_PUBLIC_* values from a .env-style file (no parser dependency). */
function readEnvFile(file) {
  if (!existsSync(file)) return {};
  const out = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) continue;
    out[match[1]] = match[2].replace(/^["']|["']$/g, "").trim();
  }
  return out;
}

function resolveToken() {
  const fromEnv = (process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "").trim();
  if (fromEnv) return { token: fromEnv, origin: "environment" };
  for (const file of [".env.local", ".env.production.local", ".env"]) {
    const parsed = readEnvFile(join(FRONTEND_ROOT, file));
    const token = (parsed.NEXT_PUBLIC_MAPBOX_TOKEN ?? "").trim();
    if (token) return { token, origin: file };
  }
  return { token: "", origin: "" };
}

function resolveStyle() {
  const fromEnv = (process.env.NEXT_PUBLIC_MAPBOX_STYLE ?? "").trim();
  if (fromEnv && STYLE_ID_PATTERN.test(fromEnv)) return fromEnv;
  for (const file of [".env.local", ".env.production.local", ".env"]) {
    const parsed = readEnvFile(join(FRONTEND_ROOT, file));
    const style = (parsed.NEXT_PUBLIC_MAPBOX_STYLE ?? "").trim();
    if (style && STYLE_ID_PATTERN.test(style)) return style;
  }
  return DEFAULT_STYLE;
}

/** Web-mercator tile coordinates — the same maths Leaflet does per zoom level. */
function tileFor({ lat, lon, zoom }) {
  const n = 2 ** zoom;
  const x = Math.floor(((lon + 180) / 360) * n);
  const rad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n);
  return { x, y };
}

function redact(url, token) {
  return token ? url.replaceAll(token, `${token.slice(0, 7)}…REDACTED`) : url;
}

/**
 * Fail loudly if this script's URL shape drifts from the module it verifies.
 *
 * Checks positive markers only: searching for the deprecated `/v4/` endpoint
 * would trip on the comment in mapTiles.ts that documents *not* to use it.
 * If the endpoint ever changes, these markers disappear and the guard fires.
 */
function assertStillInSync() {
  if (!existsSync(SOURCE_OF_TRUTH)) return;
  const source = readFileSync(SOURCE_OF_TRUTH, "utf8");
  const required = [
    "https://api.mapbox.com/styles/v1",
    "tiles/256/{z}/{x}/{y}@2x",
    "mapbox/streets-v12",
  ];
  const missing = required.filter((marker) => !source.includes(marker));
  if (missing.length > 0) {
    console.error(
      `✗ scripts/check-mapbox-tiles.mjs is out of sync with src/lib/mapTiles.ts.\n` +
        `  Missing markers: ${missing.join(", ")}\n` +
        `  Update this script whenever the tile endpoint changes.`,
    );
    process.exit(1);
  }
}

async function main() {
  assertStillInSync();

  const { token, origin } = resolveToken();

  if (!token) {
    console.log(
      "• No NEXT_PUBLIC_MAPBOX_TOKEN configured (checked environment, .env.local, .env).\n" +
        "  The app serves keyless OpenStreetMap tiles in that case — nothing is broken.\n" +
        "  To check Mapbox: create an account at mapbox.com, copy a public token into\n" +
        "  frontend/.env.local as NEXT_PUBLIC_MAPBOX_TOKEN=…, then re-run this script.",
    );
    process.exit(0);
  }

  const style = resolveStyle();
  const zoom = 13;
  // Durban CBD (the delivery area this prototype models).
  const { x, y } = tileFor({ lat: -29.858, lon: 31.025, zoom });
  const url = `https://api.mapbox.com/styles/v1/${style}/tiles/256/${zoom}/${x}/${y}@2x?access_token=${token}`;

  console.log(`• Token source: ${origin}`);
  console.log(`• Style:        ${style}`);
  console.log(`• Requesting:   ${redact(url, token)}`);

  let response;
  try {
    response = await fetch(url, { method: "GET" });
  } catch (error) {
    console.error(`✗ Network error: ${error.message}`);
    console.error("  Is api.mapbox.com reachable from this machine/network?");
    process.exit(1);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const bytes = Number(response.headers.get("content-length") ?? 0);

  if (!response.ok) {
    const hints = {
      401: "Token rejected — copy a fresh public token from mapbox.com/account/tokens.",
      403: "Token lacks the styles:tiles scope, or its URL/scope restrictions block this request.",
      404: `Style "${style}" not found — use an id like mapbox/streets-v12 or mapbox/light-v11.`,
      410: "Deprecated endpoint — this script and mapTiles.ts must use the Styles Static Tiles API.",
      429: "Rate limited — you have exceeded the plan's map-load allowance.",
    }[response.status];
    console.error(`✗ HTTP ${response.status} ${response.statusText}`);
    if (hints) console.error(`  Hint: ${hints}`);
    process.exit(1);
  }

  if (!contentType.startsWith("image/")) {
    console.error(`✗ Expected an image, got content-type "${contentType}".`);
    process.exit(1);
  }

  const body = await response.arrayBuffer();
  console.log(`✓ HTTP ${response.status} · ${contentType} · ${body.byteLength || bytes} bytes`);
  console.log("✓ Mapbox tiles are reachable with this token — the web maps will render on Mapbox.");
  process.exit(0);
}

main();
