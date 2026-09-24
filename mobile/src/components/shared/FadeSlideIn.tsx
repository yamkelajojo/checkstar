import type { ReactNode } from 'react';
import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import type { StyleProp, ViewStyle } from 'react-native';
import { useReducedMotion } from './useReducedMotion';
import { durations } from '../../theme/motion';

const EASE_OUT = Easing.out(Easing.cubic);

interface FadeSlideInProps {
  children: ReactNode;
  /** Delay before the entrance starts (ms). */
  delay?: number;
  /** Rise distance in px. */
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * FadeSlideIn — one subtle mount entrance: opacity 0→1 with a small rise.
 *
 * Deliberately minimal (no scale, no rotate, no direction-aware offsets,
 * no tab re-triggering). Runs once per mount, respects Reduce Motion.
 */
export function FadeSlideIn({ children, delay = 0, distance = 8, style }: FadeSlideInProps) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
      return;
    }
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: durations.standard, easing: EASE_OUT }),
    );
  }, [reduceMotion, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: distance * (1 - progress.value) }],
  }));

  // When reduceMotion is enabled, render children directly (no wrapper state)
  if (reduceMotion) {
    return <>{children}</>;
  }

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

export { stagger } from '../../theme/motion';
