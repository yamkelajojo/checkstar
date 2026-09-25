import { useEffect } from 'react';
import { View, Text } from 'react-native';
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
import { semanticText } from '../../theme/typography';
import { semanticSpacing } from '../../theme/spacing';

const EASE_SETTLE = Easing.out(Easing.cubic);

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  caption: string;
  action?: React.ReactNode;
}

/** Shared empty state: bare glyph (44px, text.tertiary, strokeWidth 1.75) → title → caption.
 * Gentle fade + 8px rise on mount. No chip, no border/shadow, no rotation. */
export function EmptyState({ icon: Icon, title, caption, action }: EmptyStateProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
      return;
    }
    progress.value = withDelay(120, withTiming(1, { duration: 280, easing: EASE_SETTLE }));
  }, [reduceMotion, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: 8 * (1 - progress.value) }],
  }));

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: semanticSpacing.screenPadding }}>
      <Animated.View style={[{ alignItems: 'center', gap: semanticSpacing.tightGap }, style]}>
        <Icon size={44} color={theme.colors.text.tertiary} strokeWidth={1.75} />
        <Text style={{ ...semanticText.sectionTitle, color: theme.colors.text.primary, textAlign: 'center' }}>
          {title}
        </Text>
        <Text style={{ ...semanticText.bodySecondary, color: theme.colors.text.secondary, textAlign: 'center' }}>
          {caption}
        </Text>
        {action}
      </Animated.View>
    </View>
  );
}