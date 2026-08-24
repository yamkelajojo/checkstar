import { TactilePressable } from './TactilePressable';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { typeScale, weights, letterSpacing } from '../../theme/typography';
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
      fontSize={typeScale.caption}
      fontWeight={weights.bold}
      letterSpacing={letterSpacing.wide}
      textTransform="uppercase"
      color={active ? theme.colors.onPrimary : brand.primary}
      paddingHorizontal={16}
    >
      {label}
    </TamaguiText>
  );
  if (reduceMotion) {
    return (
      <TactilePressable
        onPress={onPress}
        hapticOnPress={undefined}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        style={{
          borderRadius: 999,
          backgroundColor: active ? brand.primary : theme.colors.surface,
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
        hapticOnPress="tap"
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        style={{
          borderRadius: 999,
          backgroundColor: active ? brand.primary : theme.colors.surface,
          minWidth: 56,
        }}
      >
        {content}
      </TactilePressable>
    </FadeSlideIn>
  );
}