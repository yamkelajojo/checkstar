import { View, Text, Image } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProductVO } from '../../lib/product';
import { formatZar } from '../../lib/currency';
import { savingsPercent } from '../../lib/pricing';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { weights, typeScale, letterSpacing } from '../../theme/typography';
import { TactilePressable } from './TactilePressable';
import { Stepper } from './Stepper';
import { useCart } from '../../features/cart/store';
import type { RootStackParamList } from '../../navigation/types';

interface ProductCardProps {
  product: ProductVO;
  storeProductId?: number | null;
  style?: StyleProp<ViewStyle>;
}

/**
 * 2-col grid product card: angled image on a backdrop circle, % off ribbon,
 * price, and an inline add/stepper. The single most valuable commerce pattern.
 */
export function ProductCard({ product, storeProductId = null, style }: ProductCardProps) {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const quantity = useCart((s) => s.items.find((i) => i.productId === String(product.id))?.quantity ?? 0);
  const add = useCart((s) => s.add);
  const decrement = useCart((s) => s.decrement);

  const [imageSource, setImageSource] = useState<{ uri: string } | null>(
    product.images[0] ? { uri: product.images[0] } : null,
  );
  useEffect(() => {
    setImageSource(product.images[0] ? { uri: product.images[0] } : null);
  }, [product.images]);

  const onSale = product.salePriceCents != null && product.salePriceCents < product.basePriceCents;
  const pctOff = onSale ? savingsPercent(product.basePriceCents, product.effectivePriceCents) : 0;
  const imageTint = theme.name === 'dark' ? 'rgba(24,24,27,0.4)' : 'rgba(255,255,255,0.9)';

  return (
    <TactilePressable
      variant="card"
      hapticOnPress="selection"
      onPress={() => navigation.navigate('ProductDetail', { slug: product.slug })}
      accessibilityRole="button"
      accessibilityLabel={product.name}
      style={[{ flex: 1, minWidth: '47%', borderRadius: 16 }, style]}
    >
      <View style={{ backgroundColor: theme.colors.surface, borderRadius: 16, padding: 10, gap: 8, minHeight: 235 }}>
        <View
          style={{
            height: 130,
            borderRadius: 12,
            backgroundColor: imageTint,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: 92,
              height: 92,
              borderRadius: 46,
              backgroundColor: theme.name === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(24,24,27,0.04)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {imageSource ? (
              <Image
                source={imageSource}
                style={{ width: 84, height: 84, transform: [{ rotate: '-14deg' }] }}
                resizeMode="contain"
              />
            ) : (
              <Text style={{ color: theme.colors.textFaint, fontSize: 40 }}>🛒</Text>
            )}
          </View>
          {onSale && (
            <View
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: brand.primary,
                borderRadius: 999,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: weights.bold }}>{pctOff}% OFF</Text>
            </View>
          )}
        </View>

        <View style={{ gap: 2 }}>
          <Text numberOfLines={2} style={{ fontSize: typeScale.body, fontWeight: weights.semibold, color: theme.colors.text }}>
            {product.name}
          </Text>
          <Text style={{ fontSize: typeScale.caption, color: theme.colors.textMuted }}>
            {formatZar(product.effectivePriceCents)} / {product.unit}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {quantity === 0 ? (
            <TactilePressable
              onPress={() => add(String(product.id), 1, storeProductId)}
              hapticOnPress="tap"
              accessibilityRole="button"
              accessibilityLabel={`Add ${product.name} to cart`}
              style={{ backgroundColor: brand.primary, borderRadius: 999, paddingHorizontal: 18, minWidth: 96 }}
            >
              <Text style={{ color: '#fff', fontWeight: weights.bold, letterSpacing: letterSpacing.wide, textTransform: 'uppercase', fontSize: typeScale.caption }}>
                Add +
              </Text>
            </TactilePressable>
          ) : (
            <Stepper
              quantity={quantity}
              onIncrement={() => add(String(product.id), 1, storeProductId)}
              onDecrement={() => decrement(String(product.id))}
            />
          )}
        </View>
      </View>
    </TactilePressable>
  );
}