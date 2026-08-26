import { View, Text } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { TactilePressable } from './TactilePressable';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { fontWeight } from '../../theme/typography';
import { semanticRadius } from '../../theme/spacing';

interface StepperProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

/** Inline quantity stepper with tactile +/- buttons and screen-reader labels. */
export function Stepper({ quantity, onIncrement, onDecrement }: StepperProps) {
  const theme = useTheme();
  const buttonStyle = { width: 36, borderRadius: semanticRadius.buttonPill };
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: theme.colors.surface.primary,
        borderRadius: semanticRadius.buttonPill,
        paddingHorizontal: 4,
      }}
    >
      <TactilePressable
        onPress={onDecrement}
        haptic="tap"
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        testID="stepper-decrease"
        style={buttonStyle}
      >
        <Minus size={16} color={quantity <= 1 ? theme.colors.text.tertiary : brand.orange} />
      </TactilePressable>
      <Text
        style={{ minWidth: 20, textAlign: 'center', fontWeight: fontWeight.bold, color: theme.colors.text.primary }}
        accessibilityLiveRegion="polite"
      >
        {quantity}
      </Text>
      <TactilePressable
        onPress={onIncrement}
        haptic="tap"
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        testID="stepper-increase"
        style={buttonStyle}
      >
        <Plus size={16} color={brand.orange} />
      </TactilePressable>
    </View>
  );
}