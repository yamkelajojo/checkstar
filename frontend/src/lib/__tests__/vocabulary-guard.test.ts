import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Guard for the status/role vocabulary.
 *
 * The house wording lives in `src/lib/labels.ts` (and its mobile twin), and
 * every surface is supposed to go through it. Before that, each screen invented
 * its own: `out_for_delivery` on the dispatch console, "out for delivery" on a
 * rider's badge, "Store Manager" in Title Case on two admin screens. Those came
 * from one idiom — `status.replace(/_/g, " ")` — so the idiom itself is banned
 * in components.
 *
 * Limits, stated plainly: this is a static check. It catches the hand-rolled
 * idiom, not a component that prints a raw `order.status` with no transform at
 * all; the label functions themselves are pinned by `labels.test.ts`, and the
 * surfaces that matter are asserted in their own suites (StoreOrdersClient,
 * DispatchConsoleClient, LoginClient).
 */

const SRC_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const HAND_ROLLED_ENUM = /\.replace\(\/_\/g/;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "__tests__" || entry === "node_modules") continue;
      walk(full, out);
    } else if (entry.endsWith(".tsx")) {
      out.push(full);
    }
  }
  return out;
}

describe("status and role vocabulary", () => {
  it("no component hand-rolls an enum into words", () => {
    const offenders = walk(SRC_ROOT)
      .filter((file) => HAND_ROLLED_ENUM.test(readFileSync(file, "utf8")))
      .map((file) => relative(SRC_ROOT, file));

    // Use orderStatusLabel / customerStatusLabel / roleLabel / humanize from
    // "@/lib/labels" instead — one vocabulary, mirrored on mobile.
    expect(offenders).toEqual([]);
  });

  it("actually scanned something (a guard that finds no files guards nothing)", () => {
    expect(walk(SRC_ROOT).length).toBeGreaterThan(50);
  });
});
