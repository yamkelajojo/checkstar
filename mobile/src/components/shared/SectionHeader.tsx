import { View, Text } from 'react-native';
import { useTheme } from '../../theme';
import { textStyle, fontWeight } from '../../theme/typography';
import { semanticSpacing } from '../../theme/spacing';

interface SectionHeaderProps {
  title: string;
  /** Small icon rendered in a 28px chip before the title. */
  icon?: React.ReactNode;
  /** Optional trailing element (count pill, badge, chevron…). */
  trailing?: React.ReactNode;
}

/**
 * SectionHeader — the one section-title pattern for every screen.
 * 28px icon chip + h3 title, 16px screen padding, consistent spacing.
 */
export function SectionHeader({ title, icon, trailing }: SectionHeaderProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: semanticSpacing.sm,
        paddingHorizontal: semanticSpacing.screenPadding,
        marginBottom: semanticSpacing.md,
      }}
    >
      {icon ? (
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: theme.colors.surface.elevated,
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </View>
      ) : null}
      <Text
        style={{
          ...textStyle.h3,
          fontWeight: fontWeight.bold,
          color: theme.colors.text.primary,
          letterSpacing: -0.3,
        }}
      >
        {title}
      </Text>
      <View style={{ flex: 1 }} />
      {trailing}
    </View>
  );
}
