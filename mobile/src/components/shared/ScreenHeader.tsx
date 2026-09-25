import { View, Text } from 'react-native';
import { useTheme } from '../../theme';
import { textStyle, fontWeight } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
import { BackButton, type BackButtonVariant } from './BackButton';

interface ScreenHeaderProps {
  title: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  showBackButton?: boolean;
  backButtonVariant?: BackButtonVariant;
  onBackPress?: () => void;
  style?: object;
}

export function ScreenHeader({
  title,
  leading,
  trailing,
  showBackButton = false,
  backButtonVariant = 'back',
  onBackPress,
  style,
}: ScreenHeaderProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: semanticSpacing.navBarHeight,
        paddingHorizontal: semanticSpacing.screenPadding,
        gap: semanticSpacing.inlineGap,
        ...style,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: semanticSpacing.inlineGap }}>
        {showBackButton && onBackPress && (
          <BackButton variant={backButtonVariant} onPress={onBackPress} />
        )}
        {leading}
        <Text style={{ ...textStyle.h2, fontWeight: fontWeight.bold, color: theme.colors.text.primary, flex: 1 }}>
          {title}
        </Text>
      </View>
      {trailing}
    </View>
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
        paddingTop: semanticSpacing.navBarHeight,
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