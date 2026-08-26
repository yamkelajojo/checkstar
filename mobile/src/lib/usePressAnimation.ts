import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useReducedMotion } from '../components/shared/useReducedMotion';
import { haptic } from './haptics';

const PRESS_IN = { damping: 18, stiffness: 450 };
const PRESS_OUT = { damping: 22, stiffness: 400 };

export interface UsePressAnimationOptions {
  scale?: number;
  opacity?: number;
  hapticOnPress?: boolean;
}

export interface UsePressAnimationReturn {
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  onPressIn: () => void;
  onPressOut: () => void;
}

/**
 * GreenBidder-style press animation hook.
 * Runs on UI thread via Reanimated shared values for 120fps smoothness.
 * Provides spring compression + optional fade + haptic feedback.
 */
export function usePressAnimation(
  options: UsePressAnimationOptions = {}
): UsePressAnimationReturn {
  const { scale: targetScale = 0.96, opacity: targetOpacity = 1, hapticOnPress = true } = options;
  const reduceMotion = useReducedMotion();

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const onPressIn = useCallback(() => {
    if (reduceMotion) return;
    scale.value = withSpring(targetScale, PRESS_IN);
    if (targetOpacity !== 1) {
      opacity.value = withSpring(targetOpacity, PRESS_IN);
    }
    if (hapticOnPress) haptic.tap();
  }, [reduceMotion, targetScale, targetOpacity, hapticOnPress]);

  const onPressOut = useCallback(() => {
    if (reduceMotion) return;
    scale.value = withSpring(1, PRESS_OUT);
    if (targetOpacity !== 1) {
      opacity.value = withSpring(1, PRESS_OUT);
    }
  }, [reduceMotion, targetOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return { animatedStyle, onPressIn, onPressOut };
}