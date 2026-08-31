import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { semanticRadius, semanticSpacing } from '../../theme/spacing';

/**
 * Loading placeholder that mirrors a ProductCard 1:1 — same padding, image
 * frame, backdrop circle, 2-line title, price line and Add pill. Sized with
 * flex:1 so a row of two fills the same 2-col grid as the real cards.
 */
export function ProductCardSkeleton() {
  const theme = useTheme();
  const circleTint = theme.name === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(27,24,22,0.04)';
  const frameTint = theme.name === 'dark' ? 'rgba(27,24,22,0.4)' : 'rgba(255,255,255,0.9)';

  return (
    <Animated.View entering={FadeIn.duration(300)} style={{ flex: 1 }}>
      <View
        style={{
          backgroundColor: theme.colors.surface.primary,
          borderRadius: semanticRadius.card,
          padding: semanticSpacing.cardPadding,
          gap: semanticSpacing.elementGap,
          minHeight: 235,
        }}
      >
        <View
          style={{
            height: 130,
            borderRadius: semanticRadius.imageFrame,
            backgroundColor: frameTint,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: 92,
              height: 92,
              borderRadius: 46,
              backgroundColor: circleTint,
            }}
          />
        </View>

        <View style={{ gap: 2 }}>
          <View style={{ height: 12, borderRadius: 6, backgroundColor: theme.colors.border.subtle, width: '92%' }} />
          <View style={{ height: 12, borderRadius: 6, backgroundColor: theme.colors.border.subtle, width: '60%' }} />
          <View style={{ height: 12, borderRadius: 6, backgroundColor: theme.colors.border.subtle, width: '38%', marginTop: 4 }} />
        </View>

        <View
          style={{
            height: 28,
            width: 84,
            borderRadius: semanticRadius.buttonPill,
            backgroundColor: brand.orange,
            opacity: 0.35,
          }}
        />
      </View>
    </Animated.View>
  );
}