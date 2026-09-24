import { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProductVO } from '../../lib/product';
import { formatZar } from '../../lib/currency';
import { savingsPercent } from '../../lib/pricing';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { typeScale, weights, letterSpacing } from '../../theme/typography';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { Stepper } from '../../components/shared/Stepper';
import { useReducedMotion } from '../../components/shared/useReducedMotion';
import { useCart } from '../cart/store';
import { MAX_QUANTITY } from '../cart/types';
import type { RootStackParamList } from '../../navigation/types';
import { haptic } from '../../lib/haptics';

export interface SourceRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ProductSummaryModalProps {
  product: ProductVO;
  storeProductId?: number | null;
  sourceRect?: SourceRect | null;
  onClose: () => void;
}

/**
 * Quick-look popup raised from a tapped card's price area: morphs from the
 * source badge rect when provided (scale+translate), falls back to centre
 * scale+fade, and snaps instantly under Reduce Motion.
 */
export function ProductSummaryModal({ product, storeProductId = null, sourceRect = null, onClose }: ProductSummaryModalProps) {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const reduceMotion = useReducedMotion();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const add = useCart((s) => s.add);
  const [quantity, setQuantity] = useState(1);
  const [imageSource, setImageSource] = useState<{ uri: string } | null>(
    product.images[0] ? { uri: product.images[0] } : null,
  );

  const progress = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(1, { duration: 220 });
  }, [progress]);

  const cardStyle = useAnimatedStyle(() => {
    if (reduceMotion || sourceRect == null) {
      return {
        opacity: progress.value,
        transform: [{ scale: 0.92 + 0.08 * progress.value }] as const,
      };
    }
    const sourceCenterX = sourceRect.x + sourceRect.width / 2;
    const sourceCenterY = sourceRect.y + sourceRect.height / 2;
    const destCenterX = windowWidth / 2;
    const destCenterY = windowHeight / 2;
    const offsetX = sourceCenterX - destCenterX;
    const offsetY = sourceCenterY - destCenterY;
    return {
      opacity: progress.value,
      transform: [
        { translateX: offsetX * (1 - progress.value) },
        { translateY: offsetY * (1 - progress.value) },
        { scale: 0.2 + 0.8 * progress.value },
      ] as const,
    };
  });

  const onSale = product.salePriceCents != null && product.salePriceCents < product.basePriceCents;
  const pctOff = onSale ? savingsPercent(product.basePriceCents, product.effectivePriceCents) : 0;

  const addToCart = () => {
    add(String(product.id), quantity, storeProductId);
    onClose();
  };

  const viewFullDetails = () => {
    onClose();
    navigation.navigate('ProductDetail', { slug: product.slug });
  };

  return (
    <Modal transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: theme.colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Pressable
          accessibilityLabel="Dismiss"
          accessibilityRole="button"
          onPress={() => {
            haptic.tap();
            onClose();
          }}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[cardStyle, { width: '100%', maxWidth: 360 }]}>
          <View style={{ backgroundColor: theme.colors.surfaceElevated, borderRadius: 20, padding: 16, gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <View
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 14,
                  backgroundColor: theme.name === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(24,24,27,0.04)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {imageSource ? (
                  <Image source={imageSource} style={{ width: 72, height: 72 }} contentFit="contain" cachePolicy="memory-disk" />
                ) : (
                  <Text style={{ color: theme.colors.textFaint, fontSize: 32 }}>🛒</Text>
                )}
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text numberOfLines={2} style={{ fontSize: typeScale.body, fontWeight: weights.bold, color: theme.colors.text.primary }}>
                  {product.name}
                </Text>
                <Text style={{ fontSize: typeScale.caption, color: theme.colors.textMuted }}>per {product.unit}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: product.isActive ? brand.success : brand.accent }} />
                  <Text
                    style={{ fontSize: typeScale.caption, color: product.isActive ? brand.success : brand.accent, fontWeight: weights.semibold }}
                    accessibilityLabel={product.stockLabel}
                  >
                    {product.stockLabel}
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: typeScale.price, fontWeight: weights.black, color: theme.colors.text.primary }}>
                {formatZar(product.effectivePriceCents)}
              </Text>
              {onSale && (
                <View style={{ backgroundColor: brand.primary, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: weights.bold }}>{pctOff}% OFF</Text>
                </View>
              )}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Stepper
                quantity={quantity}
                onIncrement={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
                onDecrement={() => setQuantity((q) => Math.max(1, q - 1))}
              />
              <TactilePressable
                onPress={addToCart}
                haptic="commit"
                accessibilityRole="button"
                accessibilityLabel={`Add ${product.name} to cart`}
                style={{ backgroundColor: brand.primary, borderRadius: 999, paddingHorizontal: 18 }}
              >
                <Text style={{ color: '#fff', fontWeight: weights.bold, letterSpacing: letterSpacing.wide, textTransform: 'uppercase', fontSize: typeScale.caption }}>
                  Add to cart
                </Text>
              </TactilePressable>
            </View>

            <TactilePressable
              onPress={viewFullDetails}
              haptic="selection"
              accessibilityRole="button"
              style={{ alignSelf: 'flex-start' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Text style={{ color: brand.primary, fontWeight: weights.semibold, fontSize: typeScale.caption }}>
                  View full details
                </Text>
                <ChevronRight size={14} color={brand.primary} />
              </View>
            </TactilePressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
