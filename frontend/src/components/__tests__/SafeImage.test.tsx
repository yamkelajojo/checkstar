import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";

/**
 * SafeImage — the component that stands between backend media and a crashed
 * product grid. This is the exact failure the "some product cards have no
 * image" report was about, so every branch is pinned:
 *
 *   1. next/image THROWS at render time for hosts missing from
 *      images.remotePatterns — a throw takes the whole route down.
 *   2. A URL that renders fine can still 404 later (stale stored path), which
 *      used to leave an empty card with nothing in the DOM.
 *   3. next/image's optimiser rejects image/svg+xml, so the fallback must be
 *      the raster placeholder, not an SVG.
 */

vi.mock("next/image", () => ({
  default: (props: any) => {
    // next/image accepts Next.js-only props that are not valid DOM attributes
    // (fill, priority, sizes, quality, loader…). Strip them so the jsdom test
    // does not warn “Received true for non-boolean attribute fill”.
    const { fill, priority, sizes, quality, loader, unoptimized, placeholder, blurDataURL, ...domProps } = props as Record<string, unknown>
    return React.createElement("img", { ...domProps, "data-next-image": "true" })
  },
}));

import SafeImage, { MEDIA_FALLBACK_PATH } from "../SafeImage";

const nextImage = () =>
  document.querySelector('img[data-next-image="true"]') as HTMLImageElement | null;
const plainImage = () =>
  Array.from(document.querySelectorAll("img")).find(
    (i) => !i.hasAttribute("data-next-image"),
  ) as HTMLImageElement | undefined;

beforeEach(() => {
  vi.unstubAllEnvs();
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("SafeImage — missing media", () => {
  it.each([
    ["null", null],
    ["undefined", undefined],
    ["empty string", ""],
  ])("renders the branded placeholder for a %s src", (_label, src) => {
    render(<SafeImage src={src as any} alt="Fresh Spinach" width={200} height={200} />);

    const img = nextImage();
    expect(img).toBeTruthy();
    expect(img!.getAttribute("src")).toBe(MEDIA_FALLBACK_PATH);
    expect(img!.getAttribute("alt")).toBe("Fresh Spinach");
  });

  it("uses a raster placeholder, never an SVG the optimiser would reject", () => {
    expect(MEDIA_FALLBACK_PATH).toMatch(/\.webp$/);
  });
});

describe("SafeImage — URL routing", () => {
  it("keeps same-origin paths on the optimised next/image path", () => {
    render(
      <SafeImage src="/products/dairy-eggs/yoghurt.webp" alt="Yoghurt" fill />,
    );

    expect(nextImage()!.getAttribute("src")).toBe("/products/dairy-eggs/yoghurt.webp");
    expect(plainImage()).toBeUndefined();
  });

  it("rewrites an API-origin URL to a same-origin path (no per-host allow-list)", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");

    render(
      <SafeImage
        src="http://localhost:8000/products/beverages/coke.webp"
        alt="Coke"
        fill
      />,
    );

    const img = nextImage();
    expect(img).toBeTruthy();
    expect(img!.getAttribute("src")).toBe("/products/beverages/coke.webp");
  });

  it("rewrites any host under the /products namespace (proxied production layout)", () => {
    render(
      <SafeImage
        src="https://api.checkstar.example/products/bakery/bread.webp"
        alt="Bread"
        fill
      />,
    );

    expect(nextImage()!.getAttribute("src")).toBe("/products/bakery/bread.webp");
  });

  it("renders a foreign absolute URL as a plain <img> so it can never throw", () => {
    render(
      <SafeImage
        src="http://192.168.99.99:8000/media/unknown-host.jpg"
        alt="Unknown host"
        fill
      />,
    );

    const img = plainImage();
    expect(img).toBeTruthy();
    expect(img!.getAttribute("src")).toBe("http://192.168.99.99:8000/media/unknown-host.jpg");
    expect(nextImage()).toBeNull();
  });

  it.each([
    ["protocol-relative", "//cdn.example.com/x.png"],
    ["blob", "blob:http://localhost:3000/abc-123"],
    ["data URI", "data:image/png;base64,iVBORw0KGgo="],
  ])("renders a %s URL as a plain <img>", (_label, src) => {
    render(<SafeImage src={src} alt="External" fill />);

    expect(plainImage()).toBeTruthy();
    expect(nextImage()).toBeNull();
  });

  it("keeps alt text on both rendering paths (screen readers get the product either way)", () => {
    const { rerender } = render(<SafeImage src="/products/a.webp" alt="Alpha" fill />);
    expect(nextImage()!.getAttribute("alt")).toBe("Alpha");

    rerender(<SafeImage src="https://other.example/b.png" alt="Beta" fill />);
    expect(plainImage()!.getAttribute("alt")).toBe("Beta");
  });

  it("loads eagerly when priority is asked for, lazily otherwise", () => {
    const { rerender } = render(<SafeImage src="/products/a.webp" alt="A" fill />);
    expect(plainImage()).toBeUndefined();

    rerender(
      <SafeImage src="https://other.example/a.png" alt="A" fill priority />,
    );
    expect(plainImage()!.getAttribute("loading")).toBe("eager");

    rerender(<SafeImage src="https://other.example/a.png" alt="A" fill />);
    expect(plainImage()!.getAttribute("loading")).toBe("lazy");
  });
});

describe("SafeImage — failures after render", () => {
  it("swaps a 404ing foreign <img> to the placeholder on the optimised path", () => {
    render(
      <SafeImage src="https://other.example/gone.png" alt="Gone" fill />,
    );
    expect(plainImage()).toBeTruthy();

    fireEvent.error(plainImage()!);

    // The placeholder is a same-origin raster, so it goes back through
    // next/image: one code path for the image that actually renders.
    expect(nextImage()!.getAttribute("src")).toBe(MEDIA_FALLBACK_PATH);
    expect(plainImage()).toBeUndefined();
  });

  it("swaps a rejected next/image to the placeholder", () => {
    render(<SafeImage src="/products/stale-path.webp" alt="Stale" fill />);

    fireEvent.error(nextImage()!);

    expect(nextImage()!.getAttribute("src")).toBe(MEDIA_FALLBACK_PATH);
  });

  it("does not loop when the placeholder itself fails", () => {
    render(<SafeImage src="/products/stale-path.webp" alt="Stale" fill />);

    fireEvent.error(nextImage()!);
    expect(nextImage()!.getAttribute("src")).toBe(MEDIA_FALLBACK_PATH);

    // Second failure must not re-enter the error path (no state churn, no
    // infinite render loop that would freeze the grid).
    fireEvent.error(nextImage()!);
    expect(nextImage()!.getAttribute("src")).toBe(MEDIA_FALLBACK_PATH);
  });

  it("gives a new src a fresh chance after a failure", () => {
    const { rerender } = render(
      <SafeImage src="/products/broken.webp" alt="Product" fill />,
    );
    fireEvent.error(nextImage()!);
    expect(nextImage()!.getAttribute("src")).toBe(MEDIA_FALLBACK_PATH);

    rerender(<SafeImage src="/products/fixed.webp" alt="Product" fill />);

    expect(nextImage()!.getAttribute("src")).toBe("/products/fixed.webp");
  });

  it("keeps the alt text when it degrades (the card is still described)", () => {
    render(<SafeImage src="/products/broken.webp" alt="Fresh Spinach" fill />);

    fireEvent.error(nextImage()!);

    expect(screen.getByAltText("Fresh Spinach")).toBeTruthy();
  });

  it("positions a fill <img> absolutely so the card never collapses", () => {
    render(<SafeImage src="https://other.example/gone.png" alt="Gone" fill />);

    const style = plainImage()!.getAttribute("style") ?? "";
    expect(style).toContain("position: absolute");
    expect(style).toContain("inset: 0");
  });

  it("does not force absolute positioning when the caller sized the image", () => {
    render(
      <SafeImage
        src="https://other.example/logo.png"
        alt="Logo"
        width={120}
        height={40}
        style={{ borderRadius: 8 }}
      />,
    );

    const style = plainImage()!.getAttribute("style") ?? "";
    expect(style).not.toContain("position: absolute");
    expect(style).toContain("border-radius: 8px");
  });
});
