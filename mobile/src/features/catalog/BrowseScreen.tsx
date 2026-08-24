import { useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { typeScale, weights } from '../../theme/typography';
import { useCategories, useProducts } from './hooks';
import { ProductCard } from '../../components/shared/ProductCard';
import { ProductSummaryModal, type SourceRect } from './ProductSummaryModal';
import { SkeletonCard } from '../../components/shared/SkeletonCard';
import { useDeliveryStore } from '../../stores/deliveryStore';
import type { ProductVO } from '../../lib/product';

export function BrowseScreen() {
  const theme = useTheme();
  const store = useDeliveryStore((s) => s.store);
  const { data: categories = [] } = useCategories();
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const [summaryState, setSummaryState] = useState<{ product: ProductVO; rect: SourceRect | null } | null>(null);
  const { data: products = [], isLoading } = useProducts({ category: activeCategory, storeId: store?.id ?? null });

  const handleRequestSummary = (product: ProductVO, rect: SourceRect | null) => {
    setSummaryState({ product, rect });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <Text style={{ paddingTop: 56, paddingHorizontal: 16, fontSize: typeScale.title, fontWeight: weights.extrabold, color: theme.colors.text }}>
        Browse
      </Text>
      <View style={{ flexDirection: 'row', flex: 1 }}>
        {/* Category rail */}
        <FlatList
          data={[{ id: 0, name: 'All', slug: '' }, ...categories]}
          keyExtractor={(c) => String(c.id)}
          style={{ width: 96, backgroundColor: theme.colors.bgAlt }}
          contentContainerStyle={{ paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const active = item.id === 0 ? activeCategory == null : activeCategory === item.slug;
            return (
              <Pressable
                onPress={() => setActiveCategory(item.id === 0 ? undefined : item.slug)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={{
                  paddingVertical: 14,
                  paddingHorizontal: 10,
                  backgroundColor: active ? theme.colors.surface : 'transparent',
                  borderLeftWidth: 3,
                  borderLeftColor: active ? brand.primary : 'transparent',
                }}
              >
                <Text
                  numberOfLines={2}
                  style={{
                    fontSize: typeScale.caption,
                    fontWeight: active ? weights.bold : weights.medium,
                    color: active ? brand.primary : theme.colors.textMuted,
                  }}
                >
                  {item.name}
                </Text>
              </Pressable>
            );
          }}
        />
        {/* Product list */}
        <FlatList
          style={{ flex: 1 }}
          data={isLoading ? [] : products}
          keyExtractor={(p) => String(p.id)}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 12 }}
          contentContainerStyle={{ gap: 12, paddingVertical: 8 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            isLoading ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                <SkeletonCard />
                <SkeletonCard />
              </View>
            ) : (
              <Text style={{ color: theme.colors.textMuted, padding: 16 }}>No products here yet.</Text>
            )
          }
          renderItem={({ item }) => <ProductCard product={item} onRequestSummary={handleRequestSummary} />}
        />
      </View>

      {summaryState != null && (
        <ProductSummaryModal product={summaryState.product} sourceRect={summaryState.rect} onClose={() => setSummaryState(null)} />
      )}
    </View>
  );
}