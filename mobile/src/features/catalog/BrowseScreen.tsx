import { useState, useEffect } from 'react';
import { View, Text, FlatList } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { textStyle } from '../../theme/typography';
import { semanticSpacing } from '../../theme/spacing';
import { useCategories, useInfiniteProducts } from './hooks';
import { ProductCard } from '../../components/shared/ProductCard';
import { CollectionPill } from '../../components/shared/CollectionPill';
import { FadeEdgeScroll } from '../../components/shared/FadeEdgeScroll';
import { ProductSummaryModal, type SourceRect } from './ProductSummaryModal';
import { SkeletonCard } from '../../components/shared/SkeletonCard';
import { ProductCardSkeleton } from '../../components/shared/ProductCardSkeleton';
import { CrashCascadeIn } from '../../components/shared/CrashCascadeIn';
import { useDeliveryStore } from '../../stores/deliveryStore';
import type { ProductVO, StoreAvailabilityVO } from '../../lib/product';
import { findStoreAvailability } from '../../lib/product';
import { trackCategoryFilterTap } from '../../services/trackingService';

export function BrowseScreen() {
  const theme = useTheme();
  const route = useRoute();
  const store = useDeliveryStore((s) => s.fulfillmentStore);
  const { data: categories = [] } = useCategories();
  const routeCategory = (route.params as { category?: string } | undefined)?.category;
  const [activeCategory, setActiveCategory] = useState<string | undefined>(routeCategory);
  const [summaryState, setSummaryState] = useState<{ product: ProductVO; rect: SourceRect | null } | null>(null);

  useEffect(() => {
    if (routeCategory !== undefined) setActiveCategory(routeCategory);
  }, [routeCategory]);
  const { 
    data, 
    isLoading, 
    isFetchingNextPage, 
    hasNextPage, 
    fetchNextPage 
  } = useInfiniteProducts({ category: activeCategory, storeId: store?.id ?? null });

  // Flatten all pages into a single array
  const products = data?.pages.flatMap((page) => page.products) ?? [];

  const handleRequestSummary = (product: ProductVO, rect: SourceRect | null) => {
    setSummaryState({ product, rect });
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // Helper to get effective storeProductId for a product (fulfillment store only)
  const getStoreProductId = (product: ProductVO): number | null => {
    if (!store) return null;
    const avail = findStoreAvailability(product, store.id);
    return avail?.storeProductId ?? null;
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <Text style={{ paddingTop: 56, paddingHorizontal: semanticSpacing.screenPadding, ...textStyle.h1, color: theme.colors.text.primary }}>
        Browse
      </Text>

      {/* Horizontal category filter — GreenBidder pattern: scrollable pills with fade edge, no desktop sidebar leak */}
      <View style={{ marginTop: semanticSpacing.xs }}>
        <FadeEdgeScroll
          fadeWidth={24}
          contentPaddingLeft={semanticSpacing.screenPadding}
          contentPaddingRight={semanticSpacing.screenPadding}
          backgroundColor={theme.colors.background.primary}
        >
          {[{ id: 0, name: 'All', slug: '' }, ...categories].map((cat) => {
            const active = cat.id === 0 ? activeCategory == null : activeCategory === cat.slug;
            return (
              <CollectionPill
                key={String(cat.id)}
                label={cat.name}
                active={active}
                onPress={() => {
                  const catSlug = cat.id === 0 ? undefined : cat.slug;
                  setActiveCategory(catSlug);
                  if (cat.id !== 0) {
                    trackCategoryFilterTap(cat.id, cat.name, products.length);
                  }
                }}
              />
            );
          })}
        </FadeEdgeScroll>
      </View>

      {/* Full-width 2-col product grid with infinite scroll */}
      <FlatList
        style={{ flex: 1, marginTop: semanticSpacing.sm }}
        data={isLoading ? [] : products}
        keyExtractor={(p) => String(p.id)}
        numColumns={2}
        columnWrapperStyle={{ gap: semanticSpacing.inlineGap, paddingHorizontal: semanticSpacing.md }}
        contentContainerStyle={{ gap: semanticSpacing.inlineGap, paddingVertical: semanticSpacing.xs, paddingBottom: semanticSpacing.xl }}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ flexDirection: 'row', gap: semanticSpacing.inlineGap, paddingHorizontal: semanticSpacing.md }}>
              <ProductCardSkeleton />
              <ProductCardSkeleton />
            </View>
          ) : (
            <Text style={{ color: theme.colors.text.secondary, padding: semanticSpacing.md }}>No products here yet.</Text>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={{ padding: semanticSpacing.md, alignItems: 'center' }}>
              <SkeletonCard width={120} height={16} orientation="carousel" />
            </View>
          ) : null
        }
        renderItem={({ item, index }) => (
            <CrashCascadeIn index={index}>
              <ProductCard product={item} storeProductId={getStoreProductId(item)} onRequestSummary={handleRequestSummary} source="feed" />
            </CrashCascadeIn>
          )}
      />

      {summaryState != null && (
        <ProductSummaryModal 
          product={summaryState.product} 
          storeProductId={getStoreProductId(summaryState.product)}
          sourceRect={summaryState.rect} 
          onClose={() => setSummaryState(null)} 
        />
      )}
    </View>
  );
}