import type { ReactNode } from 'react';
import { useRef, useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  cancelAnimation,
  interpolate,
} from 'react-native-reanimated';
import type { StyleProp, ViewStyle } from 'react-native';
import { useReducedMotion } from './useReducedMotion';
import { APPLE_ENTRANCE_SPRING, stagger } from '../../theme/motion';
import { useTabTransition } from '../../navigation/TabScreenWrapper';

interface FadeSlideInProps {
  children: ReactNode;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
  once?: boolean;
  scaleFrom?: number;
  triggerKey?: number | string;
  initialScale?: number;
  disableTabCoordination?: boolean;
}

/**
 * FadeSlideIn — Apple-Polished Mount Entrance + Tab-Coordinated
 * Nothing just appears — everything arrives with y+scale+opacity
 * Uses Apple spring: stiffness 400, damping 30 — feels like iOS 18
 *
 * Now tab-aware: when inside TabTransitionContext and tab becomes active,
 * re-triggers entrance with direction-aware offset and coordinated stagger
 */
export function FadeSlideIn({
  children,
  delay = 0,
  distance = 10,
  style,
  once = true,
  scaleFrom = 0.97,
  triggerKey,
  initialScale,
  disableTabCoordination = false,
}: FadeSlideInProps) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const hasAnimated = useRef(false);
  const prevTriggerKey = useRef(triggerKey);
  const tabTransition = useTabTransition();
  const prevTabActive = useRef(tabTransition.isActive);

  // Support both scaleFrom and initialScale for backward compat
  const effectiveScaleFrom = initialScale ?? scaleFrom;

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
      return;
    }

    // Check if triggerKey changed
    const triggerChanged = triggerKey !== undefined && prevTriggerKey.current !== triggerKey;
    prevTriggerKey.current = triggerKey;

    // Check if tab became active
    const tabBecameActive = !disableTabCoordination && !prevTabActive.current && tabTransition.isActive;
    prevTabActive.current = tabTransition.isActive;

    const shouldAnimate =
      (!once || !hasAnimated.current) ||
      triggerChanged ||
      tabBecameActive;

    if (!shouldAnimate) {
      progress.value = 1;
      return;
    }

    cancelAnimation(progress);

    // When tab becomes active, add extra delay for coordination with tab slide
    // Tab slide is 280ms, inner content should start after 60ms + stagger
    let effectiveDelay = delay;
    if (tabBecameActive) {
      // Add base tab coordination delay + direction-aware micro offset
      effectiveDelay = delay + 60 + Math.abs(tabTransition.direction) * 10;
      // Reset to 0 first for re-animation
      progress.value = 0;
    } else if (!hasAnimated.current) {
      progress.value = 0;
    }

    progress.value = withDelay(effectiveDelay, withSpring(1, APPLE_ENTRANCE_SPRING));
    hasAnimated.current = true;
  }, [reduceMotion, delay, once, progress, triggerKey, tabTransition.isActive, tabTransition.direction, disableTabCoordination]);

  const animatedStyle = useAnimatedStyle(() => {
    // Direction-aware: subtle x translation based on tab direction when active transition
    const dir = disableTabCoordination ? 0 : tabTransition.direction;
    const xOffset = dir * 6 * (1 - progress.value);

    return {
      opacity: progress.value,
      transform: [
        { translateY: interpolate(progress.value, [0, 1], [distance, 0]) },
        { translateX: xOffset },
        { scale: interpolate(progress.value, [0, 1], [effectiveScaleFrom, 1]) },
      ],
    };
  });

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
}

export { stagger };
