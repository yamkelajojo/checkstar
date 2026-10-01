import { useCallback } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  cancelAnimation,
  interpolate,
} from 'react-native-reanimated';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useReducedMotion } from './useReducedMotion';
import { haptic } from '../../lib/haptics';
import { PRESS_IN_SPRING, PRESS_OUT_SPRING, CARD_PRESS_IN_SPRING, CARD_PRESS_OUT_SPRING } from '../../theme/motion';

type Variant = 'default' | 'compact' | 'card' | 'assertive';

type HapticMode = boolean | 'tap' | 'light' | 'commit' | 'impact' | 'success' | 'warning' | 'error' | 'selection';

interface TactilePressableProps extends Omit<PressableProps, 'style'> {
  variant?: Variant;
  pressScale?: number;
  haptic?: HapticMode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * TactilePressable — The Atomic Interactive Element
 *
 * Every pressable thing in the app uses this. Provides:
 *
 *     • Spring-physics compression on press (scale + lift)
 *     • Optional haptic feedback (off by default — opt-in per instance)
 *     • UI-thread animation via Reanimated
 *
 * ─── Variants ──────────────────────────────────────────────────
 * default    → compress (0.97) + lift (-1px). Buttons, small cards.
 * compact    → compress (0.98) only. Chips, list rows, small tappables.
 * card       → compress (0.985) only, gentle spring. Big content cards.
 *              Lifts read as "floaty" on large surfaces — use card
 *              variant when the user presses a full-width listing card.
 * assertive  → compress (0.95) + sink (+1px). Destructive actions.
 *
 * ─── Haptic ───────────────────────────────────────────────────
 * Off by default. Pass haptic prop to enable:
 *   <TactilePressable haptic onPress={...}>           light tap
 *   <TactilePressable haptic="commit" onPress={...}>  medium
 *   <TactilePressable haptic="success" ...>           success pattern
 *   <TactilePressable haptic="selection" ...>         toggle tick
 */
export function TactilePressable({
  children,
  style,
  variant = 'default',
  pressScale,
  haptic: hapticMode = false,
  disabled = false,
  onPress,
  onPressIn: externalPressIn,
  onPressOut: externalPressOut,
  accessibilityRole = 'button',
  ...rest
}: TactilePressableProps) {
  const reduceMotion = useReducedMotion();
  const pressed = useSharedValue(0);

  const config = (() => {
    switch (variant) {
      case 'compact':
        return { scale: pressScale ?? 0.98, lift: 0, useCardSpring: false };
      case 'card':
        return { scale: pressScale ?? 0.985, lift: 0, useCardSpring: true };
      case 'assertive':
        return { scale: pressScale ?? 0.95, lift: 1, useCardSpring: false };
      default:
        return { scale: pressScale ?? 0.97, lift: -1, useCardSpring: false };
    }
  })();

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(pressed.value, [0, 1], [1, config.scale]);
    const translateY = interpolate(pressed.value, [0, 1], [0, config.lift]);
    return {
      transform: [{ scale }, { translateY }],
    };
  });

  const fireHaptic = () => {
    if (!hapticMode) return;
    if (hapticMode === true || hapticMode === 'tap') haptic.tap();
    else if (hapticMode === 'light') haptic.light();
    else if (hapticMode === 'commit') haptic.commit();
    else if (hapticMode === 'impact') haptic.impact();
    else if (hapticMode === 'success') haptic.success();
    else if (hapticMode === 'warning') haptic.warning();
    else if (hapticMode === 'error') haptic.error();
    else if (hapticMode === 'selection') haptic.selection();
  };

  const handlePressIn = (e: any) => {
    if (!disabled && !reduceMotion) {
      const inSpring = config.useCardSpring ? CARD_PRESS_IN_SPRING : PRESS_IN_SPRING;
      pressed.value = withSpring(1, inSpring);
      fireHaptic();
    }
    externalPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    if (!disabled && !reduceMotion) {
      const outSpring = config.useCardSpring ? CARD_PRESS_OUT_SPRING : PRESS_OUT_SPRING;
      pressed.value = withSpring(0, outSpring);
    }
    externalPressOut?.(e);
  };

  const flatStyle = style ? StyleSheet.flatten(style) : undefined;
  const shouldStretch =
    variant === 'card' ||
    flatStyle?.width === '100%' ||
    typeof flatStyle?.width === 'number' ||
    flatStyle?.alignSelf === 'stretch' ||
    flatStyle?.justifyContent === 'space-between' ||
    (typeof flatStyle?.flex === 'number' && flatStyle.flex > 0);

  return (
    <Animated.View
      style={[styles.base, variantStyle[variant], animatedStyle, style]}
    >
      <Pressable
        {...rest}
        style={{
          width: shouldStretch ? '100%' : undefined,
          flexDirection: flatStyle?.flexDirection ?? 'column',
          alignItems:
            variant === 'card' ? 'stretch' : (flatStyle?.alignItems ?? 'center'),
          justifyContent: flatStyle?.justifyContent ?? 'center',
          gap: flatStyle?.gap ?? 0,
        }}
        accessibilityRole={accessibilityRole}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={disabled ? undefined : onPress}
        disabled={disabled}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const variantStyle: Record<Variant, StyleProp<ViewStyle>> = {
  default: {},
  compact: {},
  card: { borderRadius: 16 },
  assertive: { borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.04)' },
};

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
  },
});
