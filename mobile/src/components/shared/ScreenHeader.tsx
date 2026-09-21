import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { textStyle, fontWeight } from '../../theme/typography';
import { semanticSpacing } from '../../theme/spacing';
import { FadeSlideIn } from './FadeSlideIn';

/**
 * Safe-area-aware top offset for hand-rolled headers.
 */
export function useTopSafeArea(base = 0): number {
  const insets = useSafeAreaInsets();
  return insets.top + base;
}

/**
 * Canonical large-title header — Apple-polished
 * Every tab screen renders same typography, padding, safe-area offset
 * Now with y12 blur4 entrance, tracking -0.3, coordinated with tab transition
 */
export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const theme = useTheme();
  const top = useTopSafeArea(semanticSpacing.sm);

  return (
    <FadeSlideIn delay={60} distance={12} initialScale={0.98}>
      <View style={{ paddingTop: top, paddingHorizontal: semanticSpacing.screenPadding, gap: 2 }}>
        <Text
          accessibilityRole="header"
          style={{
            ...textStyle.h1,
            color: theme.colors.text.primary,
            letterSpacing: -0.3,
            fontWeight: fontWeight.bold,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ ...textStyle.body, color: theme.colors.text.secondary, letterSpacing: -0.1 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </FadeSlideIn>
  );
}
