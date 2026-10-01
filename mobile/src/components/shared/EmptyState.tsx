import { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { useReducedMotion } from './useReducedMotion';
import { semanticText } from '../../theme/typography';
import { semanticSpacing } from '../../theme/spacing';

const EASE_SETTLE = Easing.out(Easing.cubic);

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  caption: string;
  action?: React.ReactNode;
}

/** Shared empty state — bare glyph (44px, text.tertiary, strokeWidth 1.75) →
 * title → caption, with a gentle fade + 8px rise on mount (280ms).
 * No chip background, no border/shadow, no rotation, no delay. */
export function EmptyState({ icon: Icon, title, caption, action }: EmptyStateProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
      return;
    }
    progress.value = withTiming(1, { duration: 280, easing: EASE_SETTLE });
  }, [reduceMotion, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: 8 * (1 - progress.value) }],
  }));

  return (
    <View
      style={{
        flex: 1,
        minHeight: 320,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: semanticSpacing.screenPadding,
        paddingTop: semanticSpacing.lg,
        paddingBottom: 72,
      }}
    >
      <View style={{ alignItems: 'center', gap: semanticSpacing.md, maxWidth: 320 }}>
        <Animated.View style={[{ alignItems: 'center', gap: semanticSpacing.tightGap }, style]}>
          <Icon size={44} color={theme.colors.text.tertiary} strokeWidth={1.75} />
          <Text
            style={{
              ...semanticText.sectionTitle,
              color: theme.colors.text.primary,
              textAlign: 'center',
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              ...semanticText.bodySecondary,
              color: theme.colors.text.secondary,
              textAlign: 'center',
              lineHeight: 20,
              maxWidth: 280,
            }}
          >
            {caption}
          </Text>
        </Animated.View>

        {action ? (
          <View style={{ marginTop: semanticSpacing.sm }}>{action}</View>
        ) : null}
      </View>
    </View>
  );
}
