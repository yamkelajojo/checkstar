import { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, MapPin, Store, Tag, ChevronDown } from 'lucide-react-native';
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
import { EmptyState } from '../../components/shared/EmptyState';
import type { RootStackParamList } from '../../navigation/types';
import { Logo } from '../../components/shared/Logo';
import { useStoreSelection } from '../catalog/storeSelection';
import { useTopSafeArea } from '../../components/shared/ScreenHeader';
import type { ProductVO } from '../../lib/product';
import type { ApiBannerSlide } from '../../lib/types';
import { findStoreAvailability } from '../../lib/product';
import { ErrorBoundary } from '../../components/shared/ErrorBoundary';
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
  const storeName = store?.name ?? 'Choose your store';

  const getStoreProductId = useCallback((product: ProductVO): number | null => {
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
  }, [store]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.trendingProducts }),
        queryClient.invalidateQueries({ queryKey: queryKeys.popularProducts }),
        queryClient.invalidateQueries({ queryKey: queryKeys.newArrivals }),
        queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
        queryClient.invalidateQueries({ queryKey: queryKeys.specials({ storeId: store?.id ?? null }) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.banners }),
        queryClient.invalidateQueries({ queryKey: queryKeys.recommendations }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, store?.id]);

  const renderSection = (index: number, children: React.ReactNode, style?: ViewStyle) => (
    <FadeSlideIn delay={index * 40 + 80} distance={10} style={style}>
      {children}
    </FadeSlideIn>
  );

  // Backend normalises linked banner slide CTAs to `/specials/<slug>` (or
  // plain `/specials`). Map both onto the SaleDetail modal.
  const handleBannerSlidePress = (slide: ApiBannerSlide) => {
    const url = slide.url ?? '';
    if (!url.startsWith('/specials')) return;
    const slug = url.replace(/^\/specials\/?/, '');
    navigation.navigate('SaleDetail', { slug: slug || 'all' });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
      contentContainerStyle={{ paddingBottom: semanticSpacing.xl }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={brand.orange}
          progressBackgroundColor={theme.colors.surface.primary}
        />
      }
    >
      {/* Hero Gradient Header */}
      <LinearGradient
        colors={heroGradient(theme.name, theme.colors.background.primary)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingBottom: semanticSpacing.sm }}
      >
        <View style={{ paddingHorizontal: semanticSpacing.screenPadding, paddingTop: topInset, gap: semanticSpacing.xs }}>
          {/* Top Row: Logo + Search */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <FadeSlideIn delay={40} distance={6}>
              <Logo variant="lockup" size={24} tone={theme.name} />
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
                borderWidth: 1,
                borderColor: theme.colors.border.subtle,
              }}
            >
              <Search size={22} color={theme.colors.text.secondary} strokeWidth={2} />
            </TactilePressable>
          </View>

          {/* Store Selector */}
          <View style={{ gap: semanticSpacing.xs }}>
            <TactilePressable
              onPress={() => navigation.navigate('StorePicker')}
              haptic="selection"
              accessibilityRole="button"
              accessibilityLabel="Choose delivery store"
              hitSlop={{ top: semanticSpacing.xs, bottom: semanticSpacing.xs, left: semanticSpacing.xs, right: semanticSpacing.xs }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: semanticSpacing.sm,
                paddingHorizontal: semanticSpacing.sm,
                paddingVertical: semanticSpacing.xs,
                backgroundColor: theme.colors.surface.primary,
                borderRadius: semanticRadius.card,
                borderWidth: 1,
                borderColor: theme.colors.border.subtle,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: semanticSpacing.xxs, flex: 1, minWidth: 0 }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: brand.orange + '15', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MapPin size={14} color={brand.orange} strokeWidth={2} />
                </View>
                <Text style={{ fontWeight: fontWeight.semibold, color: theme.colors.text.primary, ...textStyle.body, flexShrink: 1 }}>
                  {storeName}
                </Text>
              </View>
              <ChevronDown size={16} color={theme.colors.text.tertiary} strokeWidth={2} />
            </TactilePressable>
          </View>
        </View>
      </LinearGradient>

      {/* Content Sections */}
      {!trendingLoading && trending.length === 0 && specials.length === 0 && categories.length === 0 && banners.length === 0 ? (
        /* Empty State */
        <FadeSlideIn delay={120} style={{ marginTop: semanticSpacing.md, paddingHorizontal: semanticSpacing.screenPadding }}>
          <EmptyState
            icon={Store}
            title="The shelves are being stocked"
            caption="Products will appear here as soon as the store catalogue is ready. Pull down to refresh."
            action={
              <TactilePressable onPress={handleRefresh} haptic="selection" style={{ marginTop: semanticSpacing.sm, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: theme.colors.surface.primary, borderRadius: 999, borderWidth: 1, borderColor: theme.colors.border.subtle }}>
                <Text style={{ color: theme.colors.text.primary, fontWeight: '600', fontSize: 12 }}>Retry</Text>
              </TactilePressable>
            }
          />
        </FadeSlideIn>
      ) : (
        <>
          {/* Banner Carousel */}
          {banners.length > 0 && renderSection(0, <BannerCarousel banners={banners} onSlidePress={handleBannerSlidePress} />, { marginTop: semanticSpacing.xs })}

          {/* Picked for You Recommendations */}
          <RecommendationsSection />

          {/* Best Deals — Sale Products Rail */}
          {renderSection(2, (
            <ErrorBoundary fallback={<View style={{ marginTop: semanticSpacing.md, paddingHorizontal: semanticSpacing.screenPadding }}>
              <View style={{ backgroundColor: theme.colors.surface.elevated, borderRadius: semanticRadius.card, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border.subtle }}>
                <Text style={{ color: theme.colors.text.secondary, fontSize: 13, fontWeight: '500' }}>Specials unavailable</Text>
              </View>
            </View>}>
              <View style={{ marginTop: semanticSpacing.md }}>
                <SectionHeader
                  title="Best Deals"
                  icon={<Tag size={16} color={brand.orange} />}
                  trailing={
                    specials.length > 0 ? (
                      <TactilePressable
                        onPress={() => navigation.navigate('SaleDetail', { slug: 'all' })}
                        haptic="selection"
                        accessibilityRole="button"
                        accessibilityLabel="View all specials"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={{ color: brand.orange, fontWeight: fontWeight.semibold, ...textStyle.caption }}>View all</Text>
                      </TactilePressable>
                    ) : null
                  }
                />
                {specials.length > 0 ? (
                  <ProductCarousel
                    data={specials}
                    getStoreProductId={getStoreProductId}
                    source="home"
                  />
                ) : (
                  <Text style={{ color: theme.colors.text.secondary, paddingHorizontal: semanticSpacing.screenPadding, fontSize: 13 }}>No specials right now — new deals land every week.</Text>
                )}
              </View>
            </ErrorBoundary>
          ))}

          {/* Categories — Horizontal Pills */}
          {categories.length > 0 && renderSection(3, (
            <View style={{ marginTop: semanticSpacing.md }}>
              <SectionHeader title="Shop by category" icon={<Store size={16} color={brand.orange} />} />
              <FadeEdgeScroll
                fadeWidth={32}
                contentPaddingLeft={semanticSpacing.screenPadding}
                contentPaddingRight={semanticSpacing.screenPadding}
                backgroundColor={theme.colors.background.primary}
              >
                {categories.map((c, idx) => (
                  <FadeSlideIn key={c.id} delay={idx * 15} distance={6}>
                    <CollectionPill
                      label={c.name}
                      onPress={() => navigation.navigate('Tabs', { screen: 'Browse', params: { category: c.slug } })}
                    />
                  </FadeSlideIn>
                ))}
              </FadeEdgeScroll>
            </View>
          ))}

          {/* Trending Now — Product Rail */}
          {trending.length > 0 && renderSection(4, (
            <View style={{ marginTop: semanticSpacing.md }}>
              <SectionHeader title="Trending Now" icon={<Tag size={16} color={brand.orange} />} />
              <ProductCarousel
                data={trending}
                getStoreProductId={getStoreProductId}
                source="home"
              />
            </View>
          ))}

          {/* Popular — Product Rail */}
          {popular.length > 0 && renderSection(5, (
            <View style={{ marginTop: semanticSpacing.md }}>
              <SectionHeader title="Popular" icon={<Tag size={16} color={brand.orange} />} />
              <ProductCarousel
                data={popular}
                getStoreProductId={getStoreProductId}
                source="home"
              />
            </View>
          ))}

          {/* New Arrivals — 2-Col Grid */}
          {newArrivals.length > 0 && renderSection(6, (
            <View style={{ marginTop: semanticSpacing.md }}>
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
                scrollEnabled={false}
              />
            </View>
          ))}

          {/* Loading Shimmer for Trending */}
          {trendingLoading && renderSection(7, (
            <View style={{ marginTop: semanticSpacing.md }}>
              <SectionHeader title="Trending Now" />
              <View style={{ flexDirection: 'row', gap: semanticSpacing.inlineGap, paddingHorizontal: semanticSpacing.screenPadding }}>
                <ProductCardSkeleton />
                <ProductCardSkeleton />
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

// Type for renderSection style parameter
type ViewStyle = import('react-native').ViewStyle;