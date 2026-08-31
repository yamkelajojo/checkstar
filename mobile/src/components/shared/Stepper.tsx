import { View, Text, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withDelay } from 'react-native-reanimated';
import { useEffect } from 'react';
import { Minus, Plus } from 'lucide-react-native';
import { TactilePressable } from './TactilePressable';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { fontWeight } from '../../theme/typography';
import { semanticRadius } from '../../theme/spacing';
import { haptic } from '../../lib/haptics';

interface StepperProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

/** Inline quantity stepper with tactile +/- buttons and screen-reader labels. */
export function Stepper({ quantity, onIncrement, onDecrement }: StepperProps) {
  const theme = useTheme();
  const buttonSize = 32;
  const buttonStyle: ViewStyle = { width: buttonSize, height: buttonSize, borderRadius: semanticRadius.buttonPill, alignItems: 'center', justifyContent: 'center' };
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withSequence(
      withSpring(1.35, { damping: 10, stiffness: 200, mass: 0.3 }),
      withDelay(180, withSpring(1, { damping: 18, stiffness: 180, mass: 1 })),
    );
  }, [quantity]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: theme.colors.surface.primary,
        borderRadius: semanticRadius.buttonPill,
        paddingHorizontal: 2,
      }}
    >
      <TactilePressable
        onPress={() => { haptic.commit(); onDecrement(); }}
        haptic="commit"
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        testID="stepper-decrease"
        style={buttonStyle}
      >
        <Minus size={14} color={quantity <= 1 ? theme.colors.text.tertiary : brand.orange} />
      </TactilePressable>
      <Animated.View style={[{ minWidth: 20, alignItems: 'center', justifyContent: 'center' }, pulseStyle]}>
        <Text style={{ textAlign: 'center', fontWeight: fontWeight.semibold, color: theme.colors.text.primary }} accessibilityLiveRegion="polite">
          {quantity}
        </Text>
      </Animated.View>
      <TactilePressable
        onPress={() => { haptic.commit(); onIncrement(); }}
        haptic="commit"
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        testID="stepper-increase"
        style={buttonStyle}
      >
        <Plus size={14} color={brand.orange} />
      </TactilePressable>
    </View>
  );
}