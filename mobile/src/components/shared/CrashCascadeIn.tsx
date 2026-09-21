import React, { useEffect, useRef } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { SPRING_APPLE_LIST } from '../../theme/curves';
import { useReducedMotion } from './useReducedMotion';

interface CrashCascadeInProps {
  children: React.ReactNode;
  index: number;
  delay?: number;
  style?: any;
}

/**
 * CrashCascadeIn — Apple-Polished List Entrance
 * Each product card arrives with dedicated animation: y + scale + opacity
 * Stagger capped, total delay reasonable. No element just appears.
 * Uses Apple list spring: stiffness 350, damping 28 — buttery, not bouncy.
 */
export function CrashCascadeIn({ children, index, delay = 0, style }: CrashCascadeInProps) {
  const reduceMotion = useReducedMotion();
  const hasAnimated = useRef(false);
  const translateY = useSharedValue(reduceMotion ? 0 : 14);
  const opacity = useSharedValue(reduceMotion ? 1 : 0);
  const scale = useSharedValue(reduceMotion ? 1 : 0.96);

  useEffect(() => {
    if (reduceMotion || hasAnimated.current) return;
    hasAnimated.current = true;

    // Apple stagger: 40ms per item, capped, feels like App Store
    const staggerDelay = 40 + index * 38;
    const totalDelay = staggerDelay + delay;

    translateY.value = withDelay(totalDelay, withSpring(0, SPRING_APPLE_LIST));
    opacity.value = withDelay(totalDelay, withTiming(1, { duration: 260 }));
    scale.value = withDelay(totalDelay, withSpring(1, SPRING_APPLE_LIST));
  }, [index, delay, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>
  );
}
