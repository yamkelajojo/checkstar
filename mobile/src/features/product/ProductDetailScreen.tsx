import { View, Text, Image, ScrollView, Pressable, Modal } from 'react-native';
import { useEffect, useState } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { textStyle, fontWeight, letterSpacing, fontFamily } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
import { useProduct } from '../catalog/hooks';
import { PriceLabel } from '../../components/shared/PriceLabel';
import { PriceGauge } from '../../components/shared/PriceGauge';
import { Stepper } from '../../components/shared/Stepper';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { SkeletonCard } from '../../components/shared/SkeletonCard';
import { FadeSlideIn } from '../../components/shared/FadeSlideIn';
import { useCart } from '../cart/store';
import { formatZar } from '../../lib/currency';
import { useDeliveryStore } from '../../stores/deliveryStore';
import { useToast } from '../../components/shared/GlassToast';
import { BackButton } from '../../components/shared/BackButton';

export function ProductDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { slug } = route.params as { slug: string };
  const { data: product, isLoading } = useProduct(slug);
  const currentStore = useDeliveryStore((s) => s.fulfillmentStore);
  const [showStoreSelector, setShowStoreSelector] = useState(false);
  const [imageSource, setImageSource] = useState<{ uri: string } | null>(null);
  const [imageError, setImageError] = useState(false);
  useEffect(() => {
    setImageError(false);
    setImageSource(product && product.images[0] ? { uri: product.images[0] } : null);
  }, [product]);

  const quantity = useCart((s) => (product ? s.items.find((i) => i.productId === String(product.id))?.quantity ?? 0 : 0));
  const add = useCart((s) => s.add);
  const decrement = useCart((s) => s.decrement);

  const handleBack = () => {
    navigation.goBack();
  };

  if (isLoading || !product) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background.primary, padding: semanticSpacing.screenPadding, paddingTop: 72 }}>
        <SkeletonCard width="100%" height={320} />
      </View>
    );
  }

  const onSale = product.salePriceCents != null && product.salePriceCents < product.basePriceCents;

  // Check availability at current store (for informational display only)
  const currentStoreAvail = currentStore ? product.stores.find((s) => s.id === currentStore.id && s.isAvailable && s.stockQuantity > 0) : undefined;
  const isAvailableAtCurrentStore = !!currentStoreAvail;
  const hasAlternativeStores = product.stores.some((s) => s.id !== currentStore?.id && s.isAvailable && s.stockQuantity > 0);
  const showAvailabilityAlert = !isAvailableAtCurrentStore && hasAlternativeStores;
  const isOutOfStockEverywhere = product.stores.length === 0 || !product.stores.some((s) => s.isAvailable && s.stockQuantity > 0);

  const toast = useToast();
  const handleAddToCart = () => {
    if (isOutOfStockEverywhere) return;
    add(String(product.id), 1);
    toast.show('Added to cart', { tone: 'success' });
  };

  const handleDecrement = () => {
    if (isOutOfStockEverywhere) return;
    decrement(String(product.id));
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      {/* Back button - top left with safe area */}
      <BackButton
        variant="back"
        onPress={handleBack}
        style={{ position: 'absolute', top: insets.top + semanticSpacing.md, left: semanticSpacing.md, zIndex: 10 }}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: insets.top + 56, paddingHorizontal: semanticSpacing.screenPadding, gap: semanticSpacing.inlineGap }}>
          {/* Product Image - full width like GreenBidder */}
          <FadeSlideIn>
            <View style={{ 
              width: '100%', 
              aspectRatio: 1, 
              borderRadius: semanticRadius.cardLarge, 
              backgroundColor: theme.colors.surface.primary, 
              alignItems: 'center', 
              justifyContent: 'center', 
              overflow: 'hidden' 
            }}>
              {imageSource && !imageError ? (
                <Image
                  source={imageSource}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <Text style={{ fontSize: 80 }}>🛒</Text>
              )}
            </View>
          </FadeSlideIn>

          {/* Category & Brand row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: semanticSpacing.inlineGap }}>
            {product.categoryId && (
              <View style={{ 
                backgroundColor: brand.orangeSoft, 
                paddingHorizontal: semanticSpacing.inlineGap, 
                paddingVertical: 4, 
                borderRadius: semanticRadius.chip 
              }}>
                <Text style={{ 
                  color: brand.orangeDeep, 
                  fontSize: textStyle.caption.size, 
                  fontWeight: fontWeight.semibold, 
                  textTransform: 'uppercase',
                  letterSpacing: letterSpacing.wide,
                  fontFamily: fontFamily.primary,
                }}>
                  Category {product.categoryId}
                </Text>
              </View>
            )}
            {product.brand ? (
              <Text style={{ 
                color: theme.colors.text.secondary, 
                ...textStyle.caption, 
                textTransform: 'uppercase', 
                letterSpacing: letterSpacing.wide 
              }}>
                {product.brand}
              </Text>
            ) : null}
          </View>

          {/* Title - using Handlee (h2 style) */}
          <Text style={{ ...textStyle.h2, color: theme.colors.text.primary }}>{product.name}</Text>

          {/* Price Row - Price and Unit side by side like GreenBidder */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: semanticSpacing.xs }}>
            <PriceLabel priceCents={product.basePriceCents} salePriceCents={product.salePriceCents} unit={product.unit} size={28} />
            <Text style={{ 
              color: theme.colors.text.tertiary, 
              ...textStyle.body,
              fontFamily: fontFamily.primary,
            }}>
              {product.unit} per unit
            </Text>
          </View>

          {/* Price Gauge */}
          <PriceGauge priceCents={product.basePriceCents} salePriceCents={product.salePriceCents} unit={product.unit} />

          {/* Store Availability Alert - subtle informational only */}
          {showAvailabilityAlert && currentStore && (
            <View style={{ marginTop: semanticSpacing.md, gap: semanticSpacing.xs }}>
              <View style={{ 
                backgroundColor: theme.colors.surface.primary, 
                borderRadius: semanticRadius.card, 
                padding: semanticSpacing.md,
                borderWidth: 1,
                borderColor: theme.colors.border.subtle,
                flexDirection: 'row',
                alignItems: 'center',
                gap: semanticSpacing.inlineGap,
              }}>
                <Text style={{ fontSize: 18 }}>ℹ️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...textStyle.caption, color: theme.colors.text.secondary, fontFamily: fontFamily.primary }}>
                    Not currently available from your nearest Checkstar store. We'll check another nearby store when fulfilling your order.
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Out of Stock Everywhere */}
          {isOutOfStockEverywhere && (
            <View style={{ marginTop: semanticSpacing.md, gap: semanticSpacing.xs }}>
              <View style={{ 
                backgroundColor: theme.colors.surface.primary, 
                borderRadius: semanticRadius.card, 
                padding: semanticSpacing.md,
                borderWidth: 1,
                borderColor: theme.colors.border.subtle,
              }}>
                <Text style={{ ...textStyle.body, color: theme.colors.text.secondary, fontFamily: fontFamily.primary }}>
                  Currently unavailable at all stores
                </Text>
              </View>
            </View>
          )}

          {/* Description */}
          {product.description ? (
            <View style={{ marginTop: semanticSpacing.md, gap: semanticSpacing.xs }}>
              <Text style={{ ...textStyle.h3, color: theme.colors.text.primary, fontFamily: fontFamily.primary }}>Description</Text>
              <Text style={{ color: theme.colors.text.secondary, ...textStyle.body, lineHeight: textStyle.body.lineHeight, fontFamily: fontFamily.primary }}>
                {product.description}
              </Text>
            </View>
          ) : null}

          {/* Key Points */}
          {product.keyPoints.length > 0 && (
            <View style={{ marginTop: semanticSpacing.md, gap: semanticSpacing.xs }}>
              <Text style={{ ...textStyle.h3, color: theme.colors.text.primary, fontFamily: fontFamily.primary }}>Highlights</Text>
              <View style={{ gap: 6, backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.card, padding: semanticSpacing.md }}>
                {product.keyPoints.map((point, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                    <Text style={{ color: brand.orange, ...textStyle.body, fontFamily: fontFamily.primary }}>•</Text>
                    <Text style={{ color: theme.colors.text.secondary, ...textStyle.body, flex: 1, fontFamily: fontFamily.primary }}>
                      {point}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Storage Tip */}
          {product.storageTip ? (
            <View style={{ marginTop: semanticSpacing.md, gap: semanticSpacing.xxs }}>
              <Text style={{ ...textStyle.h3, color: theme.colors.text.primary, fontFamily: fontFamily.primary }}>Storage Tip</Text>
              <View style={{ 
                backgroundColor: brand.orangeSoft, 
                borderRadius: semanticRadius.card, 
                padding: semanticSpacing.md,
                borderWidth: 1,
                borderColor: brand.orange,
              }}>
                <Text style={{ ...textStyle.body, color: theme.colors.text.secondary, fontFamily: fontFamily.primary }}>
                  {product.storageTip}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Product Details - Tags, Category, etc. */}
          {(product.tags && product.tags.length > 0) && (
            <View style={{ marginTop: semanticSpacing.md, gap: semanticSpacing.xs }}>
              <Text style={{ ...textStyle.h3, color: theme.colors.text.primary, fontFamily: fontFamily.primary }}>Details</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: semanticSpacing.inlineGap }}>
                {product.tags.map((tag, i) => (
                  <View key={i} style={{ 
                    backgroundColor: theme.colors.surface.primary, 
                    paddingHorizontal: semanticSpacing.inlineGap, 
                    paddingVertical: 4, 
                    borderRadius: semanticRadius.chip,
                    borderWidth: 1,
                    borderColor: theme.colors.border.subtle,
                  }}>
                    <Text style={{ ...textStyle.caption, color: theme.colors.text.secondary, fontFamily: fontFamily.primary }}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Special offer badge */}
          {onSale && (
            <View style={{ marginTop: semanticSpacing.md }}>
              <View style={{ 
                backgroundColor: brand.orange, 
                borderRadius: semanticRadius.card, 
                padding: semanticSpacing.md,
                flexDirection: 'row',
                alignItems: 'center',
                gap: semanticSpacing.inlineGap,
              }}>
                <Text style={{ fontSize: 24 }}>⚡</Text>
                <Text style={{ color: theme.colors.text.inverse, fontWeight: fontWeight.bold, ...textStyle.body }}>
                  Special Offer — {product.salePriceCents ? Math.round((1 - product.salePriceCents / product.basePriceCents) * 100) : 0}% OFF
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: semanticSpacing.screenPadding,
          paddingVertical: semanticSpacing.md,
          paddingBottom: semanticSpacing.md + insets.bottom,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border.subtle,
          backgroundColor: theme.colors.background.primary,
        }}
      >
        {isOutOfStockEverywhere ? (
          <View style={{ alignItems: 'center', width: '80%', alignSelf: 'center', gap: semanticSpacing.xs }}>
            <Text style={{ color: theme.colors.text.secondary, textAlign: 'center', ...textStyle.body, fontFamily: fontFamily.primary }}>
              Unavailable at all stores
            </Text>
          </View>
        ) : quantity === 0 ? (
          <TactilePressable
            onPress={handleAddToCart}
            haptic="commit"
            accessibilityRole="button"
            accessibilityLabel={`Add ${product.name} to cart`}
            disabled={showAvailabilityAlert}
            style={{ 
              backgroundColor: showAvailabilityAlert ? theme.colors.action.secondary.background : brand.orange, 
              borderRadius: semanticRadius.buttonPill, 
              width: '80%',
              alignSelf: 'center',
              paddingVertical: 14,
              opacity: showAvailabilityAlert ? 0.7 : 1,
            }}
          >
            <Text style={{ color: theme.colors.text.inverse, textAlign: 'center', fontWeight: fontWeight.bold, textTransform: 'uppercase', ...textStyle.buttonPrimary }}>
              {showAvailabilityAlert ? 'Choose store first' : `Add to cart \u00B7 ${formatZar(product.effectivePriceCents)} / ${product.unit}`}
            </Text>
          </TactilePressable>
        ) : (
          <View style={{ alignItems: 'center', width: '80%', alignSelf: 'center' }}>
            <Stepper quantity={quantity} onIncrement={handleAddToCart} onDecrement={handleDecrement} />
          </View>
        )}
      </View>
    </View>
  );
}