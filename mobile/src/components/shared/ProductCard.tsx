import { View, Text, Image, Pressable, Modal } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProductVO, StoreAvailabilityVO } from '../../lib/product';
import { formatZar } from '../../lib/currency';
import { savingsPercent } from '../../lib/pricing';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { fontWeight, textStyle, letterSpacing } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
import { TactilePressable } from './TactilePressable';
import { Stepper } from './Stepper';
import { useCart } from '../../features/cart/store';
import { useDeliveryStore } from '../../stores/deliveryStore';
import type { RootStackParamList } from '../../navigation/types';

export interface BadgeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ProductCardProps {
  product: ProductVO;
  storeProductId?: number | null;
  style?: StyleProp<ViewStyle>;
  /** Opens a quick summary popup; when absent the price row is not pressable. */
  onRequestSummary?: (product: ProductVO, rect: BadgeRect | null) => void;
}

/**
 * 2-col grid product card: angled image on a backdrop circle, % off ribbon,
 * price, and an inline add/stepper. The single most valuable commerce pattern.
 */
export function ProductCard({ product, storeProductId = null, style, onRequestSummary }: ProductCardProps) {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const quantity = useCart((s) => {
    const pid = String(product.id);
    if (storeProductId != null) {
      return s.items.find((i) => i.productId === pid && i.storeProductId === storeProductId)?.quantity
        ?? s.items.find((i) => i.productId === pid)?.quantity ?? 0;
    }
    return s.items.find((i) => i.productId === pid)?.quantity ?? 0;
  });
  const add = useCart((s) => s.add);
  const decrement = useCart((s) => s.decrement);
  const badgeRef = useRef<View>(null);

  const resolveImage = (imgs: unknown): { uri: string } | null => {
    if (!imgs) return null;
    if (Array.isArray(imgs)) return imgs[0] ? { uri: String(imgs[0]) } : null;
    if (typeof imgs === 'string') return imgs ? { uri: imgs } : null;
    return null;
  };
  const [imageSource, setImageSource] = useState<{ uri: string } | null>(resolveImage(product.images));
  useEffect(() => {
    setImageSource(resolveImage(product.images));
  }, [product.images]);

  const onSale = product.salePriceCents != null && product.salePriceCents < product.basePriceCents;
  const onSpecial = product.collectionPriceCents != null && product.collectionPriceCents < product.basePriceCents;
  const isOnSaleOrSpecial = onSale || onSpecial;
  const effectiveSalePrice = onSale ? product.salePriceCents : (onSpecial ? product.collectionPriceCents : null);
  const pctOff = isOnSaleOrSpecial ? savingsPercent(product.basePriceCents, effectiveSalePrice!) : 0;
  const imageTint = theme.name === 'dark' ? 'rgba(27,24,22,0.4)' : 'rgba(255,255,255,0.9)';

  return (
    <TactilePressable
      variant="card"
      haptic="selection"
      onPress={() => navigation.navigate('ProductDetail', { slug: product.slug })}
      accessibilityRole="button"
      accessibilityLabel={product.name}
      style={[{ borderRadius: semanticRadius.card }, style]}
    >
      <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.card, padding: semanticSpacing.cardPadding, gap: semanticSpacing.elementGap, minHeight: 235 }}>
        <View
          style={{
            height: 130,
            borderRadius: semanticRadius.imageFrame,
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
              backgroundColor: theme.name === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(27,24,22,0.04)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {imageSource ? (
              <Image
                source={imageSource}
                style={{ width: 84, height: 84, transform: [{ rotate: '-14deg' }] }}
                resizeMode="contain"
                onError={() => setImageSource(null)}
              />
            ) : (
              <Text style={{ color: theme.colors.text.tertiary, fontSize: 40 }}>🛒</Text>
            )}
          </View>
          {isOnSaleOrSpecial && (
            <View
              style={{
                position: 'absolute',
                top: semanticSpacing.tightGap,
                right: semanticSpacing.tightGap,
                backgroundColor: brand.orange,
                borderRadius: semanticRadius.badge,
                paddingHorizontal: semanticSpacing.inlineGap,
                paddingVertical: 3,
              }}
            >
              <Text style={{ color: theme.colors.text.inverse, fontSize: 11, fontWeight: fontWeight.bold }}>{pctOff}% OFF</Text>
            </View>
          )}
        </View>

        <View style={{ gap: 2 }}>
          <Text numberOfLines={2} style={{ ...textStyle.title, color: theme.colors.text.primary }}>
            {product.name}
          </Text>
          {onRequestSummary ? (
            <Pressable
              ref={badgeRef}
              onPress={() => {
                const fallback = () => onRequestSummary(product, null);
                const ref = badgeRef.current as unknown as { measureInWindow?: (cb: (x: number, y: number, w: number, h: number) => void) => void } | null;
                if (typeof ref?.measureInWindow === 'function') {
                  try {
                    let measured = false;
                    ref.measureInWindow((x, y, w, h) => {
                      measured = true;
                      if (Number.isFinite(x) && Number.isFinite(y) && w > 0 && h > 0) {
                        onRequestSummary(product, { x, y, width: w, height: h });
                      } else {
                        fallback();
                      }
                    });
                    if (!measured) fallback();
                    return;
                  } catch {
                    // fall through to fallback
                  }
                }
                fallback();
              }}
              accessibilityRole="button"
              accessibilityLabel={`About ${product.name}`}
              testID={`summary-trigger-${product.id}`}
              hitSlop={4}
              style={{ alignSelf: 'flex-start' }}
            >
              <Text style={{ ...textStyle.caption, color: theme.colors.text.secondary }}>
                {formatZar(product.effectivePriceCents)} / {product.unit}
              </Text>
            </Pressable>
          ) : (
            <Text style={{ ...textStyle.caption, color: theme.colors.text.secondary }}>
              {formatZar(product.effectivePriceCents)} / {product.unit}
            </Text>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {quantity === 0 ? (
            <TactilePressable
              onPress={() => add(String(product.id), 1, storeProductId)}
              haptic="tap"
              accessibilityRole="button"
              accessibilityLabel={`Add ${product.name} to cart`}
              style={{ backgroundColor: brand.orange, borderRadius: semanticRadius.buttonPill, paddingHorizontal: 14, minWidth: 80, paddingVertical: 6 }}
            >
              <Text style={{ color: theme.colors.text.inverse, fontWeight: fontWeight.semibold, textTransform: 'uppercase', ...textStyle.caption }}>
                Add +
              </Text>
            </TactilePressable>
          ) : (
            <Stepper
              quantity={quantity}
              onIncrement={() => add(String(product.id), 1, storeProductId)}
              onDecrement={() => decrement(String(product.id), storeProductId)}
            />
          )}
        </View>
      </View>
    </TactilePressable>
  );
}