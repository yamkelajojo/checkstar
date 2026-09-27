import { useEffect, useState } from 'react';
import { View, Text, ScrollView, FlatList, RefreshControl, Image } from 'react-native';
import { mediaUri } from '../../lib/media';
import { ChevronLeft, Tag } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { textStyle, fontWeight } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
import { useDeliveryStore } from '../../stores/deliveryStore';
import { ProductCard } from '../../components/shared/ProductCard';
import { ProductCardSkeleton } from '../../components/shared/ProductCardSkeleton';
import { EmptyState } from '../../components/shared/EmptyState';
import { FadeSlideIn } from '../../components/shared/FadeSlideIn';
import { haptic } from '../../lib/haptics';
import { formatZar } from '../../lib/currency';
import { fetchProducts, fetchSpecials } from '../../lib/apiClient';
import type { ProductVO, StoreAvailabilityVO } from '../../lib/product';
import { findStoreAvailability, mapProduct } from '../../lib/product';
import type { RootStackParamList } from '../../navigation/types';
import { ScreenHeader } from '../../components/shared/ScreenHeader';

type SaleDetailScreenRouteProp = RouteProp<RootStackParamList, 'SaleDetail'>;

export function SaleDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<SaleDetailScreenRouteProp>();
  const store = useDeliveryStore((s) => s.fulfillmentStore);
  const { slug } = route.params;

  const [special, setSpecial] = useState<{ id: number; name: string; slug: string; description?: string; banner_image?: string; start_date?: string; end_date?: string; is_active: boolean } | null>(null);
  const [products, setProducts] = useState<ProductVO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getStoreProductId = (product: ProductVO): number | null => {
    if (!store) return null;
    const avail = findStoreAvailability(product, store.id);
    return avail?.storeProductId ?? null;
  };

  const loadSale = async () => {
    try {
      // Fetch specials products
      const specialsResult = await fetchSpecials({ store_id: store?.id ?? undefined });
      const specialsProducts = specialsResult.data.map(mapProduct);
      
      if (slug === 'all' || !slug) {
        // Show all specials
        setSpecial({
          id: 0,
          name: 'All Specials',
          slug: 'all',
          description: 'All products currently on special',
          is_active: true,
        });
        setProducts(specialsProducts);
      } else {
        // Try to find a specific special by slug (when backend supports it)
        // For now, fall back to all specials
        setSpecial({
          id: 0,
          name: 'All Specials',
          slug: 'all',
          description: 'All products currently on special',
          is_active: true,
        });
        setProducts(specialsProducts);
      }
    } catch (error) {
      console.error('Failed to load sale:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSale();
  };

  useEffect(() => {
    loadSale();
  }, [slug, store?.id]);

  const isActive = special?.is_active && (!special.end_date || new Date(special.end_date) > new Date());
  const isEnded = special?.end_date && new Date(special.end_date) <= new Date();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
        <ScreenHeader title="Sale" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={{ flexDirection: 'row', gap: semanticSpacing.inlineGap, paddingHorizontal: semanticSpacing.screenPadding, marginTop: semanticSpacing.md }}>
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </View>
      </View>
    );
  }

  if (!special) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
        <ScreenHeader title="Sale" showBackButton onBackPress={() => navigation.goBack()} />
        <EmptyState
          icon={Tag}
          title="Sale not found"
          caption="This sale doesn't exist or has ended."
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={brand.orange}
        />
      }
    >
      <ScreenHeader
        title={special.name}
        showBackButton={true}
        backButtonVariant="back"
        onBackPress={() => navigation.goBack()}
      />
      {/* Sale Header */}
      <View style={{ paddingHorizontal: semanticSpacing.screenPadding, paddingBottom: semanticSpacing.lg }}>
        {special.banner_image && (
          <View style={{ marginBottom: semanticSpacing.md, borderRadius: semanticRadius.card, overflow: 'hidden' }}>
            <Image
              source={{ uri: mediaUri(special.banner_image) }}
              style={{ width: '100%', height: 180, resizeMode: 'cover' }}
              resizeMode="cover"
            />
          </View>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: semanticSpacing.inlineGap, marginBottom: semanticSpacing.xs }}>
          <Text style={{ ...textStyle.h2, fontWeight: fontWeight.bold, color: theme.colors.text.primary }}>
            {special.name}
          </Text>
          <View style={{ backgroundColor: isActive ? brand.success + '15' : theme.colors.text.tertiary + '15', borderRadius: semanticRadius.smallControl, paddingHorizontal: semanticSpacing.inlineGap, paddingVertical: semanticSpacing.xxs }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: isActive ? brand.success : theme.colors.text.tertiary, letterSpacing: 0.5 }}>
              {isActive ? 'ACTIVE' : 'ENDED'}
            </Text>
          </View>
        </View>
        {special.description && (
          <Text style={{ color: theme.colors.text.secondary, ...textStyle.body, marginBottom: semanticSpacing.xs }}>
            {special.description}
          </Text>
        )}
        {(special.start_date || special.end_date) && (
          <Text style={{ color: theme.colors.text.tertiary, ...textStyle.caption }}>
            {special.start_date && `From ${new Date(special.start_date).toLocaleDateString()}`}
            {special.start_date && special.end_date ? ' • ' : ''}
            {special.end_date && `Ends ${new Date(special.end_date).toLocaleDateString()}`}
          </Text>
        )}
      </View>

      {/* Products Grid */}
      {products.length > 0 ? (
        <View style={{ paddingHorizontal: semanticSpacing.screenPadding, paddingBottom: semanticSpacing.xl }}>
          {!store && (
            <View style={{ marginBottom: semanticSpacing.md, padding: semanticSpacing.md, backgroundColor: theme.colors.surface.primary, borderRadius: semanticRadius.card, borderWidth: 1, borderColor: theme.colors.border.subtle }}>
              <Text style={{ color: theme.colors.text.secondary, ...textStyle.caption, textAlign: 'center' }}>
                Select a delivery store to see accurate stock and add items to cart.
              </Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: semanticSpacing.md }}>
            <Text style={{ ...textStyle.h3, fontWeight: fontWeight.bold, color: theme.colors.text.primary }}>
              {products.length} {products.length === 1 ? 'Product' : 'Products'}
            </Text>
          </View>
          <FlatList
            data={products}
            keyExtractor={(p) => String(p.id)}
            numColumns={2}
            columnWrapperStyle={{ gap: semanticSpacing.inlineGap }}
            contentContainerStyle={{ gap: semanticSpacing.inlineGap, paddingBottom: semanticSpacing.xl }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <FadeSlideIn delay={index * 40} distance={16}>
                <ProductCard product={item} storeProductId={getStoreProductId(item)} />
              </FadeSlideIn>
            )}
          />
        </View>
      ) : (
        <View style={{ paddingHorizontal: semanticSpacing.screenPadding, paddingTop: semanticSpacing.xl }}>
          <EmptyState
            icon={Tag}
            title="No products in this sale"
            caption="Products will appear here when the sale is active."
          />
        </View>
      )}
    </ScrollView>
  );
}