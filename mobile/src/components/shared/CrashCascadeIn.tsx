import React, { useEffect, useRef } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  cancelAnimation,
} from 'react-native-reanimated';
import { SPRING_APPLE_LIST } from '../../theme/curves';
import { useReducedMotion } from './useReducedMotion';
import { useTabTransition } from '../../navigation/TabScreenWrapper';
import { getStaggerDelayForContent } from '../../navigation/tabTransitions';

interface CrashCascadeInProps {
  children: React.ReactNode;
  index: number;
  delay?: number;
  style?: any;
  disableTabCoordination?: boolean;
}

/**
 * CrashCascadeIn — Apple-Polished List Entrance + Tab-Coordinated
 * Each product card arrives with dedicated animation: y + scale + opacity
 * Stagger capped, total delay reasonable. No element just appears.
 * Uses Apple list spring: stiffness 350, damping 28 — buttery, not bouncy.
 *
 * Now tab-aware: re-triggers with coordinated stagger when tab becomes active
 */
export function CrashCascadeIn({ children, index, delay = 0, style, disableTabCoordination = false }: CrashCascadeInProps) {
  const reduceMotion = useReducedMotion();
  const hasAnimated = useRef(false);
  const translateY = useSharedValue(reduceMotion ? 0 : 14);
  const opacity = useSharedValue(reduceMotion ? 1 : 0);
  const scale = useSharedValue(reduceMotion ? 1 : 0.96);
  const translateX = useSharedValue(0);
  const tabTransition = useTabTransition();
  const prevTabActive = useRef(tabTransition.isActive);

  useEffect(() => {
    if (reduceMotion) {
      translateY.value = 0;
      opacity.value = 1;
      scale.value = 1;
      translateX.value = 0;
      return;
    }

    const tabBecameActive = !disableTabCoordination && !prevTabActive.current && tabTransition.isActive;
    prevTabActive.current = tabTransition.isActive;

    const shouldAnimate = !hasAnimated.current || tabBecameActive;

    if (!shouldAnimate) return;

    // Cancel any ongoing
    cancelAnimation(translateY);
    cancelAnimation(opacity);
    cancelAnimation(scale);
    cancelAnimation(translateX);

    if (tabBecameActive) {
      // Reset for re-animation
      translateY.value = 14;
      opacity.value = 0;
      scale.value = 0.96;
      translateX.value = tabTransition.direction * 8;
    }

    hasAnimated.current = true;

    // Apple stagger: 40ms per item, capped, feels like App Store
    // When tab becomes active, add coordination delay
    const baseStagger = getStaggerDelayForContent(index, true, 40);
    const coordinationExtra = tabBecameActive ? 80 : 0;
    const totalDelay = baseStagger + delay + coordinationExtra;

    translateY.value = withDelay(totalDelay, withSpring(0, SPRING_APPLE_LIST));
    translateX.value = withDelay(totalDelay, withSpring(0, SPRING_APPLE_LIST));
    opacity.value = withDelay(totalDelay, withTiming(1, { duration: 260 }));
    scale.value = withDelay(totalDelay, withSpring(1, SPRING_APPLE_LIST));
  }, [index, delay, reduceMotion, tabTransition.isActive, tabTransition.direction, disableTabCoordination]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>
  );
}
