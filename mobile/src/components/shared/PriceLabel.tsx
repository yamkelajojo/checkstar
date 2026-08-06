import { View, Text } from 'react-native';
import { formatZar } from '../../lib/currency';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { weights } from '../../theme/typography';

interface PriceLabelProps {
  priceCents: number;
  salePriceCents?: number | null;
  unit?: string;
  size?: number;
}

/** Shows the effective price, struck-through regular price, and unit. */
export function PriceLabel({ priceCents, salePriceCents, unit, size = 16 }: PriceLabelProps) {
  const theme = useTheme();
  const onSale = salePriceCents != null && salePriceCents < priceCents;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
      {onSale && (
        <Text
          style={{
            fontSize: size * 0.8,
            color: theme.colors.textFaint,
            textDecorationLine: 'line-through',
          }}
        >
          {formatZar(priceCents)}
        </Text>
      )}
      <Text style={{ fontSize: size, fontWeight: weights.black, color: onSale ? brand.primary : theme.colors.text }}>
        {formatZar(salePriceCents ?? priceCents)}
      </Text>
      {unit ? (
        <Text style={{ fontSize: size * 0.7, color: theme.colors.textMuted }}>/ {unit}</Text>
      ) : null}
    </View>
  );
}