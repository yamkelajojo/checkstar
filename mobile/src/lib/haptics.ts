import * as Haptics from 'expo-haptics';

export type HapticIntent = 'tap' | 'commit' | 'success' | 'warning' | 'selection' | 'error';

export async function haptic(intent: HapticIntent): Promise<void> {
  if (__DEV__ && intent === 'warning') {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    return;
  }
  switch (intent) {
    case 'commit':
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case 'success':
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'warning':
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      break;
    case 'error':
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;
    case 'selection':
      await Haptics.selectionAsync();
      break;
    case 'tap':
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
  }
}