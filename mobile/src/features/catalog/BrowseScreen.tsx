import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { PackageSearch, Search, SearchX } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
import { useCategories, useInfiniteProducts } from './hooks';
import { ProductGrid } from '../../components/shared/ProductGrid';
import { CollectionPill } from '../../components/shared/CollectionPill';
import { FadeEdgeScroll } from '../../components/shared/FadeEdgeScroll';
import { ProductSummaryModal, type SourceRect } from './ProductSummaryModal';
import { SkeletonCard } from '../../components/shared/SkeletonCard';
import { ProductCardSkeleton } from '../../components/shared/ProductCardSkeleton';
import { ScreenHeader } from '../../components/shared/ScreenHeader';
import { EmptyState } from '../../components/shared/EmptyState';
import { useDeliveryStore } from '../../stores/deliveryStore';
import type { ProductVO } from '../../lib/product';
import { findStoreAvailability } from '../../lib/product';
import { trackCategoryFilterTap } from '../../services/trackingService';

const SEARCH_DEBOUNCE_MS = 300;

export function BrowseScreen() {
  const theme = useTheme();
  const route = useRoute();
  const store = useDeliveryStore((s) => s.fulfillmentStore);
  const { data: categories = [] } = useCategories();
  const routeCategory = (route.params as { category?: string } | undefined)?.category;
  const [activeCategory, setActiveCategory] = useState<string | undefined>(routeCategory);
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  const [summaryState, setSummaryState] = useState<{ product: ProductVO; rect: SourceRect | null } | null>(null);

  useEffect(() => {
    if (routeCategory !== undefined) setActiveCategory(routeCategory);
  }, [routeCategory]);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [term]);

  const searching = debounced.trim().length >= 2;
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteProducts({
    category: activeCategory,
    search: searching ? debounced.trim() : undefined,
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

  // Helper to get effective storeProductId (fulfillment store only)
  const getStoreProductId = (product: ProductVO): number | null => {
    if (!store) return null;
    const avail = findStoreAvailability(product, store.id);
    return avail?.storeProductId ?? null;
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <ScreenHeader title="Browse" />

      {/* Sticky Search Bar */}
      <View
        style={{
          paddingHorizontal: semanticSpacing.screenPadding,
          paddingBottom: semanticSpacing.xs,
        }}
      >
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

      {/* Horizontal category filter — scrollable pills with soft edge fades */}
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

      {/* 2-col product grid with infinite scroll — the app's canonical grid */}
      {isLoading ? (
        <View style={{ flexDirection: 'row', gap: semanticSpacing.inlineGap, paddingHorizontal: semanticSpacing.screenPadding, marginTop: semanticSpacing.md }}>
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </View>
      ) : products.length === 0 ? (
        searching ? (
          <EmptyState
            icon={SearchX}
            title="No matches found."
            caption="Try a shorter search term, or clear it to browse everything."
          />
        ) : (
          <EmptyState
            icon={PackageSearch}
            title="No products here yet."
            caption="This shelf is empty for now — try another category."
          />
        )
      ) : (
        <ProductGrid
          data={products}
          getStoreProductId={getStoreProductId}
          onRequestSummary={handleRequestSummary}
          source="feed"
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ padding: semanticSpacing.md, alignItems: 'center' }}>
                <SkeletonCard width={120} height={16} orientation="carousel" />
              </View>
            ) : null
          }
        />
      )}

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
