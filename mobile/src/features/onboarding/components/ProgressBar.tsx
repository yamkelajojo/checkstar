import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useTheme } from '../../../theme';
import { semanticRadius, semanticSpacing } from '../../../theme/spacing';
import { PROGRESS_SPRING } from '../../../theme/motion';

interface ProgressBarProps {
  current: number;
  total: number;
  accentColor?: string;
  motionState?: { activeIndex: { value: number }; slideCount: number } | (() => { activeIndex: { value: number }; slideCount: number });
}

function ProgressBarDot({
  index,
  activeIndex,
  current,
  accentColor,
  trackColor,
}: {
  index: number;
  activeIndex?: Animated.SharedValue<number>;
  current: number;
  accentColor: string;
  trackColor: string;
}) {
  const dotStyle = useAnimatedStyle(() => {
    const active = activeIndex ? activeIndex.value : current - 1;
    const delta = Math.abs(active - index);
    return {
      width: withSpring(interpolate(delta, [0, 1], [14, 6], Extrapolate.CLAMP), PROGRESS_SPRING),
      opacity: withSpring(interpolate(delta, [0, 1], [1, 0.5], Extrapolate.CLAMP), PROGRESS_SPRING),
    };
  });

  const isPassed = index < current;
  return (
    <Animated.View
      style={[
        styles.dot,
        dotStyle,
        { backgroundColor: isPassed ? accentColor : trackColor },
      ]}
    />
  );
}

export function ProgressBar({
  current,
  total,
  accentColor,
  motionState,
}: ProgressBarProps) {
  const theme = useTheme();
  const progress = (current / total) * 100;
  const motion = typeof motionState === 'function' ? motionState() : motionState;
  const activeIndex = motion?.activeIndex;
  const trackColor = theme.colors.border.subtle;

  const fillStyle = useAnimatedStyle(() => ({
    width: withSpring(`${progress}%`, PROGRESS_SPRING),
  }));

  return (
    <View style={styles.container}>
      <View style={styles.track} />
      <Animated.View style={[styles.fill, fillStyle, { backgroundColor: accentColor }]} />

      <View style={styles.dots}>
        {Array.from({ length: total }).map((_, index) => (
          <ProgressBarDot
            key={index}
            index={index}
            activeIndex={activeIndex}
            current={current}
            accentColor={accentColor ?? theme.colors.text.primary}
            trackColor={trackColor}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', height: 4, marginBottom: semanticSpacing.xl },
  track: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    borderRadius: semanticRadius.badge,
  },
  fill: { position: 'absolute', height: '100%', borderRadius: semanticRadius.badge },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot: { height: 6, borderRadius: semanticRadius.badge },
});
