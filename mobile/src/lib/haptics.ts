import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticIntent = 'tap' | 'light' | 'commit' | 'impact' | 'success' | 'warning' | 'error' | 'selection';

const isIOS = Platform.OS === 'ios';

/**
 * HAPTICS — The Invisible Half of Tactility
 *
 * Haptics are the period at the end of a visual sentence. They confirm
 * what the eye already saw. Used sparingly, they make an app feel alive.
 * Used too often, they make a phone feel broken.
 *
 * This helper wraps expo-haptics with an intent-based API. Callers say
 * `haptic.tap()`, not `Haptics.impactAsync(...)`. The helper hides the
 * library, so we can swap implementations later without touching callers.
 *
 * Android note: haptic support varies by device. expo-haptics degrades
 * gracefully (no-ops on unsupported hardware) so we never wrap in try/catch.
 *
 * Principle: haptics accompany motion, never replace it. If an animation
 * happens, a haptic may reinforce it. Silent actions stay silent.
 */

export const haptic = {
  /**
   * Light tap — for most button presses, card taps, toggles.
   * The default. 90% of haptic calls in the app use this.
   * Barely perceptible, but your thumb knows it happened.
   */
  tap: () => {
    Haptics.impactAsync(
      isIOS
        ? Haptics.ImpactFeedbackStyle.Light
        : Haptics.ImpactFeedbackStyle.Medium
    );
  },

  /**
   * Legacy alias kept for compatibility with existing call sites.
   * Behaves exactly like tap().
   */
  light: () => {
    Haptics.impactAsync(
      isIOS
        ? Haptics.ImpactFeedbackStyle.Light
        : Haptics.ImpactFeedbackStyle.Medium
    );
  },

  /**
   * Medium — for committing actions. Submitting a form, selecting a role,
   * confirming a choice. The user made a decision.
   */
  commit: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  /**
   * Heavy — rare. Reserved for major state changes. Archive a listing,
   * delete something, complete checkout. Use when the action is weighty.
   */
  impact: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  /**
   * Success — a distinct pattern the user recognises as "done, well."
   * Review submitted, listing created, payment succeeded.
   * Slightly celebratory. Don't overuse or it loses meaning.
   */
  success: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  /**
   * Warning — non-critical attention. Price outside range, validation
   * warning. The user should notice but doesn't need to stop.
   */
  warning: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },

  /**
   * Error — something went wrong. Network failure, validation error.
   * Use sparingly. Pair with visual error feedback.
   */
  error: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },

  /**
   * Selection — fires on incremental change. Swiping between cards,
   * dragging a slider through steps, tab change.
   * The subtlest haptic. Almost a whisper.
   */
  selection: () => {
    Haptics.selectionAsync();
  },
};

export const haptics = haptic;
export default haptic;