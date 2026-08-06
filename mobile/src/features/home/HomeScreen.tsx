import { View, Text, FlatList, ScrollView } from 'react-native';
import { Search, MapPin, Store } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { typeScale, weights } from '../../theme/typography';
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
  const subtotal = useCart((s) => cartSubtotal(s.items, products));
  const storeName = store?.name ?? 'Choose your store';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header: delivery Store + search entry */}
      <View style={{ paddingHorizontal: 16, paddingTop: 56, gap: 12 }}>
        <FadeSlideIn>
          <TactilePressable
            onPress={() => navigation.navigate('Search')}
            hapticOnPress="selection"
            accessibilityRole="button"
            accessibilityLabel="Search for products"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: theme.colors.surface,
              borderRadius: 999,
              paddingHorizontal: 16,
              height: 44,
            }}
          >
            <Search size={18} color={theme.colors.textMuted} />
            <Text style={{ color: theme.colors.textMuted, fontSize: typeScale.body }}>Search for products</Text>
          </TactilePressable>
        </FadeSlideIn>

        <TactilePressable
          onPress={() => navigation.navigate('StorePicker')}
          hapticOnPress="selection"
          accessibilityRole="button"
          accessibilityLabel="Choose delivery store"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <MapPin size={16} color={brand.primary} />
          <Text style={{ fontWeight: weights.semibold, color: theme.colors.text, fontSize: typeScale.body }}>
            {storeName}
          </Text>
        </TactilePressable>
        {subtotal < FREE_DELIVERY_THRESHOLD_CENTS && subtotal > 0 && (
          <Text style={{ color: theme.colors.textMuted, fontSize: typeScale.caption }}>
            Free delivery over R {FREE_DELIVERY_THRESHOLD_CENTS / 100},00 — add more to qualify.
          </Text>
        )}
      </View>

      {/* Specials carousel */}
      <View style={{ marginTop: 16 }}>
        <SectionTitle title="Best Deals" icon={<Tag size={16} color={brand.primary} />} />
        {specials.length > 0 ? (
          <FlatList
            horizontal
            data={specials}
            keyExtractor={(p) => String(p.id)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            renderItem={({ item }) => <ProductCard product={item} />}
          />
        ) : (
          <Text style={{ color: theme.colors.textMuted, paddingHorizontal: 16 }}>No Specials right now — new deals land every week.</Text>
        )}
      </View>

      {/* Categories */}
      <View style={{ marginTop: 20 }}>
        <SectionTitle title="Shop by category" icon={<Store size={16} color={brand.primary} />} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
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
      <View style={{ marginTop: 20, paddingHorizontal: 16 }}>
        <SectionTitle title="Featured" icon={null} />
        {isLoading ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : products.length === 0 ? (
          <EmptyState icon={Tag} title="No featured products yet" caption="Check back soon." />
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
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
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginBottom: 12 }}>
      {icon}
      <Text style={{ fontSize: typeScale.heading, fontWeight: weights.bold, color: theme.colors.text }}>{title}</Text>
    </View>
  );
}

function cartSubtotal(items: { productId: string; quantity: number }[], products: { id: number; effectivePriceCents: number }[]): number {
  const priceOf = (id: string) => products.find((p) => p.id === Number(id))?.effectivePriceCents ?? 0;
  return items.reduce((sum, i) => sum + priceOf(i.productId) * i.quantity, 0);
}