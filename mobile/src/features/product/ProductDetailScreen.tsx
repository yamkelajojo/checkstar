import { View, Text, ScrollView, Pressable, useWindowDimensions, Image as RNImage } from 'react-native';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { textStyle, fontWeight } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
import { useProduct, useRelatedProducts } from '../catalog/hooks';
import type { ProductVO } from '../../lib/product';
import { PriceLabel } from '../../components/shared/PriceLabel';
import { PriceGauge } from '../../components/shared/PriceGauge';
import { Stepper } from '../../components/shared/Stepper';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { SkeletonCard } from '../../components/shared/SkeletonCard';
import { FadeSlideIn } from '../../components/shared/FadeSlideIn';
import { CrashCascadeIn } from '../../components/shared/CrashCascadeIn';
import { useCart } from '../cart/store';
import { formatZar } from '../../lib/currency';
import { ChevronLeft } from 'lucide-react-native';
import { useDeliveryStore } from '../../stores/deliveryStore';
import { useToast } from '../../components/shared/GlassToast';
import { trackProductView } from '../../services/trackingService';
import { SaveHeart } from '../../components/shared/SaveHeart';
import { haptic } from '../../lib/haptics';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate } from 'react-native-reanimated';

function RelatedCard({ item, index }: { item: ProductVO; index: number }) {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  return (
    <CrashCascadeIn index={index}>
      <TactilePressable
        onPress={() => navigation.push('ProductDetail', { slug: item.slug, source: 'related' })}
        haptic="selection"
        style={{
          width: 140,
          backgroundColor: theme.colors.surface.primary,
          borderRadius: semanticRadius.card,
          padding: 8,
          gap: 6,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 6,
          elevation: 1,
        }}
      >
        <View style={{ width: '100%', aspectRatio: 1, borderRadius: 12, backgroundColor: theme.colors.background.secondary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {item.images[0] ? <RNImage source={{ uri: item.images[0] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <Text style={{ fontSize: 28 }}>🛒</Text>}
        </View>
        <Text numberOfLines={2} style={{ fontSize: 11, color: theme.colors.text.primary, fontWeight: '600', minHeight: 28, letterSpacing: -0.1, lineHeight: 13 }}>
          {item.name}
        </Text>
        <PriceLabel priceCents={item.basePriceCents} salePriceCents={item.salePriceCents} unit={item.unit} size={12} />
      </TactilePressable>
    </CrashCascadeIn>
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
  const [imageSource, setImageSource] = useState<{ uri: string } | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
    setImageSource(product && product.images[0] ? { uri: product.images[0] } : null);
  }, [product]);

  const startTime = useRef(Date.now());
  useEffect(() => {
    return () => {
      if (product) trackProductView(product.id, Date.now() - startTime.current, source as any);
    };
  }, [product]);

  const quantity = useCart((s) => (product ? s.items.find((i) => i.productId === String(product.id))?.quantity ?? 0 : 0));
  const add = useCart((s) => s.add);
  const decrement = useCart((s) => s.decrement);
  const { data: relatedProducts } = useRelatedProducts(slug);

  const [scrollY, setScrollY] = useState(0);
  const relatedLayout = useRef<{ y: number; height: number } | null>(null);
  const [relatedInView, setRelatedInView] = useState(false);
  const morph = useSharedValue(0);
  const { height: windowHeight } = useWindowDimensions();

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
    morph.value = withTiming(relatedInView ? 1 : 0, { duration: 260 });
  }, [relatedInView]);

  const bottomBarStyle = useAnimatedStyle(() => {
    const opacity = morph.value;
    const translateY = interpolate(morph.value, [0, 1], [24, 0]);
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const fabStyle = useAnimatedStyle(() => {
    const opacity = morph.value;
    const scale = interpolate(morph.value, [0, 1], [0.6, 1]);
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  if (isLoading || !product) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background.primary, padding: semanticSpacing.screenPadding, paddingTop: 72 }}>
        <SkeletonCard width="100%" height={360} />
      </View>
    );
  }

  const onSale = product.salePriceCents != null && product.salePriceCents < product.basePriceCents;
  const currentStoreAvail = currentStore ? product.stores.find((s) => s.id === currentStore.id && s.isAvailable && s.stockQuantity > 0) : undefined;
  const isAvailableAtCurrentStore = !!currentStoreAvail;
  const hasAlternativeStores = product.stores.some((s) => s.id !== currentStore?.id && s.isAvailable && s.stockQuantity > 0);
  const showAvailabilityAlert = !isAvailableAtCurrentStore && hasAlternativeStores;
  const isOutOfStockEverywhere = product.stores.length === 0 || !product.stores.some((s) => s.isAvailable && s.stockQuantity > 0);

  const toast = useToast();
  const handleAddToCart = () => {
    if (isOutOfStockEverywhere) return;
    add(String(product.id), 1);
    haptic.success();
    toast.show('Added to cart', { tone: 'success' });
  };
  const handleDecrement = () => {
    if (isOutOfStockEverywhere) return;
    haptic.selection();
    decrement(String(product.id));
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <FadeSlideIn delay={60} distance={8} initialScale={0.96}>
        <Pressable
          onPress={() => {
            haptic.selection();
            navigation.goBack();
          }}
          style={{
            position: 'absolute',
            top: insets.top + 12,
            left: 12,
            zIndex: 10,
            backgroundColor: 'rgba(255,255,255,0.92)',
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 999,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.06)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <ChevronLeft size={16} color={theme.colors.text.primary} strokeWidth={2.2} />
          <Text style={{ fontSize: 12, fontWeight: '600', letterSpacing: 0.2, color: theme.colors.text.primary }}>Back</Text>
        </Pressable>
      </FadeSlideIn>

      <ScrollView contentContainerStyle={{ paddingBottom: 160 }} showsVerticalScrollIndicator={false} scrollEventThrottle={16} onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}>
        <View style={{ paddingTop: insets.top + 56, paddingHorizontal: semanticSpacing.screenPadding, gap: 12 }}>
          <FadeSlideIn delay={80} distance={16} initialScale={0.96}>
            <View
              style={{
                width: '100%',
                aspectRatio: 1,
                borderRadius: 20,
                backgroundColor: theme.colors.surface.primary,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: theme.colors.border.subtle,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.06,
                shadowRadius: 12,
                elevation: 2,
              }}
            >
              {product && <SaveHeart productId={product.id} size={24} />}
              {imageSource && !imageError ? (
                <Image source={imageSource} style={{ width: '100%', height: '100%' }} contentFit="cover" cachePolicy="memory-disk" onError={() => setImageError(true)} />
              ) : (
                <Text style={{ fontSize: 72 }}>🛒</Text>
              )}
              {onSale ? (
                <View style={{ position: 'absolute', top: 12, left: 12, backgroundColor: theme.colors.text.primary, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    {product.salePriceCents ? Math.round((1 - product.salePriceCents / product.basePriceCents) * 100) : 0}% OFF
                  </Text>
                </View>
              ) : null}
            </View>
          </FadeSlideIn>

          <FadeSlideIn delay={120} distance={10}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              {product.categoryName ? (
                <View style={{ backgroundColor: brand.orange + '15', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: brand.orange + '20' }}>
                  <Text style={{ color: brand.orange, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' }}>{product.categoryName}</Text>
                </View>
              ) : (
                <View />
              )}
              {product.brand ? <Text style={{ color: theme.colors.text.tertiary, fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase', fontWeight: '500' }}>{product.brand}</Text> : null}
            </View>
          </FadeSlideIn>

          <FadeSlideIn delay={160} distance={8}>
            <Text style={[textStyle.h2, { color: theme.colors.text.primary, letterSpacing: -0.3, lineHeight: 26 }]}>{product.name}</Text>
          </FadeSlideIn>

          <FadeSlideIn delay={180} distance={8}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <PriceLabel priceCents={product.basePriceCents} salePriceCents={product.salePriceCents} unit={product.unit} size={26} />
              <View style={{ backgroundColor: theme.colors.surface.elevated, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: theme.colors.border.subtle }}>
                <Text style={{ color: theme.colors.text.secondary, fontSize: 10, letterSpacing: 0.2 }}>{product.unit} per unit</Text>
              </View>
            </View>
          </FadeSlideIn>

          <FadeSlideIn delay={200} distance={8}>
            <PriceGauge priceCents={product.basePriceCents} salePriceCents={product.salePriceCents} unit={product.unit} />
          </FadeSlideIn>

          {showAvailabilityAlert && currentStore ? (
            <FadeSlideIn delay={220} distance={8}>
              <View style={{ backgroundColor: theme.colors.surface.primary, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.colors.border.subtle, flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: brand.orange + '15', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 12 }}>ℹ️</Text>
                </View>
                <Text style={{ flex: 1, color: theme.colors.text.secondary, fontSize: 11, lineHeight: 15 }}>Not available from your nearest store. We&apos;ll check another nearby store at checkout.</Text>
              </View>
            </FadeSlideIn>
          ) : null}

          {isOutOfStockEverywhere ? (
            <FadeSlideIn delay={220} distance={8}>
              <View style={{ backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#FECACA' }}>
                <Text style={{ color: '#991B1B', fontSize: 12, fontWeight: '500' }}>Currently unavailable at all stores</Text>
              </View>
            </FadeSlideIn>
          ) : null}

          {product.description ? (
            <FadeSlideIn delay={240} distance={10}>
              <View style={{ gap: 8, backgroundColor: theme.colors.surface.primary, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: theme.colors.border.subtle }}>
                <Text style={{ fontWeight: '700', color: theme.colors.text.primary, fontSize: 13, letterSpacing: -0.2 }}>Description</Text>
                <Text style={{ color: theme.colors.text.secondary, fontSize: 13, lineHeight: 20 }}>{product.description}</Text>
              </View>
            </FadeSlideIn>
          ) : null}

          {product.keyPoints.length > 0 ? (
            <FadeSlideIn delay={260} distance={10}>
              <View style={{ gap: 8 }}>
                <Text style={{ fontWeight: '700', color: theme.colors.text.primary, fontSize: 13, letterSpacing: -0.2, paddingHorizontal: 2 }}>Highlights</Text>
                <View style={{ gap: 8, backgroundColor: theme.colors.surface.primary, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: theme.colors.border.subtle }}>
                  {product.keyPoints.map((point, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: brand.orange, marginTop: 6 }} />
                      <Text style={{ color: theme.colors.text.secondary, fontSize: 12, lineHeight: 16, flex: 1 }}>{point}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </FadeSlideIn>
          ) : null}

          {product.storageTip ? (
            <FadeSlideIn delay={280} distance={8}>
              <View style={{ gap: 6 }}>
                <Text style={{ fontWeight: '700', color: theme.colors.text.primary, fontSize: 13, letterSpacing: -0.2, paddingHorizontal: 2 }}>Storage Tip</Text>
                <View style={{ backgroundColor: brand.orange + '0F', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: brand.orange + '20' }}>
                  <Text style={{ fontSize: 12, color: theme.colors.text.secondary, lineHeight: 16 }}>{product.storageTip}</Text>
                </View>
              </View>
            </FadeSlideIn>
          ) : null}

          {product.tags && product.tags.length > 0 ? (
            <FadeSlideIn delay={300} distance={8}>
              <View style={{ gap: 8 }}>
                <Text style={{ fontWeight: '700', color: theme.colors.text.primary, fontSize: 13, letterSpacing: -0.2, paddingHorizontal: 2 }}>Details</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {product.tags.map((tag, i) => (
                    <View key={i} style={{ backgroundColor: theme.colors.surface.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: theme.colors.border.subtle }}>
                      <Text style={{ fontSize: 10, color: theme.colors.text.secondary, fontWeight: '500', letterSpacing: 0.2 }}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </FadeSlideIn>
          ) : null}

          {relatedProducts && relatedProducts.length > 0 ? (
            <View onLayout={(e) => (relatedLayout.current = { y: e.nativeEvent.layout.y, height: e.nativeEvent.layout.height })} style={{ marginTop: 8, gap: 10 }}>
              <FadeSlideIn delay={320} distance={8}>
                <Text style={{ fontWeight: '700', color: theme.colors.text.primary, fontSize: 14, letterSpacing: -0.2 }}>You might also like</Text>
              </FadeSlideIn>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: semanticSpacing.screenPadding }} nestedScrollEnabled>
                {relatedProducts.map((item, idx) => (
                  <RelatedCard key={item.id} item={item} index={idx} />
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {!relatedInView ? (
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              paddingHorizontal: semanticSpacing.screenPadding,
              paddingVertical: 14,
              paddingBottom: 14 + insets.bottom,
              borderTopWidth: 1,
              borderTopColor: theme.colors.border.subtle,
              backgroundColor: theme.colors.background.primary,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 8,
            },
            bottomBarStyle,
          ]}
        >
          {isOutOfStockEverywhere ? (
            <View style={{ alignItems: 'center', width: '80%', alignSelf: 'center' }}>
              <Text style={{ color: theme.colors.text.secondary, fontSize: 12 }}>Unavailable at all stores</Text>
            </View>
          ) : quantity === 0 ? (
            <TactilePressable onPress={handleAddToCart} haptic="commit" style={{ backgroundColor: theme.colors.text.primary, borderRadius: 999, width: '80%', alignSelf: 'center', paddingVertical: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 }}>
              <Text style={{ color: theme.colors.text.inverse, fontWeight: '700', fontSize: 12, letterSpacing: 0.3, textTransform: 'uppercase' }}>{`Add to cart · ${formatZar(product.effectivePriceCents)}`}</Text>
            </TactilePressable>
          ) : (
            <View style={{ alignItems: 'center', width: '80%', alignSelf: 'center' }}>
              <Stepper quantity={quantity} onIncrement={handleAddToCart} onDecrement={handleDecrement} />
            </View>
          )}
        </Animated.View>
      ) : null}

      {relatedInView ? (
        <Animated.View
          style={[
            {
              position: 'absolute',
              right: semanticSpacing.screenPadding,
              bottom: 16 + insets.bottom,
            },
            fabStyle,
          ]}
        >
          {isOutOfStockEverywhere ? null : quantity === 0 ? (
            <TactilePressable onPress={handleAddToCart} haptic="commit" style={{ backgroundColor: theme.colors.text.primary, borderRadius: 28, paddingHorizontal: 18, paddingVertical: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6 }}>
              <Text style={{ color: theme.colors.text.inverse, fontWeight: '700', fontSize: 12 }}>{`Add · ${formatZar(product.effectivePriceCents)}`}</Text>
            </TactilePressable>
          ) : (
            <View style={{ backgroundColor: theme.colors.background.primary, borderRadius: 28, padding: 6, borderWidth: 1, borderColor: theme.colors.border.subtle, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 }}>
              <Stepper quantity={quantity} onIncrement={handleAddToCart} onDecrement={handleDecrement} />
            </View>
          )}
        </Animated.View>
      ) : null}
    </View>
  );
}
