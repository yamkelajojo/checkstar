import { TactilePressable } from './TactilePressable';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { textStyle, fontWeight, letterSpacing } from '../../theme/typography';
import { semanticRadius, semanticSpacing } from '../../theme/spacing';
import { useReducedMotion } from './useReducedMotion';
import { FadeSlideIn } from './FadeSlideIn';
import { Text as TamaguiText } from 'tamagui';

interface CollectionPillProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

/** Signature collection pill: active = primary fill, inactive = tinted surface. */
export function CollectionPill({ label, active = false, onPress }: CollectionPillProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const content = (
    <TamaguiText
      fontSize={textStyle.micro.size}
      fontWeight={fontWeight.medium}
      letterSpacing={letterSpacing.wide}
      textTransform="uppercase"
      color={active ? theme.colors.text.inverse : theme.colors.text.brand}
      paddingHorizontal={semanticSpacing.inlineGap}
    >
      {label}
    </TamaguiText>
  );
  // Compact filter pill: 28px height, lighter visual weight
  const pillStyle = {
    borderRadius: semanticRadius.chip,
    backgroundColor: active ? brand.orange : theme.colors.surface.elevated,
    minWidth: 48,
    height: 28,
    minHeight: 28 as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: active ? brand.orange : theme.colors.border.subtle,
  };
  if (reduceMotion) {
    return (
      <TactilePressable
        onPress={onPress}
        haptic={undefined}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        style={pillStyle}
      >
        {content}
      </TactilePressable>
    );
  }
  return (
    <FadeSlideIn>
      <TactilePressable
        onPress={onPress}
        haptic="tap"
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        style={pillStyle}
      >
        {content}
      </TactilePressable>
    </FadeSlideIn>
  );
}