import type { ReactNode } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { useReducedMotion } from './useReducedMotion';

const EASE_SETTLE = Easing.out(Easing.cubic);

interface FadeSlideInProps {
  children: ReactNode;
  delay?: number;
  distance?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

/** Mount entrance: opacity 0→1 + translateY. Snaps to end state under Reduce Motion. */
export function FadeSlideIn({
  children,
  delay = 0,
  distance = 12,
  duration = 350,
  style,
}: FadeSlideInProps) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
      return;
    }
    cancelAnimation(progress);
    progress.value = withDelay(delay, withTiming(1, { duration, easing: EASE_SETTLE }));
  }, [reduceMotion, delay, duration, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: distance * (1 - progress.value) }],
  }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}