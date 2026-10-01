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
  modal?: boolean;
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
  modal = false,
  style,
}: ScreenHeaderProps) {
  const theme = useTheme();
  const safeTop = useTopSafeArea(0);
  const top = modal ? semanticSpacing.sm : Math.max(8, safeTop - 6);
  const hasControls = showBackButton || leading != null || trailing != null;

  if (hasControls) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: top,
          paddingBottom: semanticSpacing.xxs,
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
            style={{ fontSize: 22, lineHeight: 28, fontWeight: fontWeight.bold, color: theme.colors.text.primary, flex: 1 }}
          >
            {title}
          </Text>
        </View>
        {trailing}
      </View>
    );
  }

  return (
    <FadeSlideIn delay={60} distance={8}>
      <View style={{ paddingTop: top, paddingHorizontal: semanticSpacing.screenPadding, gap: 2, ...style }}>
        <Text
          accessibilityRole="header"
          style={{
            fontSize: 26,
            lineHeight: 32,
            color: theme.colors.text.primary,
            letterSpacing: -0.4,
            fontWeight: fontWeight.bold,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ fontSize: 14, lineHeight: 20, color: theme.colors.text.secondary, letterSpacing: -0.1 }}>
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

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: semanticSpacing.sm,
        paddingBottom: semanticSpacing.xxs,
        paddingHorizontal: semanticSpacing.screenPadding,
        gap: semanticSpacing.inlineGap,
      }}
    >
      <Text style={{ fontSize: 20, lineHeight: 26, fontWeight: fontWeight.bold, color: theme.colors.text.primary, flex: 1 }}>
        {title}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: semanticSpacing.inlineGap }}>
        {trailing}
        <BackButton variant="close" onPress={onClose} />
      </View>
    </View>
  );
}
