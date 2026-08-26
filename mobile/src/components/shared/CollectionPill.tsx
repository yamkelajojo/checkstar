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
      fontSize={textStyle.caption.size}
      fontWeight={fontWeight.bold}
      letterSpacing={letterSpacing.wide}
      textTransform="uppercase"
      color={active ? theme.colors.text.inverse : theme.colors.text.brand}
      paddingHorizontal={semanticSpacing.cardPadding}
    >
      {label}
    </TamaguiText>
  );
  if (reduceMotion) {
    return (
      <TactilePressable
        onPress={onPress}
        haptic={undefined}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        style={{
          borderRadius: semanticRadius.chip,
          backgroundColor: active ? brand.orange : theme.colors.surface.primary,
          minWidth: 56,
        }}
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
        style={{
          borderRadius: semanticRadius.chip,
          backgroundColor: active ? brand.orange : theme.colors.surface.primary,
          minWidth: 56,
        }}
      >
        {content}
      </TactilePressable>
    </FadeSlideIn>
  );
}