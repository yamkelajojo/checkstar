/**
 * CheckStar wordmark loader — the "signature" stroke-on animation.
 *
 * The paint colours flow through `currentColor`, NOT a hard-coded brand
 * orange. The old hard-code made the loader invisible whenever it sat on a
 * brand-orange surface (the Sign In / submit buttons): the stroke and fill
 * were the exact same colour as the button background, so the animation
 * only became visible on hover, when the background darkened. With
 * currentColor the loader always contrasts its container:
 *   - tone="brand" (default) → orange wordmark on light surfaces
 *   - tone="light"            → white wordmark on brand/dark surfaces
 */

const LOADER_CSS = `
.checkstar-text {
  font-family: var(--font-inter, 'Inter'), system-ui, sans-serif;
  font-size: 24px;
  fill: transparent;
  stroke: currentColor;
  stroke-width: 2;
  stroke-dashoffset: 25%;
  stroke-dasharray: 0 50%;
  animation: checkstar-stroke 5s infinite alternate;
}
@keyframes checkstar-stroke {
  0% {
    fill: transparent;
    stroke: currentColor;
    stroke-dashoffset: 25%;
    stroke-dasharray: 0 50%;
    stroke-width: 2;
  }
  70% {
    fill: transparent;
    stroke: currentColor;
  }
  80% {
    fill: transparent;
    stroke: currentColor;
    stroke-width: 3;
  }
  100% {
    fill: currentColor;
    stroke: transparent;
    stroke-dashoffset: -25%;
    stroke-dasharray: 50% 0;
    stroke-width: 0;
  }
}
`

const TONE_COLOR = {
  brand: '#EB6522',
  light: '#FFFFFF',
} as const

export function Loader({
  className,
  tone = 'brand',
}: { className?: string; tone?: keyof typeof TONE_COLOR } = {}) {
  return (
    <div
      style={{ color: TONE_COLOR[tone] }}
      className={`relative flex items-center justify-center ${className ?? 'h-10 w-32'}`}
    >
      <svg className="h-full w-full" viewBox="0 0 120 40" aria-hidden="true">
        <style>{LOADER_CSS}</style>
        <text x="50%" y="50%" dy=".35em" textAnchor="middle" className="checkstar-text">
          CheckStar
        </text>
      </svg>
    </div>
  )
}
