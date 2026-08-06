import { create } from 'zustand';
import { AccessibilityInfo } from 'react-native';

interface MotionPreferencesState {
  reduceMotion: boolean;
  init: () => Promise<void>;
}

export const useMotionPreferences = create<MotionPreferencesState>((set) => ({
  reduceMotion: false,

  async init() {
    const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
    set({ reduceMotion });
    AccessibilityInfo.addEventListener('reduceMotionChanged', (value) =>
      set({ reduceMotion: value }),
    );
  },
}));