import { useState } from 'react';
import { View, Text, FlatList, ScrollView, RefreshControl } from 'react-native';
import { PhysicsCarousel } from '../../components/shared/PhysicsCarousel';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, MapPin, Store, RefreshCw } from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { brand, heroGradient } from '../../theme/colors';
import { textStyle, fontWeight } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
import { useCategories, useProducts, useSpecials, useTrendingProducts, usePopularProducts, useNewArrivals } from '../catalog/hooks';
import { ProductCard } from '../../components/shared/ProductCard';
import { CollectionPill } from '../../components/shared/CollectionPill';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { ProductCardSkeleton } from '../../components/shared/ProductCardSkeleton';
import { FadeSlideIn } from '../../components/shared/FadeSlideIn';
import { FadeEdgeScroll } from '../../components/shared/FadeEdgeScroll';
import { useDeliveryStore } from '../../stores/deliveryStore';
import { useCart } from '../cart/store';
import { EmptyState } from '../../components/shared/EmptyState';
import { Tag } from 'lucide-react-native';
import type { RootStackParamList } from '../../navigation/types';
import { Logo } from '../../components/shared/Logo';
import { useStoreSelection } from '../catalog/storeSelection';
import { useTopSafeArea } from '../../components/shared/ScreenHeader';
import type { ProductVO, StoreAvailabilityVO } from '../../lib/product';
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
            <FadeSlideIn>
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

      {/* First-run / unseeded catalogue: one coherent empty state with Apple polish */}
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
          {/* Banner carousel — dedicated entrance */}
          <FadeSlideIn delay={80} distance={12}>
            <BannerCarousel banners={banners} />
          </FadeSlideIn>

          {/* Picked for You recommendations — dedicated */}
          <FadeSlideIn delay={120} distance={10}>
            <RecommendationsSection />
          </FadeSlideIn>

          {/* Specials carousel — Apple list entrance */}
          <ErrorBoundary fallback={<View style={{ marginTop: semanticSpacing.lg, paddingHorizontal: semanticSpacing.screenPadding }}>
            <View style={{ backgroundColor: theme.colors.surface.elevated, borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border.subtle }}>
              <Text style={{ color: theme.colors.text.secondary, fontSize: 13, fontWeight: '500' }}>Specials unavailable</Text>
            </View>
          </View>}>
            <FadeSlideIn delay={160} distance={10} style={{ marginTop: semanticSpacing.lg }}>
              <SectionTitle title="Best Deals" icon={<Tag size={16} color={brand.orange} />} />
              {specials.length > 0 ? (
                <PhysicsCarousel
                  data={specials}
                  keyExtractor={(p) => String(p.id)}
                  snapInterval={200}
                  contentOffset={semanticSpacing.screenPadding}
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item, index }) => (
                    <View style={{ marginRight: index === specials.length - 1 ? 0 : 0 }}>
                      <ProductCard product={item} storeProductId={getStoreProductId(item)} source="home" />
                    </View>
                  )}
                />
              ) : (
                <Text style={{ color: theme.colors.text.secondary, paddingHorizontal: semanticSpacing.screenPadding, fontSize: 13 }}>No Specials right now — new deals land every week.</Text>
              )}
            </FadeSlideIn>
          </ErrorBoundary>

          {/* Categories — dedicated with fade edge */}
          <FadeSlideIn delay={200} distance={10} style={{ marginTop: semanticSpacing.xl }}>
            <SectionTitle title="Shop by category" icon={<Store size={16} color={brand.orange} />} />
            <FadeEdgeScroll
              fadeWidth={32}
              contentPaddingLeft={semanticSpacing.screenPadding}
              contentPaddingRight={semanticSpacing.screenPadding}
              backgroundColor={theme.colors.background.primary}
            >
              {categories.map((c, idx) => (
                <FadeSlideIn key={c.id} delay={idx * 20} distance={8} scaleFrom={0.96}>
                  <CollectionPill label={c.name} onPress={() => navigation.navigate('Tabs', { screen: 'Browse', params: { category: c.slug } })} />
                </FadeSlideIn>
              ))}
            </FadeEdgeScroll>
          </FadeSlideIn>

          {/* Trending Now — horizontal carousel with Apple polish */}
          {trending.length > 0 && (
            <FadeSlideIn delay={240} distance={12} style={{ marginTop: semanticSpacing.xl }}>
              <SectionTitle title="Trending Now" icon={<Tag size={16} color={brand.orange} />} />
              <PhysicsCarousel
                data={trending}
                keyExtractor={(p) => String(p.id)}
                snapInterval={200}
                contentOffset={semanticSpacing.screenPadding}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => <ProductCard product={item} storeProductId={getStoreProductId(item)} source="home" />}
              />
            </FadeSlideIn>
          )}

          {/* Popular — dedicated */}
          {popular.length > 0 && (
            <FadeSlideIn delay={280} distance={12} style={{ marginTop: semanticSpacing.xl }}>
              <SectionTitle title="Popular" icon={<Tag size={16} color={brand.orange} />} />
              <PhysicsCarousel
                data={popular}
                keyExtractor={(p) => String(p.id)}
                snapInterval={200}
                contentOffset={semanticSpacing.screenPadding}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => <ProductCard product={item} storeProductId={getStoreProductId(item)} source="home" />}
              />
            </FadeSlideIn>
          )}

          {/* New Arrivals — 2-col grid with staggered Apple entrance */}
          {newArrivals.length > 0 && (
            <FadeSlideIn delay={320} distance={12} style={{ marginTop: semanticSpacing.xl }}>
              <View style={{ paddingHorizontal: semanticSpacing.screenPadding }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: semanticSpacing.inlineGap, marginBottom: semanticSpacing.md }}>
                  <Text style={{ ...textStyle.h3, fontWeight: fontWeight.bold, color: theme.colors.text.primary, letterSpacing: -0.3 }}>New Arrivals</Text>
                  <View style={{ backgroundColor: brand.orange + '15', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: brand.orange, letterSpacing: 0.5 }}>NEW</Text>
                  </View>
                </View>
              </View>
              <FlatList
                data={newArrivals}
                keyExtractor={(p) => String(p.id)}
                numColumns={2}
                columnWrapperStyle={{ gap: semanticSpacing.inlineGap, paddingHorizontal: semanticSpacing.screenPadding }}
                contentContainerStyle={{ gap: semanticSpacing.inlineGap, paddingVertical: semanticSpacing.xs, paddingBottom: semanticSpacing.xl }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => (
                  <FadeSlideIn delay={index * 38} distance={14} scaleFrom={0.96}>
                    <ProductCard product={item} storeProductId={getStoreProductId(item)} source="home" />
                  </FadeSlideIn>
                )}
              />
            </FadeSlideIn>
          )}

          {/* Featured grid — fallback when trending is loading with shimmer */}
          {trendingLoading && (
            <FadeSlideIn delay={200} style={{ marginTop: semanticSpacing.xl }}>
              <View style={{ paddingHorizontal: semanticSpacing.screenPadding }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: semanticSpacing.inlineGap, marginBottom: semanticSpacing.md }}>
                  <Text style={{ ...textStyle.h3, fontWeight: fontWeight.bold, color: theme.colors.text.primary }}>Trending Now</Text>
                </View>
              </View>
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

function SectionTitle({ title, icon }: { title: string; icon: React.ReactNode | null }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: semanticSpacing.sm, paddingHorizontal: semanticSpacing.screenPadding, marginBottom: semanticSpacing.md }}>
      {icon ? (
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.surface.elevated, borderWidth: 1, borderColor: theme.colors.border.subtle, alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </View>
      ) : null}
      <Text style={{ ...textStyle.h3, fontWeight: fontWeight.bold, color: theme.colors.text.primary, letterSpacing: -0.3 }}>{title}</Text>
    </View>
  );
}

function cartSubtotal(items: { productId: string; quantity: number }[], products: { id: number; effectivePriceCents: number }[]): number {
  const priceOf = (id: string) => products.find((p) => p.id === Number(id))?.effectivePriceCents ?? 0;
  return items.reduce((sum, i) => sum + priceOf(i.productId) * i.quantity, 0);
}