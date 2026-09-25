import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { textStyle, fontWeight } from '../../theme/typography';
import { semanticSpacing } from '../../theme/spacing';
import { FadeSlideIn } from './FadeSlideIn';
import { BackButton, type BackButtonVariant } from './BackButton';

/**
 * Safe-area-aware top offset for hand-rolled headers.
 */
export function useTopSafeArea(base = 0): number {
  const insets = useSafeAreaInsets();
  return insets.top + base;
}

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  showBackButton?: boolean;
  backButtonVariant?: BackButtonVariant;
  onBackPress?: () => void;
  style?: object;
}

/**
 * Canonical large-title header.
 * Tab screens render the large stacked title (title + optional subtitle)
 * with safe-area offset and a subtle fade entrance. Screens that need a
 * compact row (back button / leading / trailing controls) fall back to a
 * centered row layout that keeps the same padding and safe-area offset.
 */
export function ScreenHeader({
  title,
  subtitle,
  leading,
  trailing,
  showBackButton = false,
  backButtonVariant = 'back',
  onBackPress,
  style,
}: ScreenHeaderProps) {
  const theme = useTheme();
  const top = useTopSafeArea(semanticSpacing.sm);
  const hasControls = showBackButton || leading != null || trailing != null;

  if (hasControls) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: top,
          paddingHorizontal: semanticSpacing.screenPadding,
          gap: semanticSpacing.inlineGap,
          ...style,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: semanticSpacing.inlineGap, flex: 1 }}>
          {showBackButton && onBackPress && (
            <BackButton variant={backButtonVariant} onPress={onBackPress} />
          )}
          {leading}
          <Text
            accessibilityRole="header"
            style={{ ...textStyle.h2, fontWeight: fontWeight.bold, color: theme.colors.text.primary, flex: 1 }}
          >
            {title}
          </Text>
        </View>
        {trailing}
      </View>
    );
  }

  return (
    <FadeSlideIn delay={60} distance={12}>
      <View style={{ paddingTop: top, paddingHorizontal: semanticSpacing.screenPadding, gap: 2, ...style }}>
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

export function ModalHeader({
  title,
  onClose,
  trailing,
}: {
  title: string;
  onClose: () => void;
  trailing?: React.ReactNode;
}) {
  const theme = useTheme();
  const top = useTopSafeArea(semanticSpacing.sm);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: top,
        paddingHorizontal: semanticSpacing.screenPadding,
        gap: semanticSpacing.inlineGap,
      }}
    >
      <Text style={{ ...textStyle.h2, fontWeight: fontWeight.bold, color: theme.colors.text.primary, flex: 1 }}>
        {title}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: semanticSpacing.inlineGap }}>
        {trailing}
        <BackButton variant="close" onPress={onClose} />
      </View>
    </View>
  );
}
