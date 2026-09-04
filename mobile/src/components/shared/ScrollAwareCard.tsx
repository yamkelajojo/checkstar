import React from 'react';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

interface ScrollAwareCardProps {
  children: React.ReactNode;
  scrollX: SharedValue<number>;
  itemWidth: number;
  spacing: number;
  index: number;
  style?: any;
}

export function ScrollAwareCard({
  children,
  scrollX,
  itemWidth,
  spacing,
  index,
  style,
}: ScrollAwareCardProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const itemOffset = index * (itemWidth + spacing);
    const distanceFromCenter = Math.abs(scrollX.value - itemOffset);
    const centerOffset = itemWidth / 2;

    const inputRange = [0, centerOffset * 0.6, centerOffset * 1.2];
    const scale = interpolate(
      distanceFromCenter,
      inputRange,
      [1, 1, 0.92],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      distanceFromCenter,
      inputRange,
      [1, 1, 0.65],
      Extrapolation.CLAMP,
    );
    const translateY = interpolate(
      distanceFromCenter,
      inputRange,
      [0, 0, -8],
      Extrapolation.CLAMP,
    );

    return {
      transform: [{ scale }, { translateY }],
      opacity,
    };
  });

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}
