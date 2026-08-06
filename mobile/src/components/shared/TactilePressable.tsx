import { useCallback } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet } from 'react-native';
import { useReducedMotion } from './useReducedMotion';
import { haptic } from '../../lib/haptics';
import type { HapticIntent } from '../../lib/haptics';

const PRESS_IN = { damping: 18, stiffness: 450 };
const PRESS_OUT = { damping: 22, stiffness: 400 };

type Variant = 'default' | 'compact' | 'card' | 'assertive';

interface TactilePressableProps extends Omit<PressableProps, 'style'> {
  variant?: Variant;
  hapticOnPress?: HapticIntent;
  style?: StyleProp<ViewStyle>;
}

/**
 * GreenBidder-style spring-compress pressable. Scaled to a 44pt hit target
 * and snaps to end state under Reduce Motion.
 */
export function TactilePressable({
  variant = 'default',
  hapticOnPress = 'tap',
  style,
  onPress,
  children,
  ...rest
}: TactilePressableProps) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = useCallback(() => {
    if (reduceMotion) return;
    scale.value = withSpring(0.96, PRESS_IN);
  }, [reduceMotion, scale]);

  const handlePressOut = useCallback(() => {
    cancelAnimation(scale);
    scale.value = withSpring(1, PRESS_OUT);
  }, [reduceMotion, scale]);

  const handlePress = useCallback(
    (event: any) => {
      if (hapticOnPress) void haptic(hapticOnPress);
      onPress?.(event);
    },
    [onPress, hapticOnPress],
  );

  return (
    <Animated.View style={[styles.base, variantStyle[variant], scaleStyle, style]}>
      <Pressable
        {...rest}
        hitSlop={8}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
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
    minHeight: 44,
    justifyContent: 'center',
  },
});