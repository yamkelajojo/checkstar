import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticIntent = 'tap' | 'commit' | 'success' | 'warning' | 'selection' | 'error';

/** Intent-based haptics: callers pass a domain intent, not a raw Haptics constant. */
export function haptic(intent: HapticIntent): void {
  const isIOS = Platform.OS === 'ios';
  switch (intent) {
    case 'tap':
      void Haptics.impactAsync(isIOS ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
      break;
    case 'commit':
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case 'success':
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'warning':
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      break;
    case 'error':
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;
    case 'selection':
      void Haptics.selectionAsync();
      break;
  }
}

// Aliases for callers that already import as `haptics`
export const haptics = haptic;
export default haptic;