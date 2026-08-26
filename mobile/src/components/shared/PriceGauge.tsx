import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { savingsPercent } from '../../lib/pricing';
import { formatZar } from '../../lib/currency';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { weights, typeScale } from '../../theme/typography';
import { useReducedMotion } from './useReducedMotion';

function gaugeLabel(pct: number): string {
  if (pct <= 0) return 'Regular price';
  if (pct < 15) return 'Good price';
  if (pct < 30) return 'Great deal';
  return 'Sweet spot';
}

interface PriceGaugeProps {
  priceCents: number;
  salePriceCents?: number | null;
  unit?: string;
}

/**
 * GreenBidder-style price gauge: compares the effective price to the regular
 * price with a spring marker and plain-English feedback.
 */
export function PriceGauge({ priceCents, salePriceCents, unit }: PriceGaugeProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const onSale = salePriceCents != null && salePriceCents < priceCents;
  const effective = salePriceCents ?? priceCents;
  const pct = savingsPercent(priceCents, effective);
  const savings = Math.max(0, priceCents - effective);

  const marker = useSharedValue(reduceMotion ? pct : 0);
  const opacity = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    marker.value = withSpring(Math.min(pct, 100), { damping: 16, stiffness: 120 });
    opacity.value = withTiming(1, { duration: 400 });
  }, [pct, marker, opacity, reduceMotion]);

  const markerStyle = useAnimatedStyle(() => ({
    left: `${marker.value}%`,
    opacity: opacity.value,
  }));

  if (!onSale) return null;

  return (
    <View style={{ gap: 6 }}>
      <View style={{ height: 6, borderRadius: 999, backgroundColor: theme.colors.hairline, overflow: 'hidden' }}>
        <Animated.View
          style={[
            { position: 'absolute', top: -4, marginLeft: -8, width: 14, height: 14, borderRadius: 7, backgroundColor: brand.primary, borderWidth: 2, borderColor: theme.colors.bg },
            markerStyle,
          ]}
        />
      </View>
      <Text style={{ fontSize: typeScale.caption, fontWeight: weights.semibold, color: brand.primary }}>
        This Special = {gaugeLabel(pct)} ({pct}% off · save {formatZar(savings)})
        {unit ? ` · per ${unit}` : ''}
      </Text>
    </View>
  );
}
