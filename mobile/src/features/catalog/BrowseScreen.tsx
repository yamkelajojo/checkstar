import { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable } from 'react-native';
import { Search, SearchX } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { textStyle } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
import { useCategories, useInfiniteProducts } from './hooks';
import { ProductCard } from '../../components/shared/ProductCard';
import { CollectionPill } from '../../components/shared/CollectionPill';
import { FadeEdgeScroll } from '../../components/shared/FadeEdgeScroll';
import { ProductSummaryModal, type SourceRect } from './ProductSummaryModal';
import { SkeletonCard } from '../../components/shared/SkeletonCard';
import { ProductCardSkeleton } from '../../components/shared/ProductCardSkeleton';
import { FadeSlideIn } from '../../components/shared/FadeSlideIn';
import { useDeliveryStore } from '../../stores/deliveryStore';
import type { ProductVO, StoreAvailabilityVO } from '../../lib/product';
import { findStoreAvailability } from '../../lib/product';

const SEARCH_DEBOUNCE_MS = 300;

export function BrowseScreen() {
  const theme = useTheme();
  const store = useDeliveryStore((s) => s.fulfillmentStore);
  const { data: categories = [] } = useCategories();
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  const [summaryState, setSummaryState] = useState<{ product: ProductVO; rect: SourceRect | null } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [term]);

  const searching = debounced.length >= 2;
  const { 
    data, 
    isLoading, 
    isFetchingNextPage, 
    hasNextPage, 
    fetchNextPage 
  } = useInfiniteProducts({ 
    category: activeCategory, 
    search: searching ? debounced : undefined,
    storeId: store?.id ?? null,
    enabled: true,
  });

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
      {/* Sticky Search Bar */}
      <View style={{ paddingTop: 56, paddingHorizontal: semanticSpacing.screenPadding, paddingBottom: semanticSpacing.xs }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: semanticSpacing.inlineGap,
            backgroundColor: theme.colors.surface.primary,
            borderRadius: semanticRadius.buttonPill,
            paddingHorizontal: semanticSpacing.md,
            height: 44,
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
          }}
        >
          <Search size={18} color={theme.colors.text.tertiary} strokeWidth={2} />
          <TextInput
            autoFocus={false}
            value={term}
            onChangeText={setTerm}
            placeholder="Search products..."
            placeholderTextColor={theme.colors.text.tertiary}
            accessibilityLabel="Search products"
            style={{ flex: 1, color: theme.colors.text.primary, fontSize: 14 }}
          />
          {term.length > 0 && (
            <Pressable
              onPress={() => setTerm('')}
              accessibilityLabel="Clear search"
              style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}
            >
              <SearchX size={16} color={theme.colors.text.tertiary} />
            </Pressable>
          )}
        </View>
      </View>

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
                onPress={() => setActiveCategory(cat.id === 0 ? undefined : cat.slug)}
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
            <FadeSlideIn delay={index * 40} distance={16}>
              <ProductCard product={item} storeProductId={getStoreProductId(item)} onRequestSummary={handleRequestSummary} />
            </FadeSlideIn>
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