import { useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { useReducedMotion } from './useReducedMotion';
import { semanticText, textStyle, fontWeight } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
import { APPLE_ENTRANCE_SPRING, APPLE_LIST_SPRING } from '../../theme/motion';
import { FadeSlideIn } from './FadeSlideIn';
import { useTabTransition } from '../../navigation/TabScreenWrapper';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  caption: string;
  action?: React.ReactNode;
}

/**
 * Shared empty state — Apple-polished
 * Centered glyph → title → caption, with y+scale+blur entrance
 * Coordinated with tab transition: glyph scales with appleBounce, text fades with stagger
 */
export function EmptyState({ icon: Icon, title, caption, action }: EmptyStateProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const tabTransition = useTabTransition();
  const progress = useSharedValue(0);
  const iconScale = useSharedValue(reduceMotion ? 1 : 0.8);
  const iconRotate = useSharedValue(reduceMotion ? 0 : -4);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
      iconScale.value = 1;
      iconRotate.value = 0;
      return;
    }

    const isTabActivation = tabTransition.isActive && !hasAnimated.current;

    if (!hasAnimated.current || isTabActivation) {
      progress.value = 0;
      iconScale.value = 0.8;
      iconRotate.value = -4;

      const baseDelay = isTabActivation ? 120 : 200;
      progress.value = withDelay(baseDelay, withSpring(1, APPLE_ENTRANCE_SPRING));
      iconScale.value = withDelay(baseDelay, withSpring(1, { damping: 22, stiffness: 450, mass: 0.6 }));
      iconRotate.value = withDelay(baseDelay, withSpring(0, { damping: 26, stiffness: 320, mass: 0.85 }));
      hasAnimated.current = true;
    }
  }, [reduceMotion, tabTransition.isActive]);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotate.value}deg` },
      { translateY: interpolate(progress.value, [0, 1], [12, 0]) },
    ],
  }));

  const textStyleAnimated = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [10, 0]) },
      { scale: interpolate(progress.value, [0, 1], [0.97, 1]) },
    ],
  }));

  const actionStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [8, 0]) },
      { scale: interpolate(progress.value, [0, 1], [0.96, 1]) },
    ],
  }));

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: semanticSpacing.screenPadding }}>
      <View style={{ alignItems: 'center', gap: semanticSpacing.md, maxWidth: 320 }}>
        <Animated.View
          style={[
            {
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: theme.colors.surface.elevated,
              borderWidth: 1,
              borderColor: theme.colors.border.subtle,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 1,
            },
            iconStyle,
          ]}
        >
          <Icon size={32} color={theme.colors.text.tertiary} strokeWidth={1.75} />
        </Animated.View>

        <Animated.View style={[{ alignItems: 'center', gap: 6 }, textStyleAnimated]}>
          <Text style={{ ...semanticText.sectionTitle, color: theme.colors.text.primary, textAlign: 'center', letterSpacing: -0.2, fontWeight: fontWeight.bold }}>
            {title}
          </Text>
          <Text style={{ ...semanticText.bodySecondary, color: theme.colors.text.secondary, textAlign: 'center', lineHeight: 20, maxWidth: 280 }}>
            {caption}
          </Text>
        </Animated.View>

        {action ? (
          <Animated.View style={[{ marginTop: 4 }, actionStyle]}>
            <FadeSlideIn delay={320} distance={8} initialScale={0.96}>
              {action}
            </FadeSlideIn>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}
