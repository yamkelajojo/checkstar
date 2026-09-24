import { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, MapPin, Store, Tag } from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { brand, heroGradient } from '../../theme/colors';
import { textStyle, fontWeight } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
import { useCategories, useSpecials, useTrendingProducts, usePopularProducts, useNewArrivals } from '../catalog/hooks';
import { ProductCarousel } from '../../components/shared/ProductCarousel';
import { ProductGrid } from '../../components/shared/ProductGrid';
import { SectionHeader } from '../../components/shared/SectionHeader';
import { CollectionPill } from '../../components/shared/CollectionPill';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { ProductCardSkeleton } from '../../components/shared/ProductCardSkeleton';
import { FadeSlideIn } from '../../components/shared/FadeSlideIn';
import { FadeEdgeScroll } from '../../components/shared/FadeEdgeScroll';
import { useDeliveryStore } from '../../stores/deliveryStore';
import { useCart } from '../cart/store';
import { EmptyState } from '../../components/shared/EmptyState';
import type { RootStackParamList } from '../../navigation/types';
import { Logo } from '../../components/shared/Logo';
import { useStoreSelection } from '../catalog/storeSelection';
import { useTopSafeArea } from '../../components/shared/ScreenHeader';
import type { ProductVO } from '../../lib/product';
import { findStoreAvailability } from '../../lib/product';
import { ErrorBoundary } from '../../components/shared/ErrorBoundary';
import { FREE_DELIVERY_THRESHOLD_CENTS } from '../../lib/constants';
import { formatZar } from '../../lib/currency';
import { RecommendationsSection } from './RecommendationsSection';
import { BannerCarousel } from '../../components/shared/BannerCarousel';
import { fetchBanners } from '../../lib/apiClient';
import { queryKeys } from '../../lib/queryKeys';

function getSelectedStoreProductId(product: ProductVO, selection: { storeProductId: number; storeId: number } | undefined): number | null {
  if (!selection) return null;
  const store = product.stores.find((s) => s.storeProductId === selection.storeProductId);
  return store?.storeProductId ?? null;
}

export function HomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const topInset = useTopSafeArea();
  const [refreshing, setRefreshing] = useState(false);
  const store = useDeliveryStore((s) => s.fulfillmentStore);
  const { data: categories = [] } = useCategories();
  const { data: trending = [], isLoading: trendingLoading } = useTrendingProducts();
  const { data: popular = [] } = usePopularProducts();
  const { data: newArrivals = [] } = useNewArrivals();
  const { data: specials = [] } = useSpecials(store?.id ?? null);
  const { data: banners = [] } = useQuery({
    queryKey: queryKeys.banners,
    queryFn: fetchBanners,
  });
  const cartItems = useCart((s) => s.items);
  const needsAll = cartItems.length > 0 && cartItems.some((ci) => !trending.some((p) => String(p.id) === ci.productId));
  const { data: allProducts = [] } = useQuery({
    queryKey: ['products-all', store?.id],
    queryFn: async () => {
      const { fetchProducts } = await import('../../lib/apiClient');
      const { mapProduct } = await import('../../lib/product');
      const result = await fetchProducts({ store_id: store?.id ?? undefined });
      return result.data.map(mapProduct);
    },
    enabled: needsAll,
  });
  const priceSource = needsAll && allProducts.length > 0 ? allProducts : trending;
  const subtotal = cartSubtotal(cartItems, priceSource);
  const storeName = store?.name ?? 'Choose your store';

  // Helper to get effective storeProductId for a product
  const getStoreProductId = (product: ProductVO): number | null => {
    const selection = useStoreSelection.getState().getSelection(product.id);
    let effectiveStoreProductId: number | null = null;
    if (selection) {
      effectiveStoreProductId = getSelectedStoreProductId(product, selection);
    }
    if (!effectiveStoreProductId && store) {
      const avail = findStoreAvailability(product, store.id);
      effectiveStoreProductId = avail?.storeProductId ?? null;
    }
    return effectiveStoreProductId;
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
      contentContainerStyle={{ paddingBottom: semanticSpacing.xl }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            try {
              await queryClient.invalidateQueries({ queryKey: queryKeys.products({}) });
              await queryClient.invalidateQueries({ queryKey: queryKeys.categories });
              await queryClient.invalidateQueries({ queryKey: queryKeys.specials({ storeId: store?.id ?? null }) });
              await queryClient.invalidateQueries({ queryKey: queryKeys.banners });
            } finally {
              setRefreshing(false);
            }
          }}
          tintColor={brand.orange}
        />
      }
    >
      {/* Hero: atmospheric gradient that melts into the page background —
          light mode uses the warm peach wash, dark mode a faint ember glow
          (heroGradient keeps the final stop = background.primary so the
          header and page read as one continuous surface). */}
      <LinearGradient
        colors={heroGradient(theme.name, theme.colors.background.primary)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingBottom: semanticSpacing.sm }}
      >
        {/* Header: CheckStar logo + search + delivery Store */}
        <View style={{ paddingHorizontal: semanticSpacing.screenPadding, paddingTop: topInset, gap: semanticSpacing.xs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <FadeSlideIn delay={60}>
              <Logo variant="lockup" size={22} tone={theme.name} />
            </FadeSlideIn>
            <TactilePressable
              onPress={() => navigation.navigate('Search')}
              haptic="selection"
              accessibilityRole="button"
              accessibilityLabel="Search for products"
              style={{
                backgroundColor: theme.colors.surface.primary,
                borderRadius: semanticRadius.buttonPill,
                width: 44,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Search size={20} color={theme.colors.text.secondary} />
            </TactilePressable>
          </View>

          <TactilePressable
            onPress={() => navigation.navigate('StorePicker')}
            haptic="selection"
            accessibilityRole="button"
            accessibilityLabel="Choose delivery store"
            hitSlop={{ top: semanticSpacing.xs, bottom: semanticSpacing.xs }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: semanticSpacing.xxs, paddingVertical: 2 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: semanticSpacing.xxs }}>
              <MapPin size={16} color={brand.orange} />
              <Text style={{ fontWeight: fontWeight.semibold, color: theme.colors.text.primary, ...textStyle.body }}>
                {storeName}
              </Text>
            </View>
          </TactilePressable>
          {subtotal < FREE_DELIVERY_THRESHOLD_CENTS && subtotal > 0 && (
            <Text style={{ color: theme.colors.text.secondary, ...textStyle.caption }}>
              Free delivery over {formatZar(FREE_DELIVERY_THRESHOLD_CENTS)} — add more to qualify.
            </Text>
          )}
        </View>
      </LinearGradient>

      {/* First-run / unseeded catalogue: one coherent empty state */}
      {!trendingLoading && trending.length === 0 && specials.length === 0 && categories.length === 0 && banners.length === 0 ? (
        <FadeSlideIn delay={120} style={{ marginTop: semanticSpacing.sectionGap }}>
          <EmptyState
            icon={Store}
            title="The shelves are being stocked"
            caption="Products will appear here as soon as the store catalogue is ready. Pull down to refresh."
          />
        </FadeSlideIn>
      ) : (
        <>
          {/* Banner carousel */}
          <FadeSlideIn delay={80}>
            <BannerCarousel banners={banners} />
          </FadeSlideIn>

          {/* Picked for You recommendations */}
          <FadeSlideIn delay={120}>
            <RecommendationsSection />
          </FadeSlideIn>

          {/* Best Deals — the current sale products, as a product rail */}
          <ErrorBoundary fallback={<View style={{ marginTop: semanticSpacing.lg, paddingHorizontal: semanticSpacing.screenPadding }}>
            <View style={{ backgroundColor: theme.colors.surface.elevated, borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border.subtle }}>
              <Text style={{ color: theme.colors.text.secondary, fontSize: 13, fontWeight: '500' }}>Specials unavailable</Text>
            </View>
          </View>}>
            <FadeSlideIn delay={160} style={{ marginTop: semanticSpacing.lg }}>
              <SectionHeader title="Best Deals" icon={<Tag size={16} color={brand.orange} />} />
              {specials.length > 0 ? (
                <ProductCarousel
                  data={specials}
                  getStoreProductId={getStoreProductId}
                  source="home"
                />
              ) : (
                <Text style={{ color: theme.colors.text.secondary, paddingHorizontal: semanticSpacing.screenPadding, fontSize: 13 }}>No specials right now — new deals land every week.</Text>
              )}
            </FadeSlideIn>
          </ErrorBoundary>

          {/* Categories — with soft edge fades */}
          <FadeSlideIn delay={200} style={{ marginTop: semanticSpacing.xl }}>
            <SectionHeader title="Shop by category" icon={<Store size={16} color={brand.orange} />} />
            <FadeEdgeScroll
              fadeWidth={32}
              contentPaddingLeft={semanticSpacing.screenPadding}
              contentPaddingRight={semanticSpacing.screenPadding}
              backgroundColor={theme.colors.background.primary}
            >
              {categories.map((c, idx) => (
                <FadeSlideIn key={c.id} delay={idx * 20} distance={8}>
                  <CollectionPill label={c.name} onPress={() => navigation.navigate('Tabs', { screen: 'Browse', params: { category: c.slug } })} />
                </FadeSlideIn>
              ))}
            </FadeEdgeScroll>
          </FadeSlideIn>

          {/* Trending Now — product rail (same card size as the grid) */}
          {trending.length > 0 && (
            <FadeSlideIn delay={240} style={{ marginTop: semanticSpacing.xl }}>
              <SectionHeader title="Trending Now" icon={<Tag size={16} color={brand.orange} />} />
              <ProductCarousel
                data={trending}
                getStoreProductId={getStoreProductId}
                source="home"
              />
            </FadeSlideIn>
          )}

          {/* Popular — product rail */}
          {popular.length > 0 && (
            <FadeSlideIn delay={280} style={{ marginTop: semanticSpacing.xl }}>
              <SectionHeader title="Popular" icon={<Tag size={16} color={brand.orange} />} />
              <ProductCarousel
                data={popular}
                getStoreProductId={getStoreProductId}
                source="home"
              />
            </FadeSlideIn>
          )}

          {/* New Arrivals — the canonical 2-col grid */}
          {newArrivals.length > 0 && (
            <FadeSlideIn delay={320} style={{ marginTop: semanticSpacing.xl }}>
              <SectionHeader
                title="New Arrivals"
                trailing={
                  <View style={{ backgroundColor: brand.orange + '15', borderRadius: semanticRadius.smallControl, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: brand.orange, letterSpacing: 0.5 }}>NEW</Text>
                  </View>
                }
              />
              <ProductGrid
                data={newArrivals}
                getStoreProductId={getStoreProductId}
                source="home"
              />
            </FadeSlideIn>
          )}

          {/* Trending Now — loading shimmer */}
          {trendingLoading && (
            <FadeSlideIn delay={200} style={{ marginTop: semanticSpacing.xl }}>
              <SectionHeader title="Trending Now" />
              <View style={{ flexDirection: 'row', gap: semanticSpacing.inlineGap, paddingHorizontal: semanticSpacing.screenPadding }}>
                <ProductCardSkeleton />
                <ProductCardSkeleton />
              </View>
            </FadeSlideIn>
          )}
        </>
      )}
    </ScrollView>
  );
}

function cartSubtotal(items: { productId: string; quantity: number }[], products: { id: number; effectivePriceCents: number }[]): number {
  const priceOf = (id: string) => products.find((p) => p.id === Number(id))?.effectivePriceCents ?? 0;
  return items.reduce((sum, i) => sum + priceOf(i.productId) * i.quantity, 0);
}
