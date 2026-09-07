/**
 * Escape a plain-text value for safe interpolation into HTML strings
 * (Leaflet marker popups are rendered as HTML by the browser). API data
 * must never be dropped into popup markup unescaped.
 *
 * Nullable-safe: store fields like address/city may be null — they render
 * as an empty segment rather than crashing the page.
 */
export function escapeHtml(value: string | null | undefined): string {
  if (!value) return ''
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
