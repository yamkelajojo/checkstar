import { View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../../theme';

interface SkeletonCardProps {
  width?: number;
  height?: number;
  orientation?: 'grid' | 'carousel';
  style?: StyleProp<ViewStyle>;
}

/** Loading placeholder that mirrors the shape of a product card or carousel tile. */
export function SkeletonCard({ width, height, orientation = 'grid', style }: SkeletonCardProps) {
  const theme = useTheme();
  const isCarousel = orientation === 'carousel';
  const cardWidth = width ?? (isCarousel ? 180 : '48%' as unknown as number);
  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <View
        style={[
          {
            width: cardWidth as number,
            height: height ?? (isCarousel ? 220 : 250),
            borderRadius: 16,
            backgroundColor: theme.colors.surface,
            overflow: 'hidden',
          },
          style,
        ]}
      >
        <View style={{ flex: 1, margin: 10, backgroundColor: theme.colors.hairline, borderRadius: 12 }} />
        <View style={{ height: 12, margin: 10, marginTop: 0, backgroundColor: theme.colors.hairline, borderRadius: 6, width: '70%' }} />
        <View style={{ height: 14, margin: 10, marginTop: 0, backgroundColor: theme.colors.surfaceElevated, borderRadius: 6, width: '40%' }} />
      </View>
    </Animated.View>
  );
}