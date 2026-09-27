import '@testing-library/jest-dom'
import React from 'react'
import { vi } from 'vitest'

// Global next/image mock: Next.js-only props (fill, priority, etc.) are not
// valid DOM attributes. Without this every SafeImage usage with fill would
// warn “Received true for non-boolean attribute fill” in jsdom. The per-file
// mock in SafeImage.test.tsx already strips them; this makes the same
// guarantee for every other test that renders SafeImage indirectly.
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, priority, sizes, quality, loader, unoptimized, placeholder, blurDataURL, ...domProps } = props as Record<string, unknown> & { fill?: boolean; priority?: boolean }
    // next/image would normally render an <img> with data-nimg etc.; for tests
    // a plain <img> is sufficient and must not receive Next.js props.
    return React.createElement('img', { ...domProps, 'data-next-image': 'true' })
  },
}))

/**
 * jsdom implements no `window.matchMedia`, but several components consult it to
 * honour `prefers-reduced-motion` (BannerCarousel autoplay, motion tokens).
 * Without this the effect throws and the component cannot be rendered in a
 * test at all. Default answer: motion is allowed. A test that wants the
 * reduced-motion branch overrides `window.matchMedia` itself.
 */
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}
