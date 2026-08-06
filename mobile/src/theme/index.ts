import { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { palettes, type Palette, type ThemeName } from './colors';

export interface Theme {
  name: ThemeName;
  colors: Palette;
}

export const ThemeContext = createContext<Theme>({ name: 'light', colors: palettes.light });

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

export function useThemeFromSystem(): Theme {
  const scheme = useColorScheme();
  const name: ThemeName = scheme === 'dark' ? 'dark' : 'light';
  return { name, colors: palettes[name] };
}