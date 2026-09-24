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
  index?: number;
}

/**
 * Signature collection pill — Apple-polished
 * Active = primary fill with shadow, inactive = surface elevated with border subtle
 * Scale 0.96 →1 with snap spring, hover 1.05
 */
export function CollectionPill({ label, active = false, onPress, index = 0 }: CollectionPillProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();

  const content = (
    <TamaguiText
      fontSize={11}
      fontWeight={active ? '700' : '600'}
      letterSpacing={0.4}
      textTransform="uppercase"
      color={active ? '#fff' : theme.colors.text.secondary}
      paddingHorizontal={12}
    >
      {label}
    </TamaguiText>
  );

  const pillStyle = {
    borderRadius: 999,
    backgroundColor: active ? theme.colors.text.primary : theme.colors.surface.primary,
    minWidth: 48,
    height: 32,
    minHeight: 32 as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: active ? theme.colors.text.primary : theme.colors.border.subtle,
    shadowColor: active ? '#000' : 'transparent',
    shadowOffset: { width: 0, height: active ? 2 : 0 },
    shadowOpacity: active ? 0.12 : 0,
    shadowRadius: active ? 6 : 0,
    elevation: active ? 2 : 0,
  };

  if (reduceMotion) {
    return (
      <TactilePressable onPress={onPress} haptic={undefined} accessibilityRole="button" accessibilityState={{ selected: active }} style={pillStyle}>
        {content}
      </TactilePressable>
    );
  }

  return (
    <FadeSlideIn delay={index * 20} distance={8}>
      <TactilePressable onPress={onPress} haptic="selection" accessibilityRole="button" accessibilityState={{ selected: active }} style={pillStyle}>
        {content}
      </TactilePressable>
    </FadeSlideIn>
  );
}
