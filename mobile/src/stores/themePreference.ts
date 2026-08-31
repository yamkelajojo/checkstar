import { create } from 'zustand';
import { useColorScheme } from 'react-native';
import { storage, STORAGE_KEYS } from '../lib/storage';
import type { ThemeName } from '../theme/colors';

export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemePreferenceState {
  preference: ThemePreference;
  resolved: ThemeName;
  init: () => Promise<void>;
  setPreference: (preference: ThemePreference) => Promise<void>;
}

function resolveTheme(
  preference: ThemePreference,
  systemScheme: string | null | undefined,
): ThemeName {
  if (preference === 'system') {
    return systemScheme === 'dark' ? 'dark' : 'light';
  }
  return preference;
}

export const useThemePreference = create<ThemePreferenceState>((set, get) => ({
  preference: 'system',
  resolved: 'light',

  async init() {
    const saved = await storage.get<ThemePreference>(STORAGE_KEYS.themePreference);
    if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
      set({ preference: saved });
    }
  },

  async setPreference(preference: ThemePreference) {
    await storage.set(STORAGE_KEYS.themePreference, preference);
    set({ preference });
  },
}));
