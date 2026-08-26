/**
 * Checkstar Mobile Design System — Spacing & Radius Tokens
 *
 * Based on 4pt base grid.
 * Primary rhythm: 8 / 16 / 24 / 32
 * Single source of truth: this file.
 */

// ============================================================================
// SPACING SCALE (4pt base grid)
// ============================================================================

export const spacing = {
  /** 4px — micro spacing, tight gaps */
  xxs: 4,
  /** 8px — base unit, small gaps */
  xs: 8,
  /** 12px — small component padding */
  sm: 12,
  /** 16px — standard component padding, default gap */
  md: 16,
  /** 20px — medium-large spacing */
  lg: 20,
  /** 24px — large spacing, section gaps */
  xl: 24,
  /** 32px — extra large, major section separation */
  xxl: 32,
  /** 40px — huge spacing */
  xxxl: 40,
  /** 48px — massive spacing */
  huge: 48,
  /** 64px — heroic spacing */
  massive: 64,
  /** 80px — extreme spacing */
  extreme: 80,
} as const;

// ============================================================================
// SPACING SEMANTIC ALIASES
// ============================================================================

/**
 * Semantic spacing for common layout patterns.
 * Use these instead of raw spacing values.
 */
export const semanticSpacing = {
  /** Screen edge padding */
  screenPadding: spacing.md,        // 16
  /** Card internal padding */
  cardPadding: spacing.md,          // 16
  /** Card internal padding (comfortable) */
  cardPaddingComfortable: spacing.lg, // 20
  /** Section vertical gap */
  sectionGap: spacing.xl,           // 24
  /** Component group gap */
  groupGap: spacing.md,             // 16
  /** Element gap within component */
  elementGap: spacing.sm,           // 12
  /** Tight element gap */
  tightGap: spacing.xs,             // 8
  /** Micro gap */
  microGap: spacing.xxs,            // 4
  /** Inline horizontal gap (chips, pills) */
  inlineGap: spacing.xs,            // 8
  /** Form field vertical gap */
  fieldGap: spacing.md,             // 16
  /** List item vertical padding */
  listItemPadding: spacing.md,      // 16
  /** Navigation bar height */
  navBarHeight: 56,
  /** Tab bar height */
  tabBarHeight: 56,
  /** Sticky bar height */
  stickyBarHeight: 72,
  /** Modal/sheet handle gap */
  sheetHandleGap: spacing.sm,       // 12

  // Raw spacing aliases (backward compat for direct access)
  xl: spacing.xl,
  lg: spacing.lg,
  md: spacing.md,
  sm: spacing.sm,
  xs: spacing.xs,
  xxs: spacing.xxs,
} as const;

// ============================================================================
// CORNER RADIUS
// ============================================================================

export const radius = {
  /** 6px — small controls, badges, chips */
  xs: 6,
  /** 8px — inputs, buttons, small cards */
  sm: 8,
  /** 12px — standard inputs, cards, modals */
  md: 12,
  /** 16px — standard cards, sheets */
  lg: 16,
  /** 20px — large cards, feature cards */
  xl: 20,
  /** 24px — bottom sheets, major modals */
  xxl: 24,
  /** 999px — fully rounded (pills, badges, avatars) */
  pill: 999,
  /** 9999px — full circle */
  full: 9999,
} as const;

// ============================================================================
// RADIUS SEMANTIC ALIASES
// ============================================================================

/**
 * Semantic radius for common component types.
 * Use these instead of raw radius values.
 */
export const semanticRadius = {
  input: radius.md,        // 12
  button: radius.md,       // 12 (12-14 per spec)
  buttonPill: radius.pill, // 999
  card: radius.lg,         // 16
  cardLarge: radius.xl,    // 20
  sheet: radius.xxl,       // 24
  modal: radius.xxl,       // 24
  chip: radius.pill,       // 999
  badge: radius.pill,      // 999
  avatar: radius.full,     // 9999
  imageFrame: radius.xl,   // 20
  smallControl: radius.sm, // 8
} as const;

// ============================================================================
// BORDER WIDTHS
// ============================================================================

export const borderWidth = {
  hairline: 0.5,  // StyleSheet.hairlineWidth equivalent
  thin: 1,        // Standard border
  thick: 2,       // Emphasized border
  focus: 2,       // Focus ring
} as const;

// ============================================================================
// HIT TARGETS (Accessibility)
// ============================================================================

/**
 * Minimum touch target sizes per platform guidelines.
 * iOS HIG: 44x44pt
 * Android: 48x48dp
 */
export const hitTarget = {
  minimum: 44,   // iOS minimum
  comfortable: 48, // Android minimum / comfortable
  large: 56,     // Large interactive areas
} as const;

// ============================================================================
// ELEVATION / SHADOW TOKENS
// ============================================================================

/**
 * Elevation levels for communicating hierarchy.
 * Checkstar uses surface color + border + spacing primarily.
 * Shadows are soft, diffuse, warm-neutral — not pure black.
 */
export const elevation = {
  /** Level 0 — Flat background, no shadow */
  level0: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  /** Level 1 — Cards, grouped content */
  level1: {
    shadowColor: '#1B1816', // warm ink, not pure black
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },

  /** Level 2 — Raised navigation, floating elements */
  level2: {
    shadowColor: '#1B1816',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  /** Level 3 — Dialogs, sheets, important overlays */
  level3: {
    shadowColor: '#1B1816',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },

  /** Level 4 — Toasts, dropdowns, popovers */
  level4: {
    shadowColor: '#1B1816',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;

// ============================================================================
// LEGACY EXPORTS (for backward compat during migration)
// ============================================================================

/** @deprecated Use spacing instead */
export const radiusLegacy = radius;

/** @deprecated Use radius instead */
export const radii = radius;