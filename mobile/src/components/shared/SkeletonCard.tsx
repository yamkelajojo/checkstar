import { View } from 'react-native';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { semanticRadius, semanticSpacing } from '../../theme/spacing';

interface SkeletonCardProps {
  width?: DimensionValue;
  height?: DimensionValue;
  orientation?: 'grid' | 'carousel';
  style?: StyleProp<ViewStyle>;
}

/** Loading placeholder that mirrors the shape of a product card or carousel tile. */
export function SkeletonCard({ width, height, orientation = 'grid', style }: SkeletonCardProps) {
  const theme = useTheme();
  const isCarousel = orientation === 'carousel';
  const cardWidth = width ?? (isCarousel ? 180 : '48%');
  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <View
        style={[
          {
            width: cardWidth,
            height: height ?? (isCarousel ? 220 : 250),
            borderRadius: semanticRadius.card,
            backgroundColor: theme.colors.surface.primary,
            overflow: 'hidden',
          },
          style,
        ]}
      >
        <View style={{ flex: 1, margin: semanticSpacing.cardPadding, backgroundColor: theme.colors.border.subtle, borderRadius: semanticRadius.imageFrame }} />
        <View style={{ height: 12, margin: semanticSpacing.cardPadding, marginTop: 0, backgroundColor: theme.colors.border.subtle, borderRadius: 6, width: '70%' }} />
        <View style={{ height: 14, margin: semanticSpacing.cardPadding, marginTop: 0, backgroundColor: theme.colors.surface.elevated, borderRadius: 6, width: '40%' }} />
      </View>
    </Animated.View>
  );
}