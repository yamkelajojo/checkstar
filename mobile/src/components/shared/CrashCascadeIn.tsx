import React, { useEffect, useRef } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { CRASH_SPRING } from '../../theme/curves';
import { useReducedMotion } from './useReducedMotion';

interface CrashCascadeInProps {
  children: React.ReactNode;
  index: number;
  delay?: number;
  style?: any;
}

export function CrashCascadeIn({ children, index, delay = 0, style }: CrashCascadeInProps) {
  const reduceMotion = useReducedMotion();
  const hasAnimated = useRef(false);
  const translateX = useSharedValue(reduceMotion ? 0 : 100);
  const opacity = useSharedValue(reduceMotion ? 1 : 0);
  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion || hasAnimated.current) return;
    hasAnimated.current = true;

    const staggerDelay = 100 + index * 85;
    const totalDelay = staggerDelay + delay;

    translateX.value = withDelay(
      totalDelay,
      withSpring(0, CRASH_SPRING),
    );

    opacity.value = withDelay(
      totalDelay,
      withTiming(1, { duration: 200 }),
    );

    scaleX.value = withDelay(
      totalDelay,
      withSequence(
        withTiming(1.08, { duration: 150, easing: Easing.out(Easing.cubic) }),
        withTiming(0.95, { duration: 100, easing: Easing.in(Easing.cubic) }),
        withTiming(1, { duration: 200 }),
      ),
    );

    scaleY.value = withDelay(
      totalDelay,
      withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(1.04, { duration: 80, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 200 }),
      ),
    );
  }, [index, delay, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: 1 },
      { scaleX: scaleX.value },
      { scaleY: scaleY.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}
