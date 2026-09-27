import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

function readTailwind(): string {
  const p = join(ROOT, "tailwind.config.ts");
  return readFileSync(p, "utf8");
}

/**
 * Guard: accent (danger) and primary-dark must be visually distinct.
 * Previously they were essentially the same dark red — a manager could not
 * tell a hovered primary from a resting destructive. This test pins the fix:
 * orange stays orange, red stays red.
 */
describe("design tokens — accent vs primary-dark", () => {
  it("defines distinct intent colors", () => {
    const cfg = readTailwind();
    // primary-dark should be orange family, accent should be red family
    expect(cfg).toContain("#C2410C"); // orange-700, distinct from red
    expect(cfg).toContain("#DC2626"); // red-600
    // Old conflated values must be gone as assignments (comments may mention them)
    expect(cfg).not.toMatch(/dark:\s*'#CC4400'/);
    // Old accent string form must be gone — now an object with dark/light
    expect(cfg).not.toMatch(/accent:\s*'#CC0000'/);
  });

  it("exposes semantic radii", () => {
    const cfg = readTailwind();
    expect(cfg).toContain("button: '12px'");
    expect(cfg).toContain("card: '16px'");
    expect(cfg).toContain("pill: '9999px'");
    // Small and extra-large complete the scale (10px chips, 20px hero)
    expect(cfg).toContain("sm: '10px'");
    expect(cfg).toContain("xl: '20px'");
  });
});

/**
 * Guard: arbitrary rounded-[14px] is the outlier that never appeared in
 * the token file. 12px (button) and 16px (card) are the canonical sizes.
 * New code must use rounded-button / rounded-card / rounded-pill, not
 * rounded-[14px]. This test will initially fail until the 6 outliers are
 * migrated.
 */
describe("design tokens — no arbitrary 14px radius", () => {
  it("has no rounded-[14px] in src", async () => {
    const { execSync } = await import("node:child_process");
    const out = execSync("grep -r 'rounded-\\[14px\\]' --include='*.tsx' src || true", {
      cwd: ROOT,
      encoding: "utf8",
    }).trim();
    // If this fails, migrate the listed files to rounded-button (12px) or rounded-card (16px)
    expect(out, `found rounded-[14px] outliers (migrate to rounded-button/card):\n${out}`).toBe("");
  });
});

/**
 * Guard: no arbitrary rounded-[*px] except the device-frame allowlist.
 * After the 14px fix, 16px (card), 12px (button), 10px (sm chip), 20px (xl hero)
 * were still used as literals throughout the app — defeating the token
 * scale. New code must use rounded-sm / rounded-button / rounded-card /
 * rounded-xl / rounded-pill. The only exceptions are the phone mock in
 * DownloadTheApp (44px outer, 36px inner) which is not a design token.
 */
describe("design tokens — no arbitrary radius literals", () => {
  it("has no stray rounded-[*px] in src (except 44px/36px device frames)", async () => {
    const { execSync } = await import("node:child_process");
    const out = execSync(
      "grep -R 'rounded-\\[[0-9]\\+px\\]' --include='*.tsx' --include='*.ts' src | grep -v '__tests__' | grep -v '44px' | grep -v '36px' || true",
      { cwd: ROOT, encoding: "utf8" },
    ).trim();
    expect(out, `found arbitrary rounded-[*px] (use rounded-sm/button/card/xl/pill):\n${out}`).toBe("");
  });
});

/**
 * Guard: dead dependencies that are installed but never imported.
 * solid-glass and lenis were added but never used in the bundle — they
 * increase install time and risk side-effectful CSS. This test fails while
 * they remain in package.json.
 */
describe("dead dependencies", () => {
  it("does not ship unused deps", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
    const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
    const dead = ["solid-glass", "lenis"].filter((d) => d in deps);
    expect(dead, `remove unused deps from package.json: ${dead.join(", ")}`).toEqual([]);
  });

  it("does not import dead deps in src", async () => {
    const { execSync } = await import("node:child_process");
    const out = execSync("grep -r \"from ['\\\"]solid-glass['\\\"]\\|from ['\\\"]lenis['\\\"]\" --include='*.tsx' --include='*.ts' src || true", {
      cwd: ROOT,
      encoding: "utf8",
    }).trim();
    expect(out, `found imports of dead deps:\n${out}`).toBe("");
  });
});
