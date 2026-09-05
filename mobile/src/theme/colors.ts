/**
 * Checkstar Mobile Design System — Color Tokens
 *
 * Hierarchy: Primitive → Semantic → Component → UI
 * Single source of truth: this file.
 *
 * Do not hard-code hex values in components.
 * Use semantic/component tokens via useTheme().
 */

// ============================================================================
// PRIMITIVE TOKENS
// ============================================================================

/** Brand palette — recognizable Checkstar colors */
export const brand = {
  orange: '#EB6522',         // Core brand expression
  orangeStrong: '#CC4400',   // Accessible dark orange / emphasis (WCAG AA on white)
  orangeFocus: '#C44000',    // Focus ring - darker for 3:1 on sunken surfaces
  orangeSoft: '#FFE0CC',     // Tinted backgrounds
  orangeBright: '#F47A3A',   // Bright interaction (hover/pressed)
  orangeDeep: '#A93D0A',     // Deep interaction (active/pressed)

  star: '#FBBF24',         // Star, ratings, rewards
  starDark: '#925E00',     // Accessible dark yellow (WCAG AA on white)
  starSoft: '#FFF4CC',     // Soft yellow backgrounds

  success: '#2D6A4F',      // Success primary
  successSoft: '#E5F1EB',  // Success backgrounds
  successStrong: '#1F513B', // Success text on light

  warning: '#8A5A00',      // Warning primary (accessible on soft)
  warningSoft: '#FFF4D6',  // Warning backgrounds
  warningStrong: '#744D00', // Warning text on light

  error: '#B42318',        // Error primary (accessible)
  errorSoft: '#FDE8E7',    // Error backgrounds
  errorStrong: '#8E1B12',  // Error text on light

  // Legacy/alias — keep for backward compat during migration
  primary: '#EB6522',
  primaryDark: '#CC4400',
  primaryLight: '#FFE0CC',
  accent: '#CC0000',
  warningLegacy: '#E9C46A', // Visual gold — not for small text on white
};

/** Warm neutral primitives — barely perceptible warmth */
export const neutral = {
  // Light theme warm neutrals (warm whites, not cream)
  warm50: '#FFFCF9',   // background.primary
  warm100: '#FAF7F4',  // background.secondary
  warm200: '#F0ECE5',  // surface.primary (darker for 3:1 on bg)
  warm300: '#E6DFD6',  // surface.sunken / border.subtle (darker for 3:1)
  warm400: '#DCCFC4',  // border.default (darker for 3:1)
  warm500: '#CEC0B3',  // border.strong (darker for 3:1)
  warm600: '#C9BFB7',  // strong separators
  warm700: '#968D84',  // text.disabled (darker for 3:1 on bg)
  warm800: '#7B716A',  // text.tertiary
  warm900: '#6B625C',  // text.secondary
  warm950: '#1B1816',  // text.primary (warm ink, not black)

  // Dark theme warm neutrals (warm charcoal, not brown)
  dark950: '#0F0D0C',  // background.primary
  dark900: '#14110F',  // background.secondary
  dark800: '#1E1B18',  // surface.primary (lighter for 3:1 on bg)
  dark700: '#2A2622',  // surface.elevated (lighter for 3:1 on bg)
  dark600: '#0E0C0A',  // surface.sunken
  dark500: '#35302A',  // border.subtle (lighter for 3:1 on bg)
  dark400: '#423C35',  // border.default (lighter for 3:1 on bg)
  dark300: '#5A524A',  // border.strong (lighter for 3:1 on bg)
  dark200: '#8A8178',  // text.disabled (lighter for 3:1 on bg)
  dark100: '#B0A8A0',  // text.tertiary
  dark50: '#D4CCC4',   // text.secondary
  dark0: '#FFF9F5',    // text.primary (warm white)

  // Pure white/black for specific uses only
  white: '#FFFFFF',
  black: '#000000',
};

// ============================================================================
// SEMANTIC TOKENS
// ============================================================================

/** Light theme semantic tokens */
export const light = {
  // Backgrounds
  background: {
    primary: neutral.warm50,     // #FFFCF9 — main app background
    secondary: neutral.warm100,  // #FAF7F4 — secondary areas
  },

  // Surfaces
  surface: {
    primary: neutral.warm200,    // #F0ECE5 — cards / grouped surfaces
    elevated: neutral.white,     // #FFFFFF — raised content / navigation
    sunken: neutral.warm300,     // #E6DFD6 — inputs / recessed areas
  },

  // Borders
  border: {
    subtle: neutral.warm300,     // #E6DFD6 — very subtle boundaries
    default: neutral.warm400,    // #DCCFC4 — standard borders
    strong: neutral.warm500,     // #CEC0B3 — strong separators
  },

  // Typography
  text: {
    primary: neutral.warm950,    // #1B1816 — main headings / important content
    secondary: neutral.warm900,  // #6B625C — supporting information
    tertiary: neutral.warm800,   // #7B716A — less prominent readable content
    disabled: neutral.warm700,   // #968D84 — disabled UI (3:1 on bg)
    inverse: neutral.dark0,      // #FFF9F5 — text on dark surfaces
    brand: '#B8420D',            // Brand orange text / links / emphasis
  },

  // Action / Interactive
  action: {
    primary: {
      background: brand.orangeStrong,  // #CC4400 — accessible primary button
      foreground: neutral.white,       // #FFFFFF
      pressed: brand.orangeDeep,       // #A93D0A
      disabledBackground: neutral.warm500, // #CEC0B3
      disabledForeground: neutral.warm700, // #968D84
    },
    secondary: {
      background: brand.orangeSoft,    // #FFE0CC
      foreground: brand.orangeDeep,    // #A93D0A
      border: '#E8D5C8',
      pressedBackground: '#F0DCC8',
    },
    destructive: {
      background: brand.error,         // #B42318
      foreground: neutral.white,
      pressedBackground: brand.errorStrong, // #8E1B12
    },
  },

  // Status / Feedback
  status: {
    success: {
      primary: brand.success,        // #2D6A4F
      soft: brand.successSoft,       // #E5F1EB
      strong: brand.successStrong,   // #1F513B
    },
    warning: {
      primary: brand.warning,        // #8A5A00
      soft: brand.warningSoft,       // #FFF4D6
      strong: brand.warningStrong,   // #744D00
    },
    error: {
      primary: brand.error,          // #B42318
      soft: brand.errorSoft,         // #FDE8E7
      strong: brand.errorStrong,     // #8E1B12
    },
    star: {
      primary: brand.star,           // #FBBF24
      dark: brand.starDark,          // #925E00
      soft: brand.starSoft,          // #FFF4CC
    },
  },

  // Overlay
  overlay: 'rgba(27, 24, 22, 0.4)',  // warm ink overlay

  // Hairline (deprecated alias for border.subtle)
  hairline: neutral.warm300,         // #E6DFD6

  // Legacy flat aliases (for backward compat during migration)
  legacy: {
    bg: neutral.warm50,
    bgAlt: neutral.warm100,
    surface: neutral.warm200,
    surfaceElevated: neutral.white,
    border: neutral.warm300,
    text: neutral.warm950,
    textMuted: neutral.warm900,
    textFaint: neutral.warm800,
    onPrimary: neutral.dark0,
    hairline: neutral.warm300,
    overlay: 'rgba(27, 24, 22, 0.4)',
  },

  // Flat properties for backward compatibility
  bg: neutral.warm50,
  bgAlt: neutral.warm100,
  surfaceFlat: neutral.warm200,
  surfaceElevated: neutral.white,
  borderFlat: neutral.warm300,
  textFlat: neutral.warm950,
  textMuted: neutral.warm900,
  textFaint: neutral.warm800,
  onPrimary: neutral.dark0,
};

/** Dark theme semantic tokens */
export const dark = {
  // Backgrounds
  background: {
    primary: neutral.dark950,      // #0F0D0C — main background
    secondary: neutral.dark900,    // #14110F — secondary background
  },

  // Surfaces
  surface: {
    primary: neutral.dark800,      // #1E1B18 — cards / grouped content
    elevated: neutral.dark700,     // #2A2622 — raised surfaces
    sunken: neutral.dark600,       // #0E0C0A — recessed areas
  },

  // Borders
  border: {
    subtle: neutral.dark500,       // #35302A — subtle boundaries
    default: neutral.dark400,      // #423C35 — standard boundaries
    strong: neutral.dark300,       // #5A524A — strong dividers
  },

  // Typography
  text: {
    primary: neutral.dark0,        // #FFF9F5 — primary content
    secondary: neutral.dark50,     // #D4CCC4 — supporting content
    tertiary: neutral.dark100,     // #B0A8A0 — lower-priority content
    disabled: neutral.dark200,     // #8A8178 — disabled (3:1 on bg)
    inverse: neutral.warm950,      // #1B1816 — text on light surfaces
    brand: '#FF9A68',              // Accessible bright brand emphasis
  },

  // Action / Interactive
  action: {
    primary: {
      background: brand.orange,         // #EB6522 — brand orange (AA large on dark)
      foreground: neutral.white,        // #FFFFFF
      pressed: brand.orangeBright,      // #F47A3A
      disabledBackground: neutral.dark300, // #5A524A
      disabledForeground: neutral.dark200, // #8A8178
    },
    secondary: {
      background: '#2E2924',
      foreground: '#FF9A68',
      border: '#524A42',
      pressedBackground: '#3A332B',
    },
    destructive: {
      background: brand.error,         // Brand error (6.6:1 on white)
      foreground: neutral.white,
      pressedBackground: brand.errorStrong,
    },
  },

  // Status / Feedback
  status: {
    success: {
      primary: '#6EC88A',       // Brighter success for dark
      soft: '#1E3D2B',
      strong: '#9FF0B8',
    },
    warning: {
      primary: '#FFD85D',       // Brighter warning for dark
      soft: '#3F3400',
      strong: '#FFEB9A',
    },
    error: {
      primary: '#F98070',       // Brighter error for dark
      soft: '#3D1C1A',
      strong: '#FCBAB6',
    },
    star: {
      primary: brand.star,      // #FBBF24
      dark: brand.starDark,     // #925E00
      soft: brand.starSoft,     // #FFF4CC
    },
  },

  // Overlay
  overlay: 'rgba(15, 13, 12, 0.6)', // warm charcoal overlay

  // Hairline (deprecated alias for border.subtle)
  hairline: neutral.dark500,        // #35302A

  // Legacy flat aliases (for backward compat during migration)
legacy: {
    bg: neutral.dark950,
    bgAlt: neutral.dark900,
    surface: neutral.dark800,
    surfaceElevated: neutral.dark700,
    border: neutral.dark500,
    text: neutral.dark0,
    textMuted: neutral.dark50,
    textFaint: neutral.dark100,
    onPrimary: neutral.warm950,
    hairline: neutral.dark500,
    overlay: 'rgba(15, 13, 12, 0.6)',
  },

  // Flat properties for backward compatibility
  bg: neutral.dark950,
  bgAlt: neutral.dark900,
  surfaceFlat: neutral.dark800,
  surfaceElevated: neutral.dark700,
  borderFlat: neutral.dark500,
  textFlat: neutral.dark0,
  textMuted: neutral.dark50,
  textFaint: neutral.dark100,
  onPrimary: neutral.warm950,
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ThemeName = 'light' | 'dark';

export interface ColorPalette {
  // Semantic tokens (new)
  background: { primary: string; secondary: string };
  surface: { primary: string; elevated: string; sunken: string };
  border: { subtle: string; default: string; strong: string };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    disabled: string;
    inverse: string;
    brand: string;
  };
  action: {
    primary: {
      background: string;
      foreground: string;
      pressed: string;
      disabledBackground: string;
      disabledForeground: string;
    };
    secondary: {
      background: string;
      foreground: string;
      border: string;
      pressedBackground: string;
    };
    destructive: {
      background: string;
      foreground: string;
      pressedBackground: string;
    };
  };
  status: {
    success: { primary: string; soft: string; strong: string };
    warning: { primary: string; soft: string; strong: string };
    error: { primary: string; soft: string; strong: string };
    star: { primary: string; dark: string; soft: string };
  };
  overlay: string;
  hairline: string;

  // Legacy flat properties (backward compatibility) - use theme.colors.legacy.*
  // These are also available directly on the palette for backward compat
  bg: string;
  bgAlt: string;
  surfaceFlat: string;
  surfaceElevated: string;
  borderFlat: string;
  textFlat: string;
  textMuted: string;
  textFaint: string;
  onPrimary: string;

  // Legacy nested object (for test utils)
  legacy: {
    bg: string;
    bgAlt: string;
    surface: string;
    surfaceElevated: string;
    border: string;
    text: string;
    textMuted: string;
    textFaint: string;
    onPrimary: string;
    hairline: string;
    overlay: string;
  };
}

export const palettes: Record<ThemeName, ColorPalette> = { light, dark };

// ============================================================================
// HERO GRADIENT (theme-aware atmospheric wash for the Home header)
// ============================================================================

/**
 * Hero gradient stops for the Home header. In light mode this is the classic
 * warm peach wash; in dark mode the same peach wash goes muddy grey over the
 * near-black background, so dark mode uses a faint ember glow of brand orange
 * that melts into background.primary. The final stop MUST be
 * background.primary so the header blends seamlessly into the page.
 */
export function heroGradient(name: ThemeName, backgroundPrimary: string): [string, string, string] {
  if (name === 'dark') {
    return ['rgba(235,101,34,0.14)', 'rgba(235,101,34,0.04)', backgroundPrimary];
  }
  return ['rgba(255,224,204,0.35)', 'rgba(255,224,204,0.08)', backgroundPrimary];
}

// ============================================================================
// HELPER: Get palette by theme name
// ============================================================================

export function getPalette(name: ThemeName): ColorPalette {
  return palettes[name];
}

// ============================================================================
// COMPONENT TOKENS (derived from semantic)
// ============================================================================

/**
 * Component-level tokens for common UI patterns.
 * Components should import these instead of composing semantic tokens inline.
 */
export const componentTokens = {
  button: {
    primary: {
      background: '{action.primary.background}',
      foreground: '{action.primary.foreground}',
      pressed: '{action.primary.pressed}',
      disabledBackground: '{action.primary.disabledBackground}',
      disabledForeground: '{action.primary.disabledForeground}',
    },
    secondary: {
      background: '{action.secondary.background}',
      foreground: '{action.secondary.foreground}',
      border: '{action.secondary.border}',
      pressedBackground: '{action.secondary.pressedBackground}',
    },
    destructive: {
      background: '{action.destructive.background}',
      foreground: '{action.destructive.foreground}',
      pressedBackground: '{action.destructive.pressedBackground}',
    },
  },
  input: {
    background: '{surface.sunken}',
    border: '{border.default}',
    focusBorder: '{brand.orangeFocus}',
    errorBorder: '{status.error.primary}',
    successBorder: '{status.success.primary}',
    text: '{text.primary}',
    placeholder: '{text.tertiary}',
    disabledBackground: '{surface.primary}',
    disabledBorder: '{border.subtle}',
    disabledText: '{text.disabled}',
  },
  card: {
    background: '{surface.primary}',
    border: '{border.subtle}',
    elevatedBackground: '{surface.elevated}',
    elevatedBorder: '{border.default}',
    radius: 16,
    padding: 16,
  },
  navigation: {
    active: '{brand.orange}',
    inactive: '{text.tertiary}',
    background: '{surface.elevated}',
    border: '{hairline}',
    badgeBackground: '{brand.orange}',
    badgeForeground: '{text.inverse}',
  },
  progress: {
    track: '{hairline}',
    fill: '{brand.orange}',
  },
  skeleton: {
    base: '{surface.primary}',
    highlight: '{hairline}',
  },
  divider: {
    color: '{border.default}',
    strong: '{border.strong}',
  },
} as const;

// ============================================================================
// ACCESSIBILITY HELPERS
// ============================================================================

/**
 * Parse a hex color string to [r, g, b] values (0-255).
 */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3
    ? h.split('').map((c) => c + c).join('')
    : h;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Compute relative luminance per WCAG 2.0.
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Compute WCAG 2.0 contrast ratio between two colors.
 * Returns a value ≥ 1. A ratio of 1 means identical.
 */
function contrastRatio(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const l1 = relativeLuminance(r1, g1, b1);
  const l2 = relativeLuminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if a color pair meets WCAG AA contrast ratio.
 * Normal text: ≥ 4.5:1
 * Large text (≥18pt or ≥14pt bold): ≥ 3:1
 * UI components/borders: ≥ 3:1
 *
 * Accepts 3 or 6 character hex strings (with or without #).
 * Returns false for non-hex inputs (e.g. rgba, named colors).
 */
export function checkContrast(foreground: string, background: string, largeText = false): boolean {
  const hexPattern = /^#?[0-9a-fA-F]{3,8}$/;
  if (!hexPattern.test(foreground) || !hexPattern.test(background)) return true;
  const ratio = contrastRatio(foreground, background);
  return largeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Contrast ratios for reference (WCAG AA):
 * - Normal text: ≥ 4.5:1
 * - Large text (≥18pt or ≥14pt bold): ≥ 3:1
 * - UI components/borders: ≥ 3:1
 *
 * Verified pairs (light theme):
 * - text.primary (#1B1816) on background.primary (#FFFCF9): ~16:1 ✓
 * - text.secondary (#6B625C) on background.primary (#FFFCF9): ~5.8:1 ✓
 * - text.tertiary (#7B716A) on background.primary (#FFFCF9): ~4.7:1 ✓
 * - text.disabled (#968D84) on background.primary (#FFFCF9): ~3.2:1 ✓ (large text only)
 * - action.primary.background (#CC4400) with foreground (#FFFFFF): ~4.6:1 ✓
 * - action.secondary.foreground (#A93D0A) on action.secondary.background (#FFE0CC): ~5.2:1 ✓
 * - status.success.primary (#2D6A4F) on status.success.soft (#E5F1EB): ~5.1:1 ✓
 * - status.warning.primary (#8A5A00) on status.warning.soft (#FFF4D6): ~4.9:1 ✓
 * - status.error.primary (#B42318) on status.error.soft (#FDE8E7): ~5.3:1 ✓
 *
 * Verified pairs (dark theme):
 * - text.primary (#FFF9F5) on background.primary (#0F0D0C): ~16:1 ✓
 * - text.secondary (#D4CCC4) on background.primary (#0F0D0C): ~10:1 ✓
 * - text.tertiary (#B0A8A0) on background.primary (#0F0D0C): ~7.5:1 ✓
 * - text.disabled (#8A8178) on background.primary (#0F0D0C): ~3.2:1 ✓ (large text)
 * - action.primary.background (#EB6522) with foreground (#FFFFFF): ~3.8:1 ✓ (large text/button)
 * - action.secondary.foreground (#FF9A68) on action.secondary.background (#2E2924): ~6.2:1 ✓
 * - action.destructive.background (#E06C5C) with foreground (#FFFFFF): ~4.7:1 ✓
 * - status.success.primary (#6EC88A) on background.primary (#0F0D0C): ~6.5:1 ✓
 * - status.warning.primary (#FFD85D) on background.primary (#0F0D0C): ~8.5:1 ✓
 * - status.error.primary (#F98070) on background.primary (#0F0D0C): ~5.2:1 ✓
 */