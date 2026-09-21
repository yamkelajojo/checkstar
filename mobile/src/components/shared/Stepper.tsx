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
import { springs } from '../../theme/motion';

interface StepperProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

/**
 * Inline quantity stepper — Apple-polished
 * Tactile +/- buttons with pill container, shadow, border subtle, spring press
 * Quantity pulses with appleBounce on change
 */
export function Stepper({ quantity, onIncrement, onDecrement }: StepperProps) {
  const theme = useTheme();
  const buttonSize = 30;
  const buttonStyle: ViewStyle = {
    width: buttonSize,
    height: buttonSize,
    borderRadius: buttonSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  };
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withSequence(
      withSpring(1.25, { damping: 14, stiffness: 400, mass: 0.4 }),
      withDelay(120, withSpring(1, springs.appleGentle)),
    );
  }, [quantity]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: theme.colors.surface.primary,
        borderRadius: semanticRadius.buttonPill,
        paddingHorizontal: 3,
        paddingVertical: 3,
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      <TactilePressable
        onPress={() => {
          haptic.selection();
          onDecrement();
        }}
        haptic="selection"
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        testID="stepper-decrease"
        style={[
          buttonStyle,
          {
            backgroundColor: quantity <= 1 ? theme.colors.surface.elevated : theme.colors.background.secondary,
          },
        ]}
      >
        <Minus size={12} color={quantity <= 1 ? theme.colors.text.tertiary : theme.colors.text.primary} strokeWidth={2.2} />
      </TactilePressable>

      <Animated.View style={[{ minWidth: 24, alignItems: 'center', justifyContent: 'center' }, pulseStyle]}>
        <Text
          style={{
            textAlign: 'center',
            fontWeight: fontWeight.bold,
            color: theme.colors.text.primary,
            fontSize: 13,
            letterSpacing: -0.2,
            minWidth: 20,
          }}
          accessibilityLiveRegion="polite"
        >
          {quantity}
        </Text>
      </Animated.View>

      <TactilePressable
        onPress={() => {
          haptic.selection();
          onIncrement();
        }}
        haptic="selection"
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        testID="stepper-increase"
        style={[
          buttonStyle,
          {
            backgroundColor: theme.colors.text.primary,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.15,
            shadowRadius: 3,
          },
        ]}
      >
        <Plus size={12} color={theme.colors.text.inverse} strokeWidth={2.5} />
      </TactilePressable>
    </View>
  );
}
