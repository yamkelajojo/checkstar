#!/usr/bin/env node
// Guard: fail install/CI if expo SDK major drifts from 54.
// See mobile/README.md#sdk-pin and AGENTS.md. Update Go fleet before bumping.
const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const expoRange = pkg.dependencies?.expo ?? '';
// Extract major from "~54.0.13" / "^54.0.0" / "54.0.13"
const m = expoRange.match(/(\d+)\./);
const major = m ? Number(m[1]) : null;

if (major !== 54) {
  console.error(
    `\n❌ EXPO SDK PIN VIOLATION: mobile/package.json expo is "${expoRange}" (major ${major}), expected major 54.\n` +
    `   Device fleet runs Expo Go 54.0.2 — only SDK 54.0.2 will load.\n` +
    `   See mobile/README.md#sdk-pin and mobile/AGENTS.md.\n` +
    `   To intentionally upgrade: update Expo Go on ALL devices, then bump package.json, app.json:sdkVersion, and AGENTS.md together.\n`
  );
  process.exit(1);
}
console.log(`✓ Expo SDK pin ok: expo ${expoRange} (major 54)`);

// Also sanity-check app.json sdkVersion if present — must be exactly 54.0.2
try {
  const appJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'app.json'), 'utf8'));
  const sdkVersion = appJson.expo?.sdkVersion;
  if (sdkVersion && sdkVersion !== '54.0.2') {
    console.error(`❌ app.json expo.sdkVersion is "${sdkVersion}", expected "54.0.2" to match Expo Go 54.0.2.`);
    process.exit(1);
  }
} catch {}
