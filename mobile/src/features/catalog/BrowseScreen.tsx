import { useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { textStyle, fontWeight } from '../../theme/typography';
import { semanticSpacing } from '../../theme/spacing';
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
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <Text style={{ paddingTop: 56, paddingHorizontal: semanticSpacing.screenPadding, ...textStyle.h1, color: theme.colors.text.primary }}>
        Browse
      </Text>
      <View style={{ flexDirection: 'row', flex: 1 }}>
        {/* Category rail */}
        <FlatList
          data={[{ id: 0, name: 'All', slug: '' }, ...categories]}
          keyExtractor={(c) => String(c.id)}
          style={{ width: 96, backgroundColor: theme.colors.background.secondary }}
          contentContainerStyle={{ paddingTop: semanticSpacing.xs }}
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
                  backgroundColor: active ? theme.colors.surface.primary : 'transparent',
                  borderLeftWidth: 3,
                  borderLeftColor: active ? brand.orange : 'transparent',
                }}
              >
                <Text
                  numberOfLines={2}
                  style={{
                    ...textStyle.caption,
                    fontWeight: active ? fontWeight.bold : fontWeight.medium,
                    color: active ? brand.orange : theme.colors.text.secondary,
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
          columnWrapperStyle={{ gap: semanticSpacing.inlineGap, paddingHorizontal: semanticSpacing.md }}
          contentContainerStyle={{ gap: semanticSpacing.inlineGap, paddingVertical: semanticSpacing.xs }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            isLoading ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: semanticSpacing.inlineGap }}>
                <SkeletonCard />
                <SkeletonCard />
              </View>
            ) : (
              <Text style={{ color: theme.colors.text.secondary, padding: semanticSpacing.md }}>No products here yet.</Text>
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