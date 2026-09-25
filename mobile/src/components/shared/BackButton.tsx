import { ChevronLeft, X } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { semanticSpacing, semanticRadius, hitTarget } from '../../theme/spacing';
import { TactilePressable } from './TactilePressable';

type BackButtonVariant = 'back' | 'close';

interface BackButtonProps {
  variant?: BackButtonVariant;
  onPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
  style?: object;
}

const BUTTON_SIZE = hitTarget.minimum;
const BUTTON_RADIUS = BUTTON_SIZE / 2;
const ICON_SIZE = 18;
const ICON_STROKE_WIDTH = 2.2;
const HIT_SLOP = 12;

export function BackButton({ 
  variant = 'back', 
  onPress, 
  accessibilityLabel, 
  testID,
  style 
}: BackButtonProps) {
  const theme = useTheme();
  const icon = variant === 'close' ? X : ChevronLeft;
  const label = accessibilityLabel ?? (variant === 'close' ? 'Close' : 'Back');

  return (
    <TactilePressable
      onPress={onPress}
      haptic="selection"
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      style={{
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: BUTTON_RADIUS,
        backgroundColor: theme.colors.surface.elevated,
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
      hitSlop={{ top: HIT_SLOP, bottom: HIT_SLOP, left: HIT_SLOP, right: HIT_SLOP }}
    >
      <icon size={ICON_SIZE} color={theme.colors.text.primary} strokeWidth={ICON_STROKE_WIDTH} />
    </TactilePressable>
  );
}