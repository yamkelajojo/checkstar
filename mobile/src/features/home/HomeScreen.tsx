import { View, Text, FlatList, ScrollView } from 'react-native';
import { PhysicsCarousel } from '../../components/shared/PhysicsCarousel';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, MapPin, Store } from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { textStyle, fontWeight } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
import { useCategories, useProducts, useSpecials } from '../catalog/hooks';
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
import type { ProductVO, StoreAvailabilityVO } from '../../lib/product';
import { findStoreAvailability } from '../../lib/product';
import { ErrorBoundary } from '../../components/shared/ErrorBoundary';
import { FREE_DELIVERY_THRESHOLD_CENTS } from '../../lib/constants';
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
  const store = useDeliveryStore((s) => s.fulfillmentStore);
  const { data: categories = [] } = useCategories();
  const { data: products = [], isLoading } = useProducts({ storeId: store?.id ?? null, featured: true });
  const { data: specials = [] } = useSpecials(store?.id ?? null);
  const { data: banners = [] } = useQuery({
    queryKey: queryKeys.banners,
    queryFn: fetchBanners,
  });
  const cartItems = useCart((s) => s.items);
  const needsAll = cartItems.length > 0 && cartItems.some((ci) => !products.some((p) => String(p.id) === ci.productId));
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
  const priceSource = needsAll && allProducts.length > 0 ? allProducts : products;
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
    >
      {/* Hero: subtle orange atmospheric gradient */}
      <LinearGradient
        colors={['rgba(255,224,204,0.35)', 'rgba(255,224,204,0.08)', theme.colors.background.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingBottom: semanticSpacing.md }}
      >
        {/* Header: CheckStar logo + search + delivery Store */}
        <View style={{ paddingHorizontal: semanticSpacing.screenPadding, paddingTop: 56, gap: semanticSpacing.inlineGap }}>
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
            style={{ flexDirection: 'row', alignItems: 'center', gap: semanticSpacing.xxs }}
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
              Free delivery over R {FREE_DELIVERY_THRESHOLD_CENTS / 100},00 — add more to qualify.
            </Text>
          )}
        </View>
      </LinearGradient>

      {/* Banner carousel */}
      <BannerCarousel banners={banners} />

      {/* Picked for You recommendations */}
      <RecommendationsSection />

      {/* Specials carousel */}
      <ErrorBoundary fallback={<View style={{ marginTop: semanticSpacing.lg, paddingHorizontal: semanticSpacing.screenPadding }}>
        <View style={{ backgroundColor: theme.colors.surface.elevated, borderRadius: 12, padding: 20, alignItems: 'center' }}>
          <Text style={{ color: theme.colors.text.secondary, fontSize: 14 }}>Specials unavailable</Text>
        </View>
      </View>}>
        <View style={{ marginTop: semanticSpacing.lg }}>
          <SectionTitle title="Best Deals" icon={<Tag size={16} color={brand.orange} />} />
          {specials.length > 0 ? (
            <PhysicsCarousel
              data={specials}
              keyExtractor={(p) => String(p.id)}
              snapInterval={200}
              contentOffset={semanticSpacing.screenPadding}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => <ProductCard product={item} storeProductId={getStoreProductId(item)} source="home" />}
            />
          ) : (
            <Text style={{ color: theme.colors.text.secondary, paddingHorizontal: semanticSpacing.screenPadding }}>No Specials right now — new deals land every week.</Text>
          )}
        </View>
      </ErrorBoundary>

      {/* Categories — GreenBidder FadeEdgeScroll pattern: gradient fade hints scrollability, snap, no truncation */}
      <View style={{ marginTop: semanticSpacing.xl }}>
        <SectionTitle title="Shop by category" icon={<Store size={16} color={brand.orange} />} />
        <FadeEdgeScroll
          fadeWidth={28}
          contentPaddingLeft={semanticSpacing.screenPadding}
          contentPaddingRight={semanticSpacing.screenPadding}
          backgroundColor={theme.colors.background.primary}
        >
          {categories.map((c) => (
            <CollectionPill key={c.id} label={c.name} onPress={() => navigation.navigate('Tabs', { screen: 'Browse', params: { category: c.slug } })} />
          ))}
        </FadeEdgeScroll>
      </View>

      {/* Featured grid — uses FlatList with numColumns=2 for consistent 2-col grid */}
      <View style={{ marginTop: semanticSpacing.xl }}>
        <View style={{ paddingHorizontal: semanticSpacing.screenPadding }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: semanticSpacing.inlineGap, marginBottom: semanticSpacing.inlineGap }}>
            <Text style={{ ...textStyle.h3, fontWeight: fontWeight.bold, color: theme.colors.text.primary }}>Featured</Text>
          </View>
        </View>
        {isLoading ? (
          <View style={{ flexDirection: 'row', gap: semanticSpacing.inlineGap, paddingHorizontal: semanticSpacing.screenPadding }}>
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </View>
        ) : products.length === 0 ? (
          <View style={{ paddingHorizontal: semanticSpacing.screenPadding }}>
            <EmptyState icon={Tag} title="No featured products yet" caption="Check back soon." />
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(p) => String(p.id)}
            numColumns={2}
            columnWrapperStyle={{ gap: semanticSpacing.inlineGap, paddingHorizontal: semanticSpacing.screenPadding }}
            contentContainerStyle={{ gap: semanticSpacing.inlineGap, paddingVertical: semanticSpacing.xs, paddingBottom: semanticSpacing.xl }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <FadeSlideIn delay={index * 40} distance={16}>
                <ProductCard product={item} storeProductId={getStoreProductId(item)} source="home" />
              </FadeSlideIn>
            )}
          />
        )}
      </View>
    </ScrollView>
  );
}

function SectionTitle({ title, icon }: { title: string; icon: React.ReactNode | null }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: semanticSpacing.inlineGap, paddingHorizontal: semanticSpacing.screenPadding, marginBottom: semanticSpacing.inlineGap }}>
      {icon}
      <Text style={{ ...textStyle.h3, fontWeight: fontWeight.bold, color: theme.colors.text.primary }}>{title}</Text>
    </View>
  );
}

function cartSubtotal(items: { productId: string; quantity: number }[], products: { id: number; effectivePriceCents: number }[]): number {
  const priceOf = (id: string) => products.find((p) => p.id === Number(id))?.effectivePriceCents ?? 0;
  return items.reduce((sum, i) => sum + priceOf(i.productId) * i.quantity, 0);
}