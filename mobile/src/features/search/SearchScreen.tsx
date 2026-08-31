import { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable } from 'react-native';
import { Search, SearchX, History, ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { fontWeight, textStyle, fontFamily } from '../../theme/typography';
import { useInfiniteProducts } from '../catalog/hooks';
import { useDeliveryStore } from '../../stores/deliveryStore';
import { ProductCard } from '../../components/shared/ProductCard';
import { CollectionPill } from '../../components/shared/CollectionPill';
import { EmptyState } from '../../components/shared/EmptyState';
import { SkeletonCard } from '../../components/shared/SkeletonCard';
import { ProductCardSkeleton } from '../../components/shared/ProductCardSkeleton';
import { FadeSlideIn } from '../../components/shared/FadeSlideIn';
import { FadeEdgeScroll } from '../../components/shared/FadeEdgeScroll';
import { useCategories } from '../catalog/hooks';
import { storage, STORAGE_KEYS } from '../../lib/storage';
import { semanticSpacing } from '../../theme/spacing';
import type { ProductVO, StoreAvailabilityVO } from '../../lib/product';
import { findStoreAvailability } from '../../lib/product';

const DEBOUNCE_MS = 400;

export function SearchScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const store = useDeliveryStore((s) => s.fulfillmentStore);
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const { data: categories = [] } = useCategories();

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [term]);

  useEffect(() => {
    storage.get<string[]>(STORAGE_KEYS.recentSearches).then((r) => setRecent(r ?? []));
  }, []);

  const searching = debounced.length >= 2;
  const { 
    data, 
    isLoading, 
    isFetchingNextPage, 
    hasNextPage, 
    fetchNextPage 
  } = useInfiniteProducts({
    search: searching ? debounced : undefined,
    storeId: store?.id ?? null,
    enabled: searching,
  });

  // Flatten all pages into a single array
  const results = data?.pages.flatMap((page) => page.products) ?? [];

  const recordSearch = () => {
    if (debounced.length < 2) return;
    setRecent((current) => {
      const next = [debounced, ...current.filter((s) => s !== debounced)].slice(0, 5);
      void storage.set(STORAGE_KEYS.recentSearches, next);
      return next;
    });
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  // Helper to get effective storeProductId for a product (fulfillment store only)
  const getStoreProductId = (product: ProductVO): number | null => {
    if (!store) return null;
    const avail = findStoreAvailability(product, store.id);
    return avail?.storeProductId ?? null;
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      {/* Header with back button and search input - like GreenBidder */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 16, 
        paddingTop: 56,
        paddingBottom: 12,
        gap: 10,
        backgroundColor: theme.colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.subtle,
      }}>
        <Pressable onPress={handleBack} accessibilityRole="button" hitSlop={12}>
          <ChevronLeft size={24} color={theme.colors.text.primary} />
        </Pressable>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.colors.surface.primary, borderRadius: 999, paddingHorizontal: 14, height: 44 }}>
          <Search size={18} color={theme.colors.text.tertiary} />
          <TextInput
            autoFocus
            value={term}
            onChangeText={setTerm}
            placeholder="Search for products"
            placeholderTextColor={theme.colors.text.disabled}
            style={{ flex: 1, color: theme.colors.text.primary, fontSize: textStyle.body.size, fontFamily: fontFamily.primary }}
            accessibilityLabel="Search for products"
          />
          {term.length > 0 ? (
            <Pressable
              onPress={() => {
                setTerm('');
                setDebounced('');
              }}
              style={styles.clearButton}
            >
              <SearchX size={18} color={theme.colors.text.tertiary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {!searching ? (
        <View style={{ padding: 16, gap: 16 }}>
          {recent.length > 0 && (
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: textStyle.caption.size, color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: 1, fontFamily: fontFamily.primary }}>
                Recent searches
              </Text>
              {recent.map((r) => (
                <Pressable key={r} onPress={() => setTerm(r)} accessibilityRole="button">
                  <Text style={{ color: theme.colors.text.primary, fontSize: textStyle.body.size, fontFamily: fontFamily.primary }}>{r}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: textStyle.caption.size, color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: 1, fontFamily: fontFamily.primary }}>
              Browse categories
            </Text>
            <FadeEdgeScroll
              fadeWidth={24}
              contentPaddingLeft={16}
              contentPaddingRight={16}
              backgroundColor={theme.colors.background.primary}
            >
              {categories.map((c) => (
                <CollectionPill key={c.id} label={c.name} onPress={() => setTerm(c.name)} />
              ))}
            </FadeEdgeScroll>
          </View>
        </View>
      ) : isLoading ? (
        <View style={{ paddingHorizontal: semanticSpacing.md, gap: semanticSpacing.inlineGap }}>
          <View style={{ flexDirection: 'row', gap: semanticSpacing.inlineGap }}>
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </View>
          <View style={{ flexDirection: 'row', gap: semanticSpacing.inlineGap }}>
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </View>
        </View>
      ) : results.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={`No matches for "${debounced}"`}
          caption="Try a different search."
        />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(p) => String(p.id)}
          numColumns={2}
          columnWrapperStyle={{ gap: semanticSpacing.inlineGap, paddingHorizontal: semanticSpacing.md }}
          contentContainerStyle={{ gap: semanticSpacing.inlineGap, paddingVertical: semanticSpacing.md }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          renderItem={({ item, index }) => (
            <FadeSlideIn delay={index * 40} distance={16}>
              <ProductCard product={item} storeProductId={getStoreProductId(item)} />
            </FadeSlideIn>
          )}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ padding: semanticSpacing.md, alignItems: 'center' }}>
                <SkeletonCard width={120} height={16} orientation="carousel" />
              </View>
            ) : null
          }
          ListHeaderComponent={
            <Pressable onPress={recordSearch} accessibilityRole="button">
              <Text style={{ paddingHorizontal: semanticSpacing.md, paddingBottom: semanticSpacing.xs, color: brand.orange, fontSize: textStyle.caption.size, fontWeight: fontWeight.semibold, fontFamily: fontFamily.primary }}>
                {results.length} results · save search
              </Text>
            </Pressable>
          }
        />
      )}
    </View>
  );
}

const styles = {
  clearButton: {
    width: 24,
    height: 24,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
};
