import { create } from 'zustand';
import { AccessibilityInfo } from 'react-native';

interface MotionPreferencesState {
  reduceMotion: boolean;
  init: () => Promise<void>;
  dispose: () => void;
}

let subscription: { remove: () => void } | null = null;

export const useMotionPreferences = create<MotionPreferencesState>((set) => ({
  reduceMotion: false,

  async init() {
    const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
    set({ reduceMotion });
    subscription?.remove();
    subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) =>
      set({ reduceMotion: value }),
    );
  },

  dispose() {
    subscription?.remove();
    subscription = null;
  },
}));