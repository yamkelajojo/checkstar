import { View, Text, Pressable, Modal } from 'react-native';
import { Image } from 'expo-image';
import { mediaSource } from '../../lib/media';
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
import { SaveHeart } from './SaveHeart';
import { haptic } from '../../lib/haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing } from 'react-native-reanimated';
import { useReducedMotion } from './useReducedMotion';

export interface BadgeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ProductCardProps {
  product: ProductVO;
  storeProductId?: number | string | null;
  style?: StyleProp<ViewStyle>;
  /** Opens a quick summary popup; when absent the price row is not pressable. */
  onRequestSummary?: (product: ProductVO, rect: BadgeRect | null) => void;
  /** Tracking source for product view attribution. */
  source?: 'direct' | 'feed' | 'home' | 'search' | 'recommendation' | 'saved';
}

/**
 * 2-col grid product card: angled image on a backdrop circle, % off ribbon,
 * price, and an inline add/stepper. The single most valuable commerce pattern.
 */
export function ProductCard({ product, storeProductId = null, style, onRequestSummary, source = 'direct' }: ProductCardProps) {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const quantity = useCart((s) => {
    const pid = String(product.id);
    const normalizedStoreId = storeProductId != null ? String(storeProductId) : null;
    if (normalizedStoreId != null) {
      return s.items.find((i) => i.productId === pid && String(i.storeProductId ?? '') === normalizedStoreId)?.quantity
        ?? s.items.find((i) => i.productId === pid)?.quantity ?? 0;
    }
    return s.items.find((i) => i.productId === pid)?.quantity ?? 0;
  });
  const add = useCart((s) => s.add);
  const decrement = useCart((s) => s.decrement);
  const badgeRef = useRef<View>(null);
  const reduceMotion = useReducedMotion();

  const inCart = quantity > 0;
  const prevInCart = useRef(inCart);
  const actionOpacity = useSharedValue(1);
  const actionScale = useSharedValue(1);
  const actionTranslateX = useSharedValue(0);

  useEffect(() => {
    if (prevInCart.current === inCart) return;
    prevInCart.current = inCart;
    if (reduceMotion) return;

    actionOpacity.value = 0;
    actionScale.value = 0.85;
    actionTranslateX.value = inCart ? 6 : -6;

    actionOpacity.value = withTiming(1, { duration: 160, easing: Easing.out(Easing.quad) });
    actionScale.value = withSpring(1, { damping: 16, stiffness: 320, mass: 0.45 });
    actionTranslateX.value = withSpring(0, { damping: 18, stiffness: 300, mass: 0.45 });
  }, [inCart, reduceMotion]);

  const actionTransitionStyle = useAnimatedStyle(() => ({
    opacity: actionOpacity.value,
    transform: [
      { scale: actionScale.value },
      { translateX: actionTranslateX.value },
    ],
  }));

  const resolveImage = (imgs: unknown): { uri: string } | null => {
    if (!imgs) return null;
    if (Array.isArray(imgs)) return mediaSource(imgs[0] ? String(imgs[0]) : null);
    if (typeof imgs === 'string') return mediaSource(imgs);
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
      onPress={() => navigation.navigate('ProductDetail', { slug: product.slug, source })}
      accessibilityRole="button"
      accessibilityLabel={product.name}
      style={[{ borderRadius: semanticRadius.card, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, width: '100%' }, style]}
    >
      <View style={{ width: '100%', backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.card, padding: semanticSpacing.cardPadding, gap: semanticSpacing.elementGap, minHeight: 240, borderWidth: 1, borderColor: theme.colors.border.subtle, flexDirection: 'column' }}>
        <View
          style={{
            width: '100%',
            height: 132,
            borderRadius: semanticRadius.imageFrame,
            backgroundColor: imageTint,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <SaveHeart productId={product.id} product={product} />
          <View
            style={{
              width: 94,
              height: 94,
              borderRadius: 47,
              backgroundColor: theme.name === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(27,24,22,0.04)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {imageSource ? (
              <Image
                source={imageSource}
                style={{ width: 86, height: 86, transform: [{ rotate: '-12deg' }] }}
                contentFit="contain"
                transition={220}
                cachePolicy="memory-disk"
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
                left: semanticSpacing.tightGap,
                backgroundColor: '#1B1816',
                borderRadius: semanticRadius.badge,
                paddingHorizontal: 9,
                paddingVertical: 3,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: fontWeight.bold, letterSpacing: 0.3 }}>{pctOff}% OFF</Text>
            </View>
          )}
        </View>

        <View style={{ gap: 2, flex: 1, justifyContent: 'flex-start' }}>
          <View style={{ height: 40, justifyContent: 'flex-start' }}>
            <Text numberOfLines={2} style={{ ...textStyle.title, lineHeight: 19, color: theme.colors.text.primary }}>
              {product.name}
            </Text>
          </View>
          {onRequestSummary ? (
            <Pressable
              ref={badgeRef}
              onPress={() => {
                haptic.tap();
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

        <View style={{ height: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <Animated.View style={[{ flexDirection: 'row', alignItems: 'center' }, actionTransitionStyle]}>
            {quantity === 0 ? (
              <TactilePressable
                variant="compact"
                onPress={() => add(String(product.id), 1, storeProductId)}
                haptic="tap"
                accessibilityRole="button"
                accessibilityLabel={`Add ${product.name} to cart`}
                style={{
                  backgroundColor: brand.orange,
                  borderRadius: semanticRadius.buttonPill,
                  height: 30,
                  paddingHorizontal: 12,
                  minWidth: 68,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: theme.colors.text.inverse, fontWeight: fontWeight.bold, textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.3 }}>
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
          </Animated.View>
        </View>
      </View>
    </TactilePressable>
  );
}