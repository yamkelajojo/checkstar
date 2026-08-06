import { View, Text } from 'react-native';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { typeScale, weights } from '../../theme/typography';
import { AnimatedLogo } from '../../components/shared/AnimatedLogo';
import { copy } from '../../lib/strings';

export function SplashScreen() {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.bgAlt,
        gap: 16,
      }}
    >
      <AnimatedLogo variant="stacked" />
      <Text style={{ color: brand.primary, fontSize: typeScale.caption, fontWeight: weights.semibold, textTransform: 'uppercase', letterSpacing: 1.5 }}>
        {copy.app.checkoutLine}
      </Text>
    </View>
  );
}
