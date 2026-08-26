import { View, Text, FlatList, ScrollView } from 'react-native';
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
import { SkeletonCard } from '../../components/shared/SkeletonCard';
import { FadeSlideIn } from '../../components/shared/FadeSlideIn';
import { useDeliveryStore } from '../../stores/deliveryStore';
import { useCart } from '../cart/store';
import { EmptyState } from '../../components/shared/EmptyState';
import { Tag } from 'lucide-react-native';
import type { RootStackParamList } from '../../navigation/types';

const FREE_DELIVERY_THRESHOLD_CENTS = 35000;

export function HomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const store = useDeliveryStore((s) => s.store);
  const { data: categories = [] } = useCategories();
  const { data: products = [], isLoading } = useProducts({ storeId: store?.id ?? null, featured: true });
  const { data: specials = [] } = useSpecials(store?.id ?? null);
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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
      contentContainerStyle={{ paddingBottom: semanticSpacing.xl }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header: delivery Store + search entry */}
      <View style={{ paddingHorizontal: semanticSpacing.screenPadding, paddingTop: 56, gap: semanticSpacing.inlineGap }}>
        <FadeSlideIn>
          <TactilePressable
            onPress={() => navigation.navigate('Search')}
            haptic="selection"
            accessibilityRole="button"
            accessibilityLabel="Search for products"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: semanticSpacing.inlineGap,
              backgroundColor: theme.colors.surface.primary,
              borderRadius: semanticRadius.buttonPill,
              paddingHorizontal: semanticSpacing.md,
              height: 44,
            }}
          >
            <Search size={18} color={theme.colors.text.secondary} />
            <Text style={{ color: theme.colors.text.secondary, ...textStyle.body }}>Search for products</Text>
          </TactilePressable>
        </FadeSlideIn>

        <TactilePressable
          onPress={() => navigation.navigate('StorePicker')}
          haptic="selection"
          accessibilityRole="button"
          accessibilityLabel="Choose delivery store"
          style={{ flexDirection: 'row', alignItems: 'center', gap: semanticSpacing.xxs }}
        >
          <MapPin size={16} color={brand.orange} />
          <Text style={{ fontWeight: fontWeight.semibold, color: theme.colors.text.primary, ...textStyle.body }}>
            {storeName}
          </Text>
        </TactilePressable>
        {subtotal < FREE_DELIVERY_THRESHOLD_CENTS && subtotal > 0 && (
          <Text style={{ color: theme.colors.text.secondary, ...textStyle.caption }}>
            Free delivery over R {FREE_DELIVERY_THRESHOLD_CENTS / 100},00 — add more to qualify.
          </Text>
        )}
      </View>

      {/* Specials carousel */}
      <View style={{ marginTop: semanticSpacing.lg }}>
        <SectionTitle title="Best Deals" icon={<Tag size={16} color={brand.orange} />} />
        {specials.length > 0 ? (
          <FlatList
            horizontal
            data={specials}
            keyExtractor={(p) => String(p.id)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: semanticSpacing.screenPadding, gap: semanticSpacing.inlineGap }}
            renderItem={({ item }) => <ProductCard product={item} />}
          />
        ) : (
          <Text style={{ color: theme.colors.text.secondary, paddingHorizontal: semanticSpacing.screenPadding }}>No Specials right now — new deals land every week.</Text>
        )}
      </View>

      {/* Categories */}
      <View style={{ marginTop: semanticSpacing.xl }}>
        <SectionTitle title="Shop by category" icon={<Store size={16} color={brand.orange} />} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: semanticSpacing.screenPadding, gap: semanticSpacing.inlineGap }}>
          {categories.map((c) => (
            <CollectionPill
              key={c.id}
              label={c.name}
              onPress={() => navigation.navigate('Tabs')}
            />
          ))}
        </ScrollView>
      </View>

      {/* Featured grid */}
      <View style={{ marginTop: semanticSpacing.xl, paddingHorizontal: semanticSpacing.screenPadding }}>
        <SectionTitle title="Featured" icon={null} />
        {isLoading ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: semanticSpacing.inlineGap }}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : products.length === 0 ? (
          <EmptyState icon={Tag} title="No featured products yet" caption="Check back soon." />
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: semanticSpacing.inlineGap }}>
            {products.map((p) => (
              <ProductCard key={p.id} product={p} style={{ width: '47%' }} />
            ))}
          </View>
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