import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useReducedMotion } from './useReducedMotion';
import { durations } from '../../theme/motion';

const EASE_OUT = Easing.out(Easing.cubic);

interface CrashCascadeInProps {
  children: ReactNode;
  /** List index — drives a small capped stagger. */
  index: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * CrashCascadeIn — gentle list entrance: each item fades in and rises 8px,
 * staggered 30ms per item (capped at 10 items so long lists don't wait).
 *
 * No scale/rotate, no tab re-triggering, no per-item scroll transforms.
 * Runs once per mount, respects Reduce Motion.
 */
export function CrashCascadeIn({ children, index, delay = 0, style }: CrashCascadeInProps) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
      return;
    }
    const stagger = Math.min(index, 10) * 30;
    progress.value = withDelay(
      delay + stagger,
      withTiming(1, { duration: durations.standard, easing: EASE_OUT }),
    );
  }, [reduceMotion, delay, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: 8 * (1 - progress.value) }],
  }));

  if (reduceMotion) {
    return <View style={style}>{children}</View>;
  }

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
