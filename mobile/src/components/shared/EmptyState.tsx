import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { useReducedMotion } from './useReducedMotion';
import { Text as TamaguiText } from 'tamagui';
import { textStyle } from '../../theme/typography';
import { semanticSpacing } from '../../theme/spacing';

const EASE_SETTLE = Easing.out(Easing.cubic);

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  caption: string;
  action?: React.ReactNode;
}

/** Shared empty state: centered glyph → title → one caption, delayed rise+scale. */
export function EmptyState({ icon: Icon, title, caption, action }: EmptyStateProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
      return;
    }
    progress.value = withDelay(200, withTiming(1, { duration: 600, easing: EASE_SETTLE }));
  }, [reduceMotion, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: 20 * (1 - progress.value) }, { scale: 0.95 + 0.05 * progress.value }],
  }));

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: semanticSpacing.screenPadding }}>
      <Animated.View style={[{ alignItems: 'center', gap: semanticSpacing.tightGap }, style]}>
        <Icon size={44} color={theme.colors.text.tertiary} />
        <TamaguiText {...textStyle.h3} color={theme.colors.text.primary} textAlign="center">
          {title}
        </TamaguiText>
        <TamaguiText {...textStyle.bodySmall} color={theme.colors.text.secondary} textAlign="center">
          {caption}
        </TamaguiText>
        {action}
      </Animated.View>
    </View>
  );
}