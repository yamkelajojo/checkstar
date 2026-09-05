import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { textStyle } from '../../theme/typography';
import { semanticSpacing } from '../../theme/spacing';

/**
 * Safe-area-aware top offset for hand-rolled headers.
 *
 * Screens with custom hero/header content (Home, Account, Order detail,
 * rider screens, search, store picker) call `useTopSafeArea(base)` instead
 * of hardcoding `paddingTop: 56`, which let content slide under the
 * Dynamic Island / status bar on modern iPhones (insets.top is 59pt there)
 * and left an awkward void on notched-free devices.
 */
export function useTopSafeArea(base = 0): number {
  const insets = useSafeAreaInsets();
  return insets.top + base;
}

/**
 * The canonical large-title header for top-level screens (Browse, Cart,
 * Favorites, Checkout). Every tab screen renders the same typography,
 * padding and safe-area offset so the app reads as one design system.
 */
export function ScreenHeader({ title }: { title: string }) {
  const theme = useTheme();
  const top = useTopSafeArea(semanticSpacing.sm);
  return (
    <Text
      accessibilityRole="header"
      style={{
        paddingTop: top,
        paddingHorizontal: semanticSpacing.screenPadding,
        ...textStyle.h1,
        color: theme.colors.text.primary,
      }}
    >
      {title}
    </Text>
  );
}
