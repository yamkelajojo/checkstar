import Svg, { Path, Polygon } from 'react-native-svg';
import { Text, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { brand } from '../../theme/colors';
import { typeScale, weights, letterSpacing } from '../../theme/typography';
import { copy } from '../../lib/strings';

export const STAR_PATH =
  'M24 3.5 L29.4 16.9 L44.4 17.3 L32.8 26.9 L36.9 41.5 L24 33 L11.1 41.5 L15.2 26.9 L3.6 17.3 L18.6 16.9 Z';
export const CHECK_PATH = 'M17 24.5 L22 29.5 L31.5 18.5';

interface LogoProps {
  variant: 'stacked' | 'lockup';
  size?: number;
  tone?: 'light' | 'dark';
  style?: StyleProp<ViewStyle>;
}

function StarIcon({ size, tone }: { size: number; tone: 'light' | 'dark' }) {
  const starFill = tone === 'dark' ? '#ffffff' : '#18181b';
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Polygon points={STAR_PATH} fill={starFill} stroke={brand.primary} strokeWidth={2.5} strokeLinejoin="round" />
      <Path d={CHECK_PATH} stroke={brand.primary} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function Wordmark({ tone, size }: { tone: 'light' | 'dark'; size: number }) {
  const color = tone === 'dark' ? '#ffffff' : '#18181b';
  return (
    <View>
      <Text
        style={{
          fontSize: size,
          fontWeight: weights.extrabold,
          letterSpacing: letterSpacing.tight,
          color,
          lineHeight: size * 1.05,
        }}
      >
        <Text style={{ color: brand.primary }}>Check</Text>
        <Text style={{ color }}>star</Text>
      </Text>
      <Text
        style={{
          fontSize: size * 0.34,
          color: brand.primary,
          fontWeight: weights.bold,
        }}
      >
        {copy.app.tagline}
      </Text>
    </View>
  );
}

export function Logo({ variant, size = 28, tone = 'dark', style }: LogoProps) {
  if (variant === 'stacked') {
    return (
      <View style={[{ alignItems: 'center' }, style]}>
        <StarIcon size={size * 1.7} tone={tone} />
        <Wordmark tone={tone} size={size} />
      </View>
    );
  }
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10 }, style]}>
      <StarIcon size={size} tone={tone} />
      <Wordmark tone={tone} size={size * 0.82} />
    </View>
  );
}