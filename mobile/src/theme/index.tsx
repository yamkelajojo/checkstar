import { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import {
  palettes,
  type ColorPalette,
  type ThemeName,
  componentTokens,
  getPalette,
} from './colors';
import { textStyle, semanticText, type TextStyle, type SemanticTextStyle } from './typography';
import { spacing, semanticSpacing, radius, semanticRadius, borderWidth, elevation, hitTarget } from './spacing';
import { useThemePreference, type ThemePreference } from '../stores/themePreference';

// ============================================================================
// THEME INTERFACE (Backward compatible + new semantic tokens)
// ============================================================================

/**
 * Legacy flat palette interface — maintained for backward compat.
 * @deprecated Use semantic color access via theme.colors.background.primary etc.
 */
export interface LegacyPalette {
  bg: string;
  bgAlt: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  hairline: string;
  text: string;
  textMuted: string;
  textFaint: string;
  onPrimary: string;
  overlay: string;
}

/**
 * Full theme object with semantic tokens.
 * Components should use theme.colors.background.primary etc.
 */
export interface Theme {
  name: ThemeName;
  colors: ColorPalette;
  legacy: LegacyPalette;           // Backward compat
  text: typeof textStyle;
  semanticText: typeof semanticText;
  spacing: typeof spacing;
  semanticSpacing: typeof semanticSpacing;
  radius: typeof radius;
  semanticRadius: typeof semanticRadius;
  borderWidth: typeof borderWidth;
  elevation: typeof elevation;
  hitTarget: typeof hitTarget;
  componentTokens: typeof componentTokens;
}

// ============================================================================
// THEME CONTEXT
// ============================================================================

const defaultTheme: Theme = {
  name: 'light',
  colors: palettes.light,
  legacy: {
    bg: palettes.light.legacy.bg,
    bgAlt: palettes.light.legacy.bgAlt,
    surface: palettes.light.legacy.surface,
    surfaceElevated: palettes.light.legacy.surfaceElevated,
    border: palettes.light.legacy.border,
    hairline: palettes.light.hairline,
    text: palettes.light.legacy.text,
    textMuted: palettes.light.legacy.textMuted,
    textFaint: palettes.light.legacy.textFaint,
    onPrimary: palettes.light.legacy.onPrimary,
    overlay: palettes.light.overlay,
  },
  text: textStyle,
  semanticText: semanticText,
  spacing,
  semanticSpacing,
  radius,
  semanticRadius,
  borderWidth,
  elevation,
  hitTarget,
  componentTokens,
};

export const ThemeContext = createContext<Theme>(defaultTheme);

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Get the full theme from context (set by ThemeProvider).
 * Use this in components for access to all tokens.
 */
export function useTheme(): Theme {
  return useContext(ThemeContext);
}

/**
 * Get theme from system color scheme (no context needed).
 * Use for components outside the provider or for initial render.
 */
export function useThemeFromSystem(): Theme {
  const scheme = useColorScheme();
  const name: ThemeName = scheme === 'dark' ? 'dark' : 'light';
  const colors = getPalette(name);
  const legacy = {
    bg: colors.legacy.bg,
    bgAlt: colors.legacy.bgAlt,
    surface: colors.legacy.surface,
    surfaceElevated: colors.legacy.surfaceElevated,
    border: colors.legacy.border,
    hairline: colors.hairline,
    text: colors.legacy.text,
    textMuted: colors.legacy.textMuted,
    textFaint: colors.legacy.textFaint,
    onPrimary: colors.legacy.onPrimary,
    overlay: colors.overlay,
  };
  return {
    name,
    colors,
    legacy,
    text: textStyle,
    semanticText: semanticText,
    spacing,
    semanticSpacing,
    radius,
    semanticRadius,
    borderWidth,
    elevation,
    hitTarget,
    componentTokens,
  };
}

// ============================================================================
// CONVENIENCE HOOKS (for common patterns)
// ============================================================================

/** Get just the color palette */
export function useColors(): ColorPalette {
  return useTheme().colors;
}

/** Get just the legacy flat palette (backward compat) */
export function useLegacyColors(): LegacyPalette {
  return useTheme().legacy;
}

/** Get semantic text styles */
export function useTextStyles(): typeof semanticText {
  return useTheme().semanticText;
}

/** Get semantic spacing */
export function useSemanticSpacing(): typeof semanticSpacing {
  return useTheme().semanticSpacing;
}

/** Get semantic radius */
export function useSemanticRadius(): typeof semanticRadius {
  return useTheme().semanticRadius;
}

/** Get elevation tokens */
export function useElevation(): typeof elevation {
  return useTheme().elevation;
}

/** Get component tokens */
export function useComponentTokens(): typeof componentTokens {
  return useTheme().componentTokens;
}

// ============================================================================
// THEME PROVIDER (for app-level setup)
// ============================================================================

interface ThemeProviderProps {
  children: React.ReactNode;
  /** Force a specific theme (overrides system) */
  forcedTheme?: ThemeName;
}

function buildTheme(name: ThemeName): Theme {
  const colors = getPalette(name);
  return {
    name,
    colors,
    legacy: {
      bg: colors.legacy.bg,
      bgAlt: colors.legacy.bgAlt,
      surface: colors.legacy.surface,
      surfaceElevated: colors.legacy.surfaceElevated,
      border: colors.legacy.border,
      hairline: colors.hairline,
      text: colors.legacy.text,
      textMuted: colors.legacy.textMuted,
      textFaint: colors.legacy.textFaint,
      onPrimary: colors.legacy.onPrimary,
      overlay: colors.overlay,
    },
    text: textStyle,
    semanticText,
    spacing,
    semanticSpacing,
    radius,
    semanticRadius,
    borderWidth,
    elevation,
    hitTarget,
    componentTokens,
  };
}

export function ThemeProvider({ children, forcedTheme }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const preference = useThemePreference((s) => s.preference);

  const theme = useMemo(() => {
    if (forcedTheme) return buildTheme(forcedTheme);

    let name: ThemeName;
    if (preference === 'system') {
      name = systemScheme === 'dark' ? 'dark' : 'light';
    } else {
      name = preference;
    }
    return buildTheme(name);
  }, [systemScheme, preference, forcedTheme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}