/**
 * Normalise backend media URLs for next/image.
 *
 * The backend returns absolute media URLs against its own origin (driven by
 * its APP_URL, e.g. `http://localhost:8000/products/beverages/x.jpg`).
 * next/image refuses hosts that are not explicitly allow-listed, and
 * allow-listing every developer origin (localhost, LAN IPs, ports) is
 * brittle. Instead:
 *  - URLs pointing at the API origin (NEXT_PUBLIC_API_URL) are rewritten to
 *    a same-origin path — next.config.js proxies them to the API — so
 *    images work in every environment without per-host configuration.
 *  - URLs under the backend's `/products/...` namespace are rewritten even
 *    when the API origin differs (production layouts where only the
 *    namespace is proxied).
 * Anything else is passed through untouched (and relies on the
 * `images.remotePatterns` fallback in next.config.js).
 */
export function mediaUrl(src: string | null | undefined): string {
  if (!src) return ''

  // Already same-origin relative (or a data: URL) — leave untouched.
  if (!/^https?:\/\//i.test(src)) return src

  try {
    const url = new URL(src)

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const apiOrigin = new URL(apiUrl.endsWith('/api') ? apiUrl.replace(/\/api$/, '') : apiUrl).origin
    if (url.origin === apiOrigin) {
      return `${url.pathname}${url.search}`
    }

    // Production layout: only the /products namespace is proxied.
    if (url.pathname.startsWith('/products/')) {
      return url.pathname
    }

    return src
  } catch {
    return src
  }
}
