import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const isIOS = Platform.OS === 'ios';

export const haptic = {
  tap: () => {
    Haptics.impactAsync(
      isIOS
        ? Haptics.ImpactFeedbackStyle.Light
        : Haptics.ImpactFeedbackStyle.Medium
    );
  },
  light: () => {
    Haptics.impactAsync(
      isIOS
        ? Haptics.ImpactFeedbackStyle.Light
        : Haptics.ImpactFeedbackStyle.Medium
    );
  },
  commit: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  impact: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },
  success: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  warning: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },
  error: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
  selection: () => {
    Haptics.selectionAsync();
  },
};
