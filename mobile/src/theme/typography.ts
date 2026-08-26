/**
 * Checkstar Mobile Design System — Typography Tokens
 *
 * Hierarchy: Font family → Scale → Weight → Line height → Letter spacing
 * Single source of truth: this file.
 *
 * Supports dynamic text sizing / accessibility scaling.
 * Components should use semantic text styles, not raw values.
 */

// ============================================================================
// FONT FAMILY
// ============================================================================

/**
 * Primary font family for the application.
 * Uses system font for performance and platform consistency.
 * Can be swapped for a custom font by changing this value.
 */
export const fontFamily = {
  /** Default system font stack (San Francisco on iOS, Roboto on Android) */
  system: 'System',

  /** Monospace for code, technical data, API URLs */
  mono: 'monospace',
} as const;

// ============================================================================
// FONT WEIGHTS
// ============================================================================

export const fontWeight = {
  black: '900' as const,
  extrabold: '800' as const,
  bold: '700' as const,
  semibold: '600' as const,
  medium: '500' as const,
  regular: '400' as const,
  light: '300' as const,
} as const;

// ============================================================================
// LETTER SPACING
// ============================================================================

export const letterSpacing = {
  tight: -0.4,
  tighter: -0.8,
  normal: 0,
  wide: 0.5,
  wider: 1.1,
  widest: 1.5,
} as const;

// ============================================================================
// TYPE SCALE — Size + Line Height + Weight
// ============================================================================

/**
 * Complete type styles with size, line height, and default weight.
 * These are the semantic text styles components should use.
 *
 * Scale follows 4pt rhythm where possible.
 * Line heights use 4pt baseline grid.
 */
export const textStyle = {
  /** Hero / marketing headlines — largest text */
  display: {
    size: 34,
    lineHeight: 42,
    weight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
  },

  /** Screen titles / major section headers */
  h1: {
    size: 28,
    lineHeight: 36,
    weight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
  },

  /** Major section headers */
  h2: {
    size: 24,
    lineHeight: 32,
    weight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
  },

  /** Subsection headers */
  h3: {
    size: 20,
    lineHeight: 28,
    weight: fontWeight.semibold,
    letterSpacing: letterSpacing.tight,
  },

  /** Card titles / list item primaries */
  title: {
    size: 17,
    lineHeight: 24,
    weight: fontWeight.semibold,
    letterSpacing: letterSpacing.tight,
  },

  /** Comfortable reading size for body copy */
  bodyLarge: {
    size: 17,
    lineHeight: 26,
    weight: fontWeight.regular,
    letterSpacing: letterSpacing.normal,
  },

  /** Standard body text */
  body: {
    size: 16,
    lineHeight: 24,
    weight: fontWeight.regular,
    letterSpacing: letterSpacing.normal,
  },

  /** Slightly smaller body for dense content */
  bodySmall: {
    size: 14,
    lineHeight: 22,
    weight: fontWeight.regular,
    letterSpacing: letterSpacing.normal,
  },

  /** Buttons, labels, form controls */
  label: {
    size: 14,
    lineHeight: 20,
    weight: fontWeight.medium,
    letterSpacing: letterSpacing.wide,
  },

  /** Semibold variant for emphasized labels */
  labelStrong: {
    size: 14,
    lineHeight: 20,
    weight: fontWeight.semibold,
    letterSpacing: letterSpacing.wide,
  },

  /** Primary button text */
  buttonPrimary: {
    size: 14,
    lineHeight: 20,
    weight: fontWeight.semibold,
    letterSpacing: letterSpacing.wide,
  },

  /** Secondary metadata, timestamps, helper text */
  caption: {
    size: 12,
    lineHeight: 16,
    weight: fontWeight.medium,
    letterSpacing: letterSpacing.normal,
  },

  /** Smallest readable text — legal, fine print */
  micro: {
    size: 11,
    lineHeight: 14,
    weight: fontWeight.medium,
    letterSpacing: letterSpacing.normal,
  },

  /** Price display — prominent numerical values */
  price: {
    size: 20,
    lineHeight: 28,
    weight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
  },

  /** Large price for product detail */
  priceLarge: {
    size: 28,
    lineHeight: 36,
    weight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
  },
} as const;

// ============================================================================
// LEGACY TYPE SCALE (for backward compat during migration)
// ============================================================================

/** @deprecated Use textStyle instead */
export const typeScale = {
  display: 32,
  title: 26,
  brand: 23,
  heading: 17,
  body: 15,
  caption: 12,
  micro: 10,
  price: 20,
} as const;

/** @deprecated Use fontWeight instead */
export const weights = fontWeight;

/** @deprecated Use letterSpacing instead */
export const letterSpacingLegacy = letterSpacing;

// ============================================================================
// SEMANTIC TEXT STYLES (Component-level)
// ============================================================================

/**
 * Pre-composed text styles for common UI patterns.
 * Components should import these instead of composing textStyle inline.
 */
export const semanticText = {
  // Screen-level hierarchy
  screenTitle: textStyle.h1,
  sectionTitle: textStyle.h3,
  cardTitle: textStyle.title,
  listTitle: textStyle.title,

  // Body hierarchy
  bodyPrimary: textStyle.body,
  bodySecondary: textStyle.bodySmall,
  bodyTertiary: { ...textStyle.caption, weight: fontWeight.regular },

  // Interactive
  buttonPrimary: textStyle.labelStrong,
  buttonSecondary: textStyle.label,
  buttonDestructive: textStyle.labelStrong,
  link: { ...textStyle.body, weight: fontWeight.medium },

  // Form
  inputLabel: textStyle.label,
  inputValue: textStyle.body,
  inputPlaceholder: { ...textStyle.body, weight: fontWeight.regular },
  inputError: { ...textStyle.caption, weight: fontWeight.medium },
  inputHelper: textStyle.caption,

  // Status
  statusSuccess: { ...textStyle.caption, weight: fontWeight.semibold },
  statusWarning: { ...textStyle.caption, weight: fontWeight.semibold },
  statusError: { ...textStyle.caption, weight: fontWeight.semibold },

  // Metadata
  metadata: textStyle.caption,
  timestamp: textStyle.micro,
  price: textStyle.price,
  priceLarge: textStyle.priceLarge,

  // Brand
  brandPrimary: textStyle.title,
  brandSecondary: textStyle.body,
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type FontFamily = typeof fontFamily[keyof typeof fontFamily];
export type FontWeight = typeof fontWeight[keyof typeof fontWeight];
export type LetterSpacing = typeof letterSpacing[keyof typeof letterSpacing];
export type TextStyleKey = keyof typeof textStyle;
export type SemanticTextKey = keyof typeof semanticText;

export type TextStyle = typeof textStyle[TextStyleKey];
export type SemanticTextStyle = typeof semanticText[SemanticTextKey];

// ============================================================================
// ACCESSIBILITY / DYNAMIC TYPE SUPPORT
// ============================================================================

/**
 * Scale factor for dynamic type / accessibility.
 * Multiply textStyle.size by this factor.
 * iOS: UIContentSizeCategory
 * Android: fontScale
 */
export function getDynamicScale(fontScale: number): number {
  // Clamp to reasonable range
  return Math.min(Math.max(fontScale, 0.85), 1.5);
}

/**
 * Apply dynamic scaling to a text style.
 * Preserves line height ratio.
 */
export function scaleTextStyle(style: TextStyle, fontScale: number): TextStyle {
  const scale = getDynamicScale(fontScale);
  return {
    ...style,
    size: Math.round(style.size * scale),
    lineHeight: Math.round(style.lineHeight * scale),
  };
}

/**
 * Apply dynamic scaling to a semantic text style.
 */
export function scaleSemanticTextStyle(style: SemanticTextStyle, fontScale: number): SemanticTextStyle {
  const scale = getDynamicScale(fontScale);
  return {
    ...style,
    size: Math.round(style.size * scale),
    lineHeight: Math.round(style.lineHeight * scale),
  };
}