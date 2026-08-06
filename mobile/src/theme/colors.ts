export const brand = {
  primary: '#EB6522',
  primaryDark: '#CC4400',
  primaryLight: '#FFE0CC',
  accent: '#CC0000',
  success: '#2D6A4F',
  warning: '#E9C46A',
  star: '#fbbf24',
};

export interface Palette {
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

export const light: Palette = {
  bg: '#ffffff',
  bgAlt: '#fafafa',
  surface: '#f4f4f5',
  surfaceElevated: '#ffffff',
  border: '#f4f4f5',
  hairline: '#e4e4e7',
  text: '#18181b',
  textMuted: '#71717a',
  textFaint: '#a1a1aa',
  onPrimary: '#ffffff',
  overlay: 'rgba(24,24,27,0.4)',
};

export const dark: Palette = {
  bg: '#09090b',
  bgAlt: '#0b0c0e',
  surface: '#18181b',
  surfaceElevated: '#27272a',
  border: '#27272a',
  hairline: '#3f3f46',
  text: '#ffffff',
  textMuted: '#a1a1aa',
  textFaint: '#71717a',
  onPrimary: '#ffffff',
  overlay: 'rgba(9,9,11,0.6)',
};

export type ThemeName = 'light' | 'dark';

export const palettes: Record<ThemeName, Palette> = { light, dark };
