import type { ReactNode } from 'react';
import { useRef } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  cancelAnimation,
  interpolate,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { useReducedMotion } from './useReducedMotion';
import { APPLE_ENTRANCE_SPRING, stagger } from '../../theme/motion';

interface FadeSlideInProps {
  children: ReactNode;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
  once?: boolean;
  scaleFrom?: number;
}

/**
 * FadeSlideIn — Apple-Polished Mount Entrance
 * Nothing just appears — everything arrives with y+scale+opacity
 * Uses Apple spring: stiffness 400, damping 30 — feels like iOS 18
 */
export function FadeSlideIn({
  children,
  delay = 0,
  distance = 10,
  style,
  once = true,
  scaleFrom = 0.97,
}: FadeSlideInProps) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
      return;
    }
    if (once && hasAnimated.current) {
      progress.value = 1;
      return;
    }
    cancelAnimation(progress);
    progress.value = withDelay(delay, withSpring(1, APPLE_ENTRANCE_SPRING));
    hasAnimated.current = true;
  }, [reduceMotion, delay, once, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [distance, 0]) },
      { scale: interpolate(progress.value, [0, 1], [scaleFrom, 1]) },
    ],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
}

export { stagger };
