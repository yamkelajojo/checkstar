<?php

namespace App\Services;

use App\Models\Product;

/**
 * Single source of truth for turning a *stored* media path into a URL a
 * client can render.
 *
 * Why this exists: five controllers used to absolutise media paths with
 * their own private copies of the same logic, and only two of them checked
 * that the file actually exists on disk. The ones that didn't emitted URLs
 * that 404 (store inventory) and the fallback those two *did* have pointed
 * at an SVG, which Next.js' image optimizer rejects outright — so a product
 * with a stale path rendered as a silently blank card. One shared resolver
 * means one place to keep that contract honest.
 *
 * Contract:
 *  - Stored paths are root-relative (`products/<category>/<file>.webp`).
 *  - Absolute http(s) URLs are passed through untouched (they may be a CDN
 *    or an already-resolved value; we never rewrite what we can't verify).
 *  - Anything that does not resolve to a real file under `public/` is
 *    replaced by a **raster** placeholder. Raster, not SVG: `next/image`
 *    refuses `image/svg+xml` unless `dangerouslyAllowSVG` is enabled, so an
 *    SVG fallback degrades to a blank card instead of a placeholder.
 *  - The resolver never returns a URL it has not verified, except for
 *    pass-through absolute URLs.
 */
class MediaService
{
    /** Raster fallback for product imagery. Kept next to the products it stands in for. */
    public const PRODUCT_PLACEHOLDER = 'products/product-placeholder.webp';

    /**
     * Does this stored path resolve to a real file under public/?
     * Absolute URLs are considered "present" — we cannot (and must not try
     * to) verify a remote origin during a request.
     */
    public function exists(?string $path): bool
    {
        if ($path === null || $path === '') {
            return false;
        }

        if ($this->isAbsolute($path)) {
            return true;
        }

        return is_file(public_path(ltrim($path, '/')));
    }

    /**
     * Root-relative URL for a stored path, guaranteed to resolve.
     *
     * @param string|null $fallback root-relative path used when $path is
     *                              missing/null; null to allow a null result
     */
    public function relative(?string $path, ?string $fallback = self::PRODUCT_PLACEHOLDER): ?string
    {
        $candidate = $path;

        if ($candidate === null || $candidate === '' || ! $this->exists($candidate)) {
            $candidate = $fallback;
        }

        if ($candidate === null || $candidate === '') {
            return null;
        }

        if ($this->isAbsolute($candidate)) {
            return $candidate;
        }

        return '/'.ltrim($candidate, '/');
    }

    /**
     * Absolute URL for a stored path against the API's own origin, so that
     * every client (web, mobile) receives a value it can load directly.
     * Falls back to the same verified placeholder as relative().
     */
    public function url(?string $path, ?string $fallback = self::PRODUCT_PLACEHOLDER, ?string $origin = null): ?string
    {
        $relative = $this->relative($path, $fallback);

        if ($relative === null) {
            return null;
        }

        if ($this->isAbsolute($relative)) {
            return $relative;
        }

        return rtrim($origin ?? $this->requestOrigin(), '/').$relative;
    }

    /**
     * Normalise a Product's `image` + `images` payload in place so every
     * catalogue-shaped endpoint emits the identical, verified shape.
     */
    public function applyToProduct(Product $product, ?string $origin = null): Product
    {
        $product->image = $this->url($product->image, self::PRODUCT_PLACEHOLDER, $origin);

        if ($product->images !== null) {
            $product->images = array_map(
                fn (?string $img) => $this->url($img, self::PRODUCT_PLACEHOLDER, $origin),
                $product->images
            );
        } else {
            // Keep the two fields in lockstep: a client that reads `images`
            // must not see null when the card image itself rendered fine.
            $product->images = [$product->image];
        }

        return $product;
    }

    private function isAbsolute(string $path): bool
    {
        return (bool) preg_match('#^(?:https?:)?//#i', $path);
    }

    private function requestOrigin(): string
    {
        return rtrim(request()->getSchemeAndHttpHost(), '/');
    }
}
