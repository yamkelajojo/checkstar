import type { ReactNode } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';
import { semanticSpacing } from '../../theme/spacing';

interface FadeEdgeScrollProps {
  children: ReactNode;
  fadeWidth?: number;
  contentPaddingLeft?: number;
  contentPaddingRight?: number;
  backgroundColor?: string;
}

/**
 * FadeEdgeScroll — horizontal scroller with soft edge fades.
 *
 * The fades are static gradient overlays (the "slight blur on the edges"),
 * always on, pointer-events disabled. No scroll listeners, no Reanimated —
 * the scroll path stays plain so it can't crash, and the look is the same.
 */
export function FadeEdgeScroll({
  children,
  fadeWidth = 24,
  contentPaddingLeft = semanticSpacing.screenPadding,
  contentPaddingRight = semanticSpacing.screenPadding,
  backgroundColor,
}: FadeEdgeScrollProps) {
  const theme = useTheme();
  const bg = backgroundColor ?? theme.colors.background.primary;

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingLeft: contentPaddingLeft,
          paddingRight: contentPaddingRight,
          paddingVertical: semanticSpacing.xs,
          gap: semanticSpacing.inlineGap,
          alignItems: 'center',
        }}
      >
        {children}
      </ScrollView>

      <View style={[styles.fadeLeft, { width: fadeWidth }]} pointerEvents="none">
        <LinearGradient
          colors={[bg, `${bg}00`]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={[styles.fadeRight, { width: fadeWidth }]} pointerEvents="none">
        <LinearGradient
          colors={[`${bg}00`, bg]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative' },
  fadeLeft: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  fadeRight: { position: 'absolute', right: 0, top: 0, bottom: 0 },
});
