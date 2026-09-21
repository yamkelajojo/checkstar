import { View } from 'react-native';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  useAnimatedReaction,
  interpolate,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { useTheme } from '../../theme';
import { semanticRadius, semanticSpacing } from '../../theme/spacing';
import { FadeSlideIn } from './FadeSlideIn';

interface SkeletonCardProps {
  width?: DimensionValue;
  height?: DimensionValue;
  orientation?: 'grid' | 'carousel';
  style?: StyleProp<ViewStyle>;
  index?: number;
}

/**
 * Loading placeholder — Apple-polished shimmer
 * Mirrors product card shape with y8 entrance, border subtle, shimmer
 */
export function SkeletonCard({ width, height, orientation = 'grid', style, index = 0 }: SkeletonCardProps) {
  const theme = useTheme();
  const isCarousel = orientation === 'carousel';
  const cardWidth = width ?? (isCarousel ? 180 : '48%');
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withDelay(index * 40, withRepeat(withTiming(1, { duration: 1200 }), -1, false));
  }, [index]);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.5, 1, 0.5]),
  }));

  return (
    <FadeSlideIn delay={index * 40} distance={8} initialScale={0.97}>
      <Animated.View
        style={[
          {
            width: cardWidth,
            height: height ?? (isCarousel ? 220 : 250),
            borderRadius: semanticRadius.card,
            backgroundColor: theme.colors.surface.primary,
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
            overflow: 'hidden',
            padding: semanticSpacing.cardPadding,
            gap: semanticSpacing.xs,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.03,
            shadowRadius: 4,
            elevation: 0.5,
          },
          style,
        ]}
      >
        <Animated.View
          style={[
            {
              flex: 1,
              backgroundColor: theme.colors.surface.elevated,
              borderRadius: semanticRadius.imageFrame,
            },
            shimmerStyle,
          ]}
        />
        <View style={{ gap: 6 }}>
          <Animated.View
            style={[
              { height: 12, borderRadius: 6, backgroundColor: theme.colors.border.subtle, width: '70%' },
              shimmerStyle,
            ]}
          />
          <Animated.View
            style={[
              { height: 14, borderRadius: 6, backgroundColor: theme.colors.surface.elevated, width: '40%' },
              shimmerStyle,
            ]}
          />
        </View>
      </Animated.View>
    </FadeSlideIn>
  );
}
