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
import { YStack, Text as TamaguiText } from 'tamagui';

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
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Animated.View style={[{ alignItems: 'center', gap: 8 }, style]}>
        <Icon size={44} color={theme.colors.textFaint} />
        <TamaguiText fontSize={17} fontWeight="700" color={theme.colors.text} textAlign="center">
          {title}
        </TamaguiText>
        <TamaguiText fontSize={14} color={theme.colors.textMuted} textAlign="center">
          {caption}
        </TamaguiText>
        {action}
      </Animated.View>
    </View>
  );
}