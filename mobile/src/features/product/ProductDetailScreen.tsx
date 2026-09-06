import { View, Text, ScrollView, Pressable, Modal, Animated, useWindowDimensions, Image as RNImage } from 'react-native';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { textStyle, fontWeight, letterSpacing, fontFamily } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
import { useProduct, useRelatedProducts } from '../catalog/hooks';
import type { ProductVO } from '../../lib/product';
import { PriceLabel } from '../../components/shared/PriceLabel';
import { PriceGauge } from '../../components/shared/PriceGauge';
import { Stepper } from '../../components/shared/Stepper';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { SkeletonCard } from '../../components/shared/SkeletonCard';
import { FadeSlideIn } from '../../components/shared/FadeSlideIn';
import { useCart } from '../cart/store';
import { formatZar } from '../../lib/currency';
import { ChevronLeft } from 'lucide-react-native';
import { useDeliveryStore } from '../../stores/deliveryStore';
import { useToast } from '../../components/shared/GlassToast';
import { trackProductView } from '../../services/trackingService';
import { SaveHeart } from '../../components/shared/SaveHeart';
import { haptic } from '../../lib/haptics';

function RelatedCard({ item }: { item: ProductVO }) {
  const theme = useTheme();
  const navigation = useNavigation<any>();

  return (
    <TactilePressable
      onPress={() => navigation.push('ProductDetail', { slug: item.slug, source: 'related' })}
      haptic="tap"
      accessibilityRole="button"
      accessibilityLabel={`View ${item.name}`}
      style={{
        width: 132,
        backgroundColor: theme.colors.surface.primary,
        borderRadius: semanticRadius.card,
        padding: semanticSpacing.inlineGap,
        gap: 4,
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
      }}
    >
      <View
        style={{
          width: '100%',
          aspectRatio: 1,
          borderRadius: semanticRadius.chip,
          backgroundColor: theme.colors.background.primary,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          marginBottom: 4,
        }}
      >
        {item.images[0] ? (
          <RNImage
            source={{ uri: item.images[0] }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <Text style={{ fontSize: 34 }}>🛒</Text>
        )}
      </View>
      <Text numberOfLines={2} style={{ ...textStyle.caption, color: theme.colors.text.primary, fontWeight: fontWeight.semibold, minHeight: 30 }}>
        {item.name}
      </Text>
      <PriceLabel priceCents={item.basePriceCents} salePriceCents={item.salePriceCents} unit={item.unit} size={13} />
    </TactilePressable>
  );
}

export function ProductDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { slug, source = 'direct' } = route.params as { slug: string; source?: string };
  const { data: product, isLoading } = useProduct(slug);
  const currentStore = useDeliveryStore((s) => s.fulfillmentStore);
  const [showStoreSelector, setShowStoreSelector] = useState(false);
  const [imageSource, setImageSource] = useState<{ uri: string } | null>(null);
  const [imageError, setImageError] = useState(false);
  useEffect(() => {
    setImageError(false);
    setImageSource(product && product.images[0] ? { uri: product.images[0] } : null);
  }, [product]);

  const startTime = useRef(Date.now());
  useEffect(() => {
    return () => {
      if (product) {
        trackProductView(product.id, Date.now() - startTime.current, source as any);
      }
    };
  }, [product]);

  const quantity = useCart((s) => (product ? s.items.find((i) => i.productId === String(product.id))?.quantity ?? 0 : 0));
  const add = useCart((s) => s.add);
  const decrement = useCart((s) => s.decrement);
  const { data: relatedProducts } = useRelatedProducts(slug);

  // Scroll-triggered CTA morph: while the related shelf is on screen the full
  // bottom bar condenses into a fixed floating pill in the bottom-right; back
  // at the product info it expands into the bar again. Animated so the morph
  // reads as one control moving, not two swapping.
  const { height: windowHeight } = useWindowDimensions();
  const [scrollY, setScrollY] = useState(0);
  const relatedLayout = useRef<{ y: number; height: number } | null>(null);
  const [relatedInView, setRelatedInView] = useState(false);
  const morph = useRef(new Animated.Value(0)).current; // 0 = bar, 1 = floating pill

  useEffect(() => {
    const layout = relatedLayout.current;
    if (!layout) {
      setRelatedInView(false);
      return;
    }
    const viewportBottom = scrollY + windowHeight;
    const inView = viewportBottom > layout.y + 80 && scrollY < layout.y + layout.height - 80;
    setRelatedInView(inView);
  }, [scrollY, relatedProducts, windowHeight]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(morph, { toValue: relatedInView ? 1 : 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [relatedInView, morph]);

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
      <Pressable
        onPress={() => {
          haptic.tap();
          handleBack();
        }}
        style={{
          position: 'absolute',
          top: insets.top + semanticSpacing.md,
          left: semanticSpacing.md,
          zIndex: 10,
          backgroundColor: 'rgba(255,255,255,0.9)',
          paddingHorizontal: semanticSpacing.md,
          paddingVertical: semanticSpacing.sm,
          borderRadius: semanticRadius.buttonPill,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <ChevronLeft size={20} color={theme.colors.text.primary} />
        <Text style={{ ...textStyle.caption, fontWeight: fontWeight.semibold, color: theme.colors.text.primary }}>
          Back
        </Text>
      </Pressable>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
      >
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
              {product && <SaveHeart productId={product.id} size={26} />}
              {imageSource && !imageError ? (
                <Image
                  source={imageSource}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                  cachePolicy="memory-disk"
                  onError={() => setImageError(true)}
                />
              ) : (
                <Text style={{ fontSize: 80 }}>🛒</Text>
              )}
            </View>
          </FadeSlideIn>

          {/* Category & Brand row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: semanticSpacing.inlineGap }}>
            {product.categoryName && (
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
                  {product.categoryName}
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

          {/* Related / recommended items */}
          {relatedProducts && relatedProducts.length > 0 && (
            <View
              onLayout={(e) => {
                relatedLayout.current = { y: e.nativeEvent.layout.y, height: e.nativeEvent.layout.height };
              }}
              style={{ marginTop: semanticSpacing.lg, gap: semanticSpacing.xs }}
            >
              <Text style={{ ...textStyle.h3, color: theme.colors.text.primary, fontFamily: fontFamily.primary }}>
                You might also like
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: semanticSpacing.inlineGap, paddingRight: semanticSpacing.screenPadding }}
                nestedScrollEnabled
              >
                {relatedProducts.map((item) => (
                  <RelatedCard key={item.id} item={item} />
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar — morphs into a floating pill (bottom-right) while
          the related shelf is on screen, and back into the bar at the top.
          Exactly one of the two is mounted at a time; `morph` drives the
          entrance of whichever one just took over. */}
      {!relatedInView && (
      <Animated.View
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
          opacity: morph,
          transform: [{ translateY: morph.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
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
      </Animated.View>
      )}

      {/* Floating CTA — the bar's condensed twin while browsing related items */}
      {relatedInView && (
      <Animated.View
        style={{
          position: 'absolute',
          right: semanticSpacing.screenPadding,
          bottom: semanticSpacing.md + insets.bottom,
          opacity: morph,
          transform: [
            { scale: morph.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
            { translateY: morph.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
          ],
        }}
      >
        {isOutOfStockEverywhere ? null : quantity === 0 ? (
          <TactilePressable
            onPress={handleAddToCart}
            haptic="commit"
            accessibilityRole="button"
            accessibilityLabel={`Add ${product.name} to cart`}
            disabled={showAvailabilityAlert}
            style={{
              backgroundColor: showAvailabilityAlert ? theme.colors.action.secondary.background : brand.orange,
              borderRadius: 28,
              paddingHorizontal: 18,
              paddingVertical: 14,
              opacity: showAvailabilityAlert ? 0.7 : 1,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Text style={{ color: theme.colors.text.inverse, fontWeight: fontWeight.bold, ...textStyle.buttonPrimary }}>
              {showAvailabilityAlert ? 'No store' : `Add \u00B7 ${formatZar(product.effectivePriceCents)}`}
            </Text>
          </TactilePressable>
        ) : (
          <View
            style={{
              backgroundColor: theme.colors.background.primary,
              borderRadius: 28,
              padding: 6,
              borderWidth: 1,
              borderColor: theme.colors.border.subtle,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Stepper quantity={quantity} onIncrement={handleAddToCart} onDecrement={handleDecrement} />
          </View>
        )}
      </Animated.View>
      )}
    </View>
  );
}