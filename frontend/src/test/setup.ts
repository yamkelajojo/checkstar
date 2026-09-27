import '@testing-library/jest-dom'

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
