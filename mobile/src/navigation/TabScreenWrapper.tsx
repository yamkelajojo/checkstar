import { ReactNode, useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useDerivedValue,
  interpolate,
  withDelay,
  type SharedValue,
} from 'react-native-reanimated';
import { useReducedMotion } from '../components/shared/useReducedMotion';
import { springs } from '../theme/motion';
import { getMotionBlurStyle, getMotionBlurIntensity } from './tabTransitions';

interface TabScreenWrapperProps {
  children: ReactNode;
  isActive: boolean;
  direction: SharedValue<number>;
  scrollPosition: SharedValue<number>;
  scrollOffset: SharedValue<number>;
  index: number;
  activeIndex: number;
}

/**
 * TabScreenWrapper — Apple-polished tab content with directional entrance + motion blur
 *
 * - Direction-aware: content enters from right when moving right, left when moving left
 * - Motion blur: subtle scaleX stretch + opacity dip during fast swipe
 * - Staggered inner content: coordinated via context (handled by children using FadeSlideIn)
 * - Snappy: Apple spring 400/30, 280ms, no delay fighting
 */
export function TabScreenWrapper({
  children,
  isActive,
  direction,
  scrollPosition,
  scrollOffset,
  index,
  activeIndex,
}: TabScreenWrapperProps) {
  const reduceMotion = useReducedMotion();
  const enterProgress = useSharedValue(isActive ? 1 : 0);
  const mountProgress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      enterProgress.value = isActive ? 1 : 0;
      mountProgress.value = 1;
      return;
    }

    if (isActive) {
      // Small delay to let tab bar indicator start moving first — feels coordinated
      enterProgress.value = withDelay(20, withSpring(1, springs.apple));
    } else {
      enterProgress.value = withSpring(0, { ...springs.apple, damping: 32 });
    }
  }, [isActive, reduceMotion]);

  useEffect(() => {
    // Initial mount entrance
    if (reduceMotion) {
      mountProgress.value = 1;
      return;
    }
    mountProgress.value = withDelay(index * 20, withSpring(1, springs.appleGentle));
  }, []);

  // Motion blur derived from scroll offset + direction
  const blurIntensity = useDerivedValue(() => {
    if (reduceMotion) return 0;

    const pos = scrollPosition.value + scrollOffset.value;
    const dist = Math.abs(pos - index);

    // Only apply blur when this page is involved in transition (dist <1.5)
    if (dist > 1.5) return 0;

    // Progress within transition: 0 at rest, 1 at mid
    const progress = Math.min(dist, 1);
    const offset = scrollOffset.value;

    // Use offset for velocity-like effect
    const velocity = Math.abs(offset) * 2;

    return getMotionBlurIntensity(velocity, progress * 0.8);
  });

  const animatedStyle = useAnimatedStyle(() => {
    if (reduceMotion) {
      return { opacity: 1, transform: [{ translateX: 0 }, { scale: 1 }] };
    }

    const blur = getMotionBlurStyle(blurIntensity.value);

    // Directional entrance: when tab becomes active, slide from direction
    // direction: 1 = moving right, so incoming from right (positive X)
    const dir = direction.value;

    // If this page is active, its translate is 0; if not, it's off-screen based on direction
    // But PagerView already handles native translation, so we add subtle parallax
    // Active page: translate from dir * 24 to 0
    // Inactive: slight parallax opposite

    const isCurrentlyActive = isActive;
    const baseTranslate = isCurrentlyActive
      ? interpolate(enterProgress.value, [0, 1], [dir * 32, 0])
      : 0;

    // Mount progress: initial subtle scale + opacity
    const mountOpacity = interpolate(mountProgress.value, [0, 1], [0, 1]);
    const mountScale = interpolate(mountProgress.value, [0, 1], [0.97, 1]);

    // Combine with blur
    const combinedOpacity = mountOpacity * blur.opacity * interpolate(enterProgress.value, [0, 1], [0.85, 1]);
    const combinedScaleX = mountScale * blur.scaleX;
    const combinedScaleY = mountScale * blur.scaleY;

    return {
      opacity: combinedOpacity,
      transform: [
        { translateX: baseTranslate },
        { scaleX: combinedScaleX },
        { scaleY: combinedScaleY },
      ],
    };
  });

  // Ghost layer for subtle motion blur trail — very low opacity, slight offset
  const ghostStyle = useAnimatedStyle(() => {
    if (reduceMotion) return { opacity: 0, transform: [{ translateX: 0 }] };

    const intensity = blurIntensity.value;
    if (intensity < 0.12) return { opacity: 0, transform: [{ translateX: 0 }] };

    const dir = direction.value || 1;
    const ghostOffset = dir * intensity * 8; // 0..~0.5px per intensity, max ~4px
    const ghostOpacity = intensity * 0.12; // very subtle

    return {
      opacity: ghostOpacity,
      transform: [{ translateX: ghostOffset }],
    };
  });

  return (
    <View style={{ flex: 1 }}>
      {/* Ghost trail for realistic motion blur — only visible during fast swipe */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            ...{ position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 },
            zIndex: 0,
          },
          ghostStyle,
        ]}
      >
        {null}
      </Animated.View>

      {/* Main content */}
      <Animated.View style={[{ flex: 1, zIndex: 1 }, animatedStyle]}>{children}</Animated.View>
    </View>
  );
}

/**
 * Context to let inner components know tab activation and direction
 * Used to stagger product entrances coordinated with tab transition
 */
import { createContext, useContext } from 'react';

interface TabTransitionContextValue {
  isActive: boolean;
  direction: number;
  activeIndex: number;
  index: number;
}

export const TabTransitionContext = createContext<TabTransitionContextValue>({
  isActive: false,
  direction: 0,
  activeIndex: 0,
  index: 0,
});

export function useTabTransition() {
  return useContext(TabTransitionContext);
}
