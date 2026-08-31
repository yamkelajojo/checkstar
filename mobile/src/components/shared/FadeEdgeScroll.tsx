import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';
import { semanticSpacing } from '../../theme/spacing';

// jest-expo + reanimated 4 mock gaps — fallback to plain RN components
const LinearGradient: any = (ExpoLinearGradient as any) ?? View;
const AScrollView: any = (Animated as any)?.ScrollView ?? ScrollView;
const AView: any = (Animated as any)?.View ?? View;

interface FadeEdgeScrollProps {
  children: React.ReactNode | ((scrollX: SharedValue<number>, viewportWidth: SharedValue<number>) => React.ReactNode);
  snapInterval?: number;
  fadeWidth?: number;
  contentPaddingLeft?: number;
  contentPaddingRight?: number;
  backgroundColor?: string;
  decelerationRate?: number | 'fast' | 'normal';
}

/**
 * FadeEdgeScroll — Horizontal carousel with scroll-aware edge fades
 * Ported from GreenBidder (FadeEdgeScroll.jsx) to Checkstar design tokens.
 *
 * - Tracks scrollX / contentWidth / viewportWidth as shared values (UI thread)
 * - Left fade grows in over first 48px of scroll; right fade fades out near end
 * - Uses LinearGradient overlays with pointerEvents none so scroll remains interactive
 * - Exposes shared values via render-prop for ScrollAwareCard parallax if needed
 */
export function FadeEdgeScroll({
  children,
  snapInterval,
  fadeWidth = 28,
  contentPaddingLeft = semanticSpacing.screenPadding,
  contentPaddingRight = semanticSpacing.screenPadding,
  backgroundColor,
  decelerationRate = 0.92 as const,
}: FadeEdgeScrollProps) {
  const theme = useTheme();
  const bg = backgroundColor ?? theme.colors.background.primary;
  const scrollX = useSharedValue(0);
  const contentWidth = useSharedValue(0);
  const viewportWidth = useSharedValue(0);

  // jest-expo mock for reanimated v4 does not provide useAnimatedScrollHandler — fallback to plain scroll for tests
  const scrollHandler: any =
    typeof useAnimatedScrollHandler === 'function'
      ? useAnimatedScrollHandler({
          onScroll: (event: any) => {
            scrollX.value = event.contentOffset.x;
            contentWidth.value = event.contentSize.width;
            viewportWidth.value = event.layoutMeasurement.width;
          },
        })
      : undefined;

  const leftFadeStyle =
    typeof useAnimatedStyle === 'function'
      ? useAnimatedStyle(() => ({
          opacity: interpolate(scrollX.value, [0, 48], [0, 1], Extrapolation.CLAMP),
        }))
      : { opacity: 0 };

  const rightFadeStyle =
    typeof useAnimatedStyle === 'function'
      ? useAnimatedStyle(() => {
          const maxScroll = contentWidth.value - viewportWidth.value;
          if (maxScroll <= 0) return { opacity: 0 };
          return {
            opacity: interpolate(scrollX.value, [maxScroll - 48, maxScroll], [1, 0], Extrapolation.CLAMP),
          };
        })
      : { opacity: 1 };

  return (
    <View style={styles.wrapper}>
      <AScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        decelerationRate={decelerationRate as any}
        snapToInterval={snapInterval}
        snapToAlignment="start"
        contentContainerStyle={{
          paddingLeft: contentPaddingLeft,
          paddingRight: contentPaddingRight,
          paddingVertical: semanticSpacing.xs,
          gap: semanticSpacing.inlineGap,
          alignItems: 'center',
        }}
      >
        {typeof children === 'function' ? (children as any)(scrollX, viewportWidth) : children}
      </AScrollView>

      <AView style={[styles.fadeLeft, { width: fadeWidth }, leftFadeStyle]} pointerEvents="none">
        <LinearGradient
          colors={[bg, `${bg}00`]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </AView>

      <AView style={[styles.fadeRight, { width: fadeWidth }, rightFadeStyle]} pointerEvents="none">
        <LinearGradient
          colors={[`${bg}00`, bg]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </AView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative' },
  fadeLeft: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  fadeRight: { position: 'absolute', right: 0, top: 0, bottom: 0 },
});
