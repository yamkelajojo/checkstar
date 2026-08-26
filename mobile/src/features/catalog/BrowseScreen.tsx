import { useState, useEffect } from 'react';
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
  const { data: categories = [], isLoading: catLoading, error: catError } = useCategories();
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const [summaryState, setSummaryState] = useState<{ product: ProductVO; rect: SourceRect | null } | null>(null);
  const { data: products = [], isLoading, error, refetch, isFetching } = useProducts({ category: activeCategory, storeId: store?.id ?? null }) as any;
  const [debugUrl, setDebugUrl] = useState<string>('loading...');
  useEffect(() => {
    import('../../lib/apiClient').then(m => m.getApiBaseUrl().then(setDebugUrl).catch(e => setDebugUrl(String(e))));
  }, []);

  const handleRequestSummary = (product: ProductVO, rect: SourceRect | null) => {
    setSummaryState({ product, rect });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <Text style={{ paddingTop: 56, paddingHorizontal: semanticSpacing.screenPadding, ...textStyle.h1, color: theme.colors.text.primary }}>
        Browse
      </Text>
      {/* DEBUG banner - remove after fix */}
      <View style={{ backgroundColor: '#fff3cd', paddingHorizontal: 12, paddingVertical: 6, marginHorizontal: 12, borderRadius: 6, marginBottom: 8 }}>
        <Text style={{ fontSize: 10, color: '#664d03' }} selectable>API: {debugUrl}</Text>
        <Text style={{ fontSize: 10, color: '#664d03' }} selectable>cat:{catLoading ? 'loading' : categories.length} prod:{isLoading ? 'loading' : products.length}{isFetching ? ' (fetching)' : ''}</Text>
        {catError ? <Text style={{ fontSize: 10, color: '#842029' }} selectable>cat err: {String((catError as Error).message).slice(0,120)}</Text> : null}
        {error ? <Text style={{ fontSize: 10, color: '#842029' }} selectable>prod err: {String((error as Error).message).slice(0,180)} — {String((error as any)?.payload ?? '').slice(0,120)}</Text> : null}
        <Pressable onPress={() => refetch()} style={{ marginTop: 4, backgroundColor: '#664d03', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, alignSelf: 'flex-start' }}>
          <Text style={{ color: 'white', fontSize: 11 }}>Retry</Text>
        </Pressable>
      </View>
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