/**
 * GreenBidder-style scroll physics presets.
 * Fast, responsive scrolling without overscroll glow on Android.
 * Usage: <ScrollView {...scrollPhysics} />
 */

export const scrollPhysics = {
  // Default: fast, no overscroll glow
  fast: {
    decelerationRate: 'fast',
    scrollEventThrottle: 16,
    showsVerticalScrollIndicator: false,
    showsHorizontalScrollIndicator: false,
    overScrollMode: 'never' as const,
  },

  // For horizontal paginated scroll (onboarding, carousels)
  paging: {
    decelerationRate: 'fast',
    scrollEventThrottle: 16,
    showsHorizontalScrollIndicator: false,
    pagingEnabled: true,
    overScrollMode: 'never' as const,
  },

  // For lists that should feel snappy
  list: {
    decelerationRate: 'fast',
    scrollEventThrottle: 16,
    showsVerticalScrollIndicator: false,
    overScrollMode: 'never' as const,
  },
};

/**
 * Content container style for centered, padded scroll content.
 */
export const scrollContent = {
  flexGrow: 1,
  paddingBottom: 100,
} as const;