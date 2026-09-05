#!/usr/bin/env node
// Guard: fail install/CI if expo SDK major drifts from 57.
// See mobile/README.md#sdk-pin and AGENTS.md. Update Expo Go on devices before bumping.
const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const expoRange = pkg.dependencies?.expo ?? '';
// Extract major from "~54.0.13" / "^54.0.0" / "54.0.13"
const m = expoRange.match(/(\d+)\./);
const major = m ? Number(m[1]) : null;

if (major !== 57) {
  console.error(
    `\n❌ EXPO SDK PIN VIOLATION: mobile/package.json expo is "${expoRange}" (major ${major}), expected major 57.\n` +
    `   Device fleet runs Expo Go 57.0.0 — project pinned to SDK 57.\n` +
    `   See mobile/README.md#sdk-pin and mobile/AGENTS.md.\n` +
    `   To intentionally upgrade: verify api.expo.dev/v2/sdks/<new>/native-modules is non-empty, update Expo Go on ALL devices, then bump package.json, app.json:sdkVersion, and AGENTS.md together.\n`
  );
  process.exit(1);
}
console.log(`✓ Expo SDK pin ok: expo ${expoRange} (major 57)`);

// Also sanity-check app.json sdkVersion if present — must be exactly 57.0.0
try {
  const appJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'app.json'), 'utf8'));
  const sdkVersion = appJson.expo?.sdkVersion;
  if (sdkVersion && sdkVersion !== '57.0.0') {
    console.error(`❌ app.json expo.sdkVersion is "${sdkVersion}", expected "57.0.0" (matches the Expo Go 57.0.0 device fleet).`);
    process.exit(1);
  }
} catch {}
