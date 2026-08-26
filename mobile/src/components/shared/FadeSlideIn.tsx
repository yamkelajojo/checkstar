import type { ReactNode } from 'react';
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
import { ENTRANCE_SPRING, stagger } from '../../theme/motion';

interface FadeSlideInProps {
  children: ReactNode;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * FadeSlideIn — Mount Entrance Primitive
 *
 * Wraps any children and animates them in from below on mount.
 * Compound motion: opacity 0→1 + translateY 12→0, driven by ONE
 * shared value for guaranteed sync.
 *
 * Use for: screen content entrance, form fields, section headers,
 * any element that should "arrive" rather than "appear".
 *
 * ─── Stagger ──────────────────────────────────────────────────
 * When rendering a list of these, pass `delay` per item:
 *   <FadeSlideIn delay={0}>    → arrives immediately
 *   <FadeSlideIn delay={70}>   → arrives 70ms later
 *   <FadeSlideIn delay={140}>  → arrives 140ms later
 * The ripple reads as "the app is thoughtfully laying things out".
 *
 * ─── Props ────────────────────────────────────────────────────
 * delay       → ms to wait before animating (default 0)
 * distance    → px to slide from below (default 12, subtle)
 * style       → merged with the animated wrapper
 * children    → anything
 */
export function FadeSlideIn({
  children,
  delay = 0,
  distance = 12,
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
    progress.value = withDelay(delay, withSpring(1, ENTRANCE_SPRING));
  }, [reduceMotion, delay, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [distance, 0]) },
    ],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
}

export { stagger };
