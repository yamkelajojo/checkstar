import { View, Text } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { TactilePressable } from './TactilePressable';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { weights } from '../../theme/typography';

interface StepperProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

/** Inline quantity stepper with tactile +/- buttons and screen-reader labels. */
export function Stepper({ quantity, onIncrement, onDecrement }: StepperProps) {
  const theme = useTheme();
  const buttonStyle = { width: 36, borderRadius: 999 };
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: theme.colors.surface,
        borderRadius: 999,
        paddingHorizontal: 4,
      }}
    >
      <TactilePressable
        onPress={onDecrement}
        hapticOnPress="tap"
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        style={buttonStyle}
      >
        <Minus size={16} color={quantity <= 1 ? theme.colors.textFaint : brand.primary} />
      </TactilePressable>
      <Text
        style={{ minWidth: 20, textAlign: 'center', fontWeight: weights.bold, color: theme.colors.text }}
        accessibilityLiveRegion="polite"
      >
        {quantity}
      </Text>
      <TactilePressable
        onPress={onIncrement}
        hapticOnPress="tap"
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        style={buttonStyle}
      >
        <Plus size={16} color={brand.primary} />
      </TactilePressable>
    </View>
  );
}