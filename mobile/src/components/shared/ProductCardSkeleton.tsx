import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { semanticRadius, semanticSpacing } from '../../theme/spacing';
import { FadeSlideIn } from './FadeSlideIn';

/**
 * Loading placeholder that mirrors a ProductCard 1:1.
 * Same padding, image frame, backdrop circle, 2-line title, price, Add
 * pill — with a soft shimmer.
 */
export function ProductCardSkeleton({ index = 0 }: { index?: number }) {
  const theme = useTheme();
  const circleTint = theme.name === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(27,24,22,0.04)';
  const frameTint = theme.name === 'dark' ? 'rgba(27,24,22,0.4)' : 'rgba(255,255,255,0.9)';
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withDelay(index * 40, withRepeat(withTiming(1, { duration: 1200 }), -1, false));
  }, [index]);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.5, 1, 0.5]),
  }));

  return (
    <FadeSlideIn delay={index * 38} distance={10} style={{ flex: 1 }}>
      <View
        style={{
          flex: 1,
          width: '100%',
          backgroundColor: theme.colors.surface.primary,
          borderRadius: semanticRadius.card,
          padding: semanticSpacing.cardPadding,
          gap: semanticSpacing.elementGap,
          minHeight: 238,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 1,
        }}
      >
        <Animated.View
          style={[
            {
              height: 132,
              borderRadius: semanticRadius.imageFrame,
              backgroundColor: frameTint,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            },
            shimmerStyle,
          ]}
        >
          <View
            style={{
              width: 94,
              height: 94,
              borderRadius: 47,
              backgroundColor: circleTint,
            }}
          />
        </Animated.View>

        <View style={{ gap: 4 }}>
          <Animated.View style={[{ height: 12, borderRadius: 6, backgroundColor: theme.colors.border.subtle, width: '92%' }, shimmerStyle]} />
          <Animated.View style={[{ height: 12, borderRadius: 6, backgroundColor: theme.colors.border.subtle, width: '60%' }, shimmerStyle]} />
          <Animated.View style={[{ height: 12, borderRadius: 6, backgroundColor: theme.colors.border.subtle, width: '38%', marginTop: 4 }, shimmerStyle]} />
        </View>

        <Animated.View
          style={[
            {
              height: 28,
              width: 84,
              borderRadius: semanticRadius.buttonPill,
              backgroundColor: brand.orange,
              opacity: 0.35,
            },
            shimmerStyle,
          ]}
        />
      </View>
    </FadeSlideIn>
  );
}
