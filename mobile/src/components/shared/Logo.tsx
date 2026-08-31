import Svg, { Path } from 'react-native-svg';
import { Text, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { textStyle, fontWeight, letterSpacing, fontFamily } from '../../theme/typography';
import { copy } from '../../lib/strings';

const STAR_WING_PATH =
  'M 18 252 C 68 226 108 214 150 214 C 192 214 234 232 258 262 C 224 248 188 241 150 241 C 112 241 64 247 18 252 Z';
const STAR_CHECK_PATH =
  'M 108 348 C 99 262 91 170 93 86 C 105 128 119 152 133 173 C 172 118 222 58 277 15 C 214 98 149 222 108 348 Z';

interface LogoProps {
  variant: 'stacked' | 'lockup';
  size?: number;
  tone?: 'light' | 'dark';
  style?: StyleProp<ViewStyle>;
}

function StarIcon({ size, tone }: { size: number; tone: 'light' | 'dark' }) {
  const theme = useTheme();
  const wingFill = tone === 'dark' ? theme.colors.text.inverse : theme.colors.text.primary;
  const checkColor = brand.orange;
  return (
    <Svg width={size} height={size} viewBox="0 0 300 400">
      <Path d={STAR_WING_PATH} fill={wingFill} />
      <Path d={STAR_CHECK_PATH} fill={checkColor} />
    </Svg>
  );
}

function Wordmark({ tone, size }: { tone: 'light' | 'dark'; size: number }) {
  const theme = useTheme();
  const color = tone === 'dark' ? theme.colors.text.inverse : theme.colors.text.primary;
  return (
    <View>
      <Text
        style={{
          fontSize: size,
          fontWeight: fontWeight.extrabold,
          letterSpacing: letterSpacing.tight,
          color,
          lineHeight: size * 1.05,
          fontFamily: fontFamily.primary,
        }}
      >
        <Text style={{ color: brand.orange }}>Check</Text>
        <Text style={{ color }}>star</Text>
      </Text>
      <Text
        style={{
          fontSize: size * 0.34,
          color: brand.orange,
          fontWeight: fontWeight.regular,
          fontStyle: 'normal',
          fontFamily: fontFamily.accent,
        }}
      >
        {copy.app.tagline}
      </Text>
    </View>
  );
}

export function Logo({ variant, size = 28, tone = 'dark', style }: LogoProps) {
  const theme = useTheme();
  const resolvedTone = tone === 'dark' ? 'dark' : 'light';
  // If tone is 'light', we want light theme colors (dark text on light bg)
  // If tone is 'dark', we want dark theme colors (light text on dark bg)
  // The theme context gives us current app theme, but logo needs explicit tone
  const iconSize = size * 1.7;
  if (variant === 'stacked') {
    return (
      <View style={[{ alignItems: 'center' }, style]}>
        <StarIcon size={iconSize} tone={resolvedTone} />
        <Wordmark tone={resolvedTone} size={size} />
      </View>
    );
  }
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10 }, style]}>
      <StarIcon size={size} tone={resolvedTone} />
      <Wordmark tone={resolvedTone} size={size * 0.82} />
    </View>
  );
}