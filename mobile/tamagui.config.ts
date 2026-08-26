import { createTamagui, createTokens, createFont } from 'tamagui';

// ============================================================================
// TAMAGUI TOKENS (inlined from theme tokens to avoid import-time issues)
// ============================================================================

// Brand palette
const brandOrange = '#EB6522';
const brandOrangeStrong = '#CC4400';
const brandOrangeSoft = '#FFE0CC';
const brandOrangeBright = '#F47A3A';
const brandOrangeDeep = '#A93D0A';
const brandStar = '#FBBF24';
const brandStarDark = '#A66A00';
const brandStarSoft = '#FFF4CC';
const brandSuccess = '#2D6A4F';
const brandSuccessSoft = '#E5F1EB';
const brandSuccessStrong = '#1F513B';
const brandWarning = '#9A6700';
const brandWarningSoft = '#FFF4D6';
const brandWarningStrong = '#744D00';
const brandError = '#B42318';
const brandErrorSoft = '#FDE8E7';
const brandErrorStrong = '#8E1B12';

// Neutral — Light
const lightBg = '#FFFCF9';
const lightBgAlt = '#FAF7F4';
const lightSurface = '#F5F1ED';
const lightSurfaceElevated = '#FFFFFF';
const lightSurfaceSunken = '#EEE8E3';
const lightBorderSubtle = '#EEE8E3';
const lightBorderDefault = '#E8E1DB';
const lightBorderStrong = '#DED5CE';
const lightTextPrimary = '#1B1816';
const lightTextSecondary = '#6B625C';
const lightTextTertiary = '#7B716A';
const lightTextDisabled = '#A0968E';
const lightTextInverse = '#FFF9F5';
const lightTextBrand = '#B8420D';
const lightActionPrimaryBg = '#CC4400';
const lightActionPrimaryFg = '#FFFFFF';
const lightActionPrimaryPressed = '#A93D0A';
const lightActionSecondaryBg = '#FFE0CC';
const lightActionSecondaryFg = '#A93D0A';
const lightActionSecondaryBorder = '#F2C7B0';
const lightOverlay = 'rgba(27, 24, 22, 0.4)';

// Neutral — Dark
const darkBg = '#0F0D0C';
const darkBgAlt = '#14110F';
const darkSurface = '#1C1917';
const darkSurfaceElevated = '#26221F';
const darkSurfaceSunken = '#0B0908';
const darkBorderSubtle = '#29241F';
const darkBorderDefault = '#342F2A';
const darkBorderStrong = '#48413B';
const darkTextPrimary = '#FFF9F5';
const darkTextSecondary = '#C9C0B8';
const darkTextTertiary = '#9B9189';
const darkTextDisabled = '#706861';
const darkTextInverse = '#1B1816';
const darkTextBrand = '#FF9A68';
const darkActionPrimaryBg = '#EB6522';
const darkActionPrimaryFg = '#FFFFFF';
const darkActionPrimaryPressed = '#F47A3A';
const darkActionSecondaryBg = '#2A211D';
const darkActionSecondaryFg = '#FF9A68';
const darkActionSecondaryBorder = '#4A3A32';
const darkOverlay = 'rgba(15, 13, 12, 0.6)';

// Spacing
const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
  massive: 64,
  extreme: 80,
};

// Radius
const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
  full: 9999,
};

const tamaguiColors = {
  // Brand
  brandOrange,
  brandOrangeStrong,
  brandOrangeSoft,
  brandOrangeBright,
  brandOrangeDeep,
  brandStar,
  brandStarDark,
  brandStarSoft,
  brandSuccess,
  brandSuccessSoft,
  brandSuccessStrong,
  brandWarning,
  brandWarningSoft,
  brandWarningStrong,
  brandError,
  brandErrorSoft,
  brandErrorStrong,

  // Light
  lightBg,
  lightBgAlt,
  lightSurface,
  lightSurfaceElevated,
  lightSurfaceSunken,
  lightBorderSubtle,
  lightBorderDefault,
  lightBorderStrong,
  lightTextPrimary,
  lightTextSecondary,
  lightTextTertiary,
  lightTextDisabled,
  lightTextInverse,
  lightTextBrand,
  lightActionPrimaryBg,
  lightActionPrimaryFg,
  lightActionPrimaryPressed,
  lightActionSecondaryBg,
  lightActionSecondaryFg,
  lightActionSecondaryBorder,
  lightOverlay,

  // Dark
  darkBg,
  darkBgAlt,
  darkSurface,
  darkSurfaceElevated,
  darkSurfaceSunken,
  darkBorderSubtle,
  darkBorderDefault,
  darkBorderStrong,
  darkTextPrimary,
  darkTextSecondary,
  darkTextTertiary,
  darkTextDisabled,
  darkTextInverse,
  darkTextBrand,
  darkActionPrimaryBg,
  darkActionPrimaryFg,
  darkActionPrimaryPressed,
  darkActionSecondaryBg,
  darkActionSecondaryFg,
  darkActionSecondaryBorder,
  darkOverlay,

  // Status (shared)
  statusSuccessPrimary: brandSuccess,
  statusSuccessSoft: brandSuccessSoft,
  statusWarningPrimary: brandWarning,
  statusWarningSoft: brandWarningSoft,
  statusErrorPrimary: brandError,
  statusErrorSoft: brandErrorSoft,
  statusStarPrimary: brandStar,
  statusStarSoft: brandStarSoft,

  // Legacy aliases (for existing tamagui usage)
  primary: brandOrange,
  primaryDark: brandOrangeStrong,
  primaryLight: brandOrangeSoft,
  star: brandStar,
  success: brandSuccess,
  warning: brandWarning,
  accent: '#CC0000',

  light_bg: lightBg,
  light_bgAlt: lightBgAlt,
  light_surface: lightSurface,
  light_surfaceElevated: lightSurfaceElevated,
  light_border: lightBorderDefault,
  light_hairline: lightBorderSubtle,
  light_text: lightTextPrimary,
  light_textMuted: lightTextSecondary,
  light_textFaint: lightTextTertiary,
  light_onPrimary: lightTextInverse,
  light_overlay: lightOverlay,

  dark_bg: darkBg,
  dark_bgAlt: darkBgAlt,
  dark_surface: darkSurface,
  dark_surfaceElevated: darkSurfaceElevated,
  dark_border: darkBorderDefault,
  dark_hairline: darkBorderSubtle,
  dark_text: darkTextPrimary,
  dark_textMuted: darkTextSecondary,
  dark_textFaint: darkTextTertiary,
  dark_onPrimary: darkTextInverse,
  dark_overlay: darkOverlay,
};

const tokens = createTokens({
  size: {
    xxs: spacing.xxs,
    xs: spacing.xs,
    sm: spacing.sm,
    md: spacing.md,
    true: spacing.md,
    lg: spacing.lg,
    xl: spacing.xl,
    xxl: spacing.xxl,
    xxxl: spacing.xxxl,
    huge: spacing.huge,
    massive: spacing.massive,
    extreme: spacing.extreme,
  },
  space: {
    xxs: spacing.xxs,
    xs: spacing.xs,
    sm: spacing.sm,
    md: spacing.md,
    true: spacing.md,
    lg: spacing.lg,
    xl: spacing.xl,
    xxl: spacing.xxl,
    xxxl: spacing.xxxl,
    huge: spacing.huge,
    massive: spacing.massive,
    extreme: spacing.extreme,
  },
  radius: {
    xs: radius.xs,
    sm: radius.sm,
    md: radius.md,
    lg: radius.lg,
    xl: radius.xl,
    xxl: radius.xxl,
    pill: radius.pill,
    full: radius.full,
  },
  zIndex: {
    xxs: -1,
    xs: 0,
    sm: 10,
    md: 100,
    true: 100,
    lg: 1000,
    xl: 2000,
    xxl: 5000,
  },
  color: tamaguiColors,
});

// Font configuration
const fontWeightRegular = '400';
const fontWeightMedium = '500';
const fontWeightSemibold = '600';
const fontWeightBold = '700';
const fontWeightExtrabold = '800';
const fontWeightBlack = '900';

const headingFont = createFont({
  family: 'System',
  size: {
    1: 11,   // micro
    2: 12,   // caption
    3: 14,   // bodySmall
    4: 16,   // body
    5: 17,   // bodyLarge
    6: 17,   // title
    7: 20,   // h3
    8: 24,   // h2
    9: 28,   // h1
  },
  weight: {
    1: fontWeightRegular,
    2: fontWeightMedium,
    3: fontWeightSemibold,
    4: fontWeightBold,
    5: fontWeightExtrabold,
    6: fontWeightBlack,
  },
  lineHeight: {
    1: 14,
    2: 16,
    3: 22,
    4: 24,
    5: 26,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
  },
  letterSpacing: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: -0.4,
    6: -0.4,
  },
});

const bodyFont = createFont({
  family: 'System',
  size: {
    1: 11,
    2: 12,
    3: 14,
    4: 16,
    5: 17,
    6: 17,
    7: 20,
    8: 24,
    9: 28,
  },
  weight: {
    1: fontWeightRegular,
    2: fontWeightMedium,
    3: fontWeightSemibold,
    4: fontWeightBold,
  },
  lineHeight: {
    1: 14,
    2: 16,
    3: 22,
    4: 24,
    5: 26,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
  },
  letterSpacing: {
    1: 0,
    2: 0.2,
  },
});

/**
 * Tamagui config — minimal, only for primitives (Text in EmptyState, etc.)
 * All app styling flows through the custom ThemeContext (src/theme/).
 * This config inlines values from src/theme/ to avoid import-time issues.
 * Do not mirror palette changes here — src/theme/ is the single source of truth.
 */
const config = createTamagui({
  defaultTheme: 'light',
  tokens,
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
  themes: {
    light: {
      background: lightBg,
      color: lightTextPrimary,
      placeholderColor: lightTextTertiary,
    },
    dark: {
      background: darkBg,
      color: darkTextPrimary,
      placeholderColor: darkTextTertiary,
    },
  },
  media: {
    xs: { maxWidth: 660 },
    sm: { maxWidth: 800 },
    md: { maxWidth: 1020 },
    lg: { maxWidth: 1280 },
    xl: { maxWidth: 1420 },
    xxl: { maxWidth: 1600 },
    gtXs: { minWidth: 661 },
    gtSm: { minWidth: 801 },
    gtMd: { minWidth: 1021 },
    gtLg: { minWidth: 1281 },
    gtXl: { minWidth: 1421 },
    short: { maxHeight: 820 },
    tall: { minHeight: 821 },
    hoverNone: { hover: 'none' },
    pointerCoarse: { pointer: 'coarse' },
  },
  shorthands: {
    bg: 'backgroundColor',
    bgAlt: 'backgroundColor',
    surface: 'backgroundColor',
    surfaceElevated: 'backgroundColor',
    border: 'borderColor',
    hairline: 'borderColor',
    text: 'color',
    textMuted: 'color',
    textFaint: 'color',
    onPrimary: 'color',
    overlay: 'backgroundColor',
    primary: 'backgroundColor',
    primaryDark: 'backgroundColor',
    primaryLight: 'backgroundColor',
    star: 'color',
    success: 'backgroundColor',
    warning: 'backgroundColor',
    accent: 'backgroundColor',
    p: 'padding',
    px: 'paddingHorizontal',
    py: 'paddingVertical',
    m: 'margin',
    mx: 'marginHorizontal',
    my: 'marginVertical',
    r: 'borderRadius',
    rt: 'borderTopRadius',
    rb: 'borderBottomRadius',
    rs: 'borderStartRadius',
    re: 'borderEndRadius',
    br: 'borderRadius',
    btr: 'borderTopRightRadius',
    btl: 'borderTopLeftRadius',
    bbr: 'borderBottomRightRadius',
    bbl: 'borderBottomLeftRadius',
    z: 'zIndex',
    fs: 'fontSize',
    fw: 'fontWeight',
    lh: 'lineHeight',
    ls: 'letterSpacing',
    ta: 'textAlign',
    ff: 'fontFamily',
    op: 'opacity',
    abs: 'position',
    absTL: 'absoluteTopLeft',
    absTR: 'absoluteTopRight',
    absBL: 'absoluteBottomLeft',
    absBR: 'absoluteBottomRight',
    inset: 'inset',
    insetX: 'insetHorizontal',
    insetY: 'insetVertical',
    gap: 'gap',
    rowGap: 'rowGap',
    columnGap: 'columnGap',
    flex: 'flex',
    flexDir: 'flexDirection',
    flexWrap: 'flexWrap',
    align: 'alignItems',
    justify: 'justifyContent',
    self: 'alignSelf',
    grow: 'flexGrow',
    shrink: 'flexShrink',
    basis: 'flexBasis',
    w: 'width',
    h: 'height',
    minW: 'minWidth',
    maxW: 'maxWidth',
    minH: 'minHeight',
    maxH: 'maxHeight',
    size: 'size',
    sq: 'size',
  },
});

export type AppConfig = typeof config;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;