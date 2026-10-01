import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Search, SearchX, History, ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { fontWeight, textStyle } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
import { useInfiniteProducts } from '../catalog/hooks';
import { useDeliveryStore } from '../../stores/deliveryStore';
import { ProductGrid } from '../../components/shared/ProductGrid';
import { CollectionPill } from '../../components/shared/CollectionPill';
import { EmptyState } from '../../components/shared/EmptyState';
import { SkeletonCard } from '../../components/shared/SkeletonCard';
import { ProductCardSkeleton } from '../../components/shared/ProductCardSkeleton';
import { FadeSlideIn } from '../../components/shared/FadeSlideIn';
import { CrashCascadeIn } from '../../components/shared/CrashCascadeIn';
import { FadeEdgeScroll } from '../../components/shared/FadeEdgeScroll';
import { useCategories } from '../catalog/hooks';
import { storage, STORAGE_KEYS } from '../../lib/storage';
import { SEARCH_DEBOUNCE_MS } from '../../lib/constants';
import type { ProductVO } from '../../lib/product';
import { findStoreAvailability } from '../../lib/product';
import { trackSearch, trackCategoryFilterTap } from '../../services/trackingService';
import { useTopSafeArea } from '../../components/shared/ScreenHeader';
import { haptic } from '../../lib/haptics';

export function SearchScreen() {
  const theme = useTheme();
  const topInset = useTopSafeArea();
  const navigation = useNavigation();
  const store = useDeliveryStore((s) => s.fulfillmentStore);
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const { data: categories = [] } = useCategories();

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [term]);

  useEffect(() => {
    storage.get<string[]>(STORAGE_KEYS.recentSearches).then((r) => setRecent(r ?? []));
  }, []);

  const searching = debounced.length >= 2;
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteProducts({
    search: searching ? debounced : undefined,
    storeId: store?.id ?? null,
    enabled: searching,
  });

  const results = data?.pages.flatMap((page) => page.products) ?? [];

  useEffect(() => {
    if (searching && !isLoading) trackSearch(debounced, undefined, results.length);
  }, [debounced, searching, isLoading, results.length]);

  const recordSearch = () => {
    if (debounced.length < 2) return;
    setRecent((current) => {
      const next = [debounced, ...current.filter((s) => s !== debounced)].slice(0, 5);
      void storage.set(STORAGE_KEYS.recentSearches, next);
      return next;
    });
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  const getStoreProductId = (product: ProductVO): number | null => {
    if (!store) return null;
    return findStoreAvailability(product, store.id)?.storeProductId ?? null;
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <FadeSlideIn delay={60} distance={10}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingTop: topInset,
            paddingBottom: 12,
            gap: 10,
            backgroundColor: theme.colors.background.primary,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border.subtle,
          }}
        >
          <Pressable
            onPress={() => {
              haptic.selection();
              navigation.goBack();
            }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: theme.colors.surface.elevated,
              borderWidth: 1,
              borderColor: theme.colors.border.subtle,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ChevronLeft size={18} color={theme.colors.text.primary} strokeWidth={2.2} />
          </Pressable>

          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              backgroundColor: theme.colors.surface.primary,
              borderRadius: 999,
              paddingHorizontal: 16,
              height: 44,
              borderWidth: 1,
              borderColor: theme.colors.border.subtle,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 4,
              elevation: 1,
            }}
          >
            <Search size={16} color={theme.colors.text.tertiary} strokeWidth={2} />
            <TextInput
              autoFocus
              value={term}
              onChangeText={setTerm}
              placeholder="Search for products"
              placeholderTextColor={theme.colors.text.tertiary}
              accessibilityLabel="Search for products"
              style={{ flex: 1, color: theme.colors.text.primary, fontSize: 13, letterSpacing: -0.1 }}
            />
            {term.length > 0 ? (
              <Pressable
                onPress={() => {
                  haptic.selection();
                  setTerm('');
                  setDebounced('');
                }}
                style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: theme.colors.surface.elevated, alignItems: 'center', justifyContent: 'center' }}
              >
                <SearchX size={14} color={theme.colors.text.tertiary} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </FadeSlideIn>

      {!searching ? (
        <View style={{ padding: 16, gap: 20 }}>
          {recent.length > 0 && (
            <FadeSlideIn delay={100} distance={10}>
              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <History size={12} color={theme.colors.text.tertiary} />
                  <Text style={{ fontSize: 10, color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '600' }}>Recent searches</Text>
                </View>
                {recent.map((r, idx) => (
                  <CrashCascadeIn key={r} index={idx}>
                    <Pressable
                      onPress={() => {
                        haptic.selection();
                        setTerm(r);
                      }}
                      accessibilityRole="button"
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: theme.colors.surface.primary, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border.subtle }}
                    >
                      <Search size={12} color={theme.colors.text.tertiary} />
                      <Text style={{ color: theme.colors.text.primary, fontSize: 13, letterSpacing: -0.1 }}>{r}</Text>
                    </Pressable>
                  </CrashCascadeIn>
                ))}
              </View>
            </FadeSlideIn>
          )}

          <FadeSlideIn delay={140} distance={10}>
            <View style={{ gap: 10 }}>
              <Text style={{ fontSize: 10, color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '600' }}>Browse categories</Text>
              <FadeEdgeScroll fadeWidth={24} contentPaddingLeft={0} contentPaddingRight={16} backgroundColor={theme.colors.background.primary}>
                {categories.map((c, idx) => (
                  <FadeSlideIn key={c.id} delay={160 + idx * 20} distance={8}>
                    <CollectionPill label={c.name} onPress={() => { trackCategoryFilterTap(c.id, c.name, 0); setTerm(c.name); haptic.selection(); }} />
                  </FadeSlideIn>
                ))}
              </FadeEdgeScroll>
            </View>
          </FadeSlideIn>
        </View>
      ) : isLoading ? (
        <View style={{ paddingHorizontal: semanticSpacing.screenPadding, gap: semanticSpacing.sm, marginTop: 12 }}>
          <View style={{ flexDirection: 'row', gap: semanticSpacing.sm }}>
            <ProductCardSkeleton index={0} />
            <ProductCardSkeleton index={1} />
          </View>
          <View style={{ flexDirection: 'row', gap: semanticSpacing.sm }}>
            <ProductCardSkeleton index={2} />
            <ProductCardSkeleton index={3} />
          </View>
        </View>
      ) : results.length === 0 ? (
        <FadeSlideIn delay={100} distance={12} style={{ flex: 1 }}>
          <EmptyState icon={SearchX} title={`No matches for "${debounced}"`} caption="Try a different search — check spelling or browse categories." />
        </FadeSlideIn>
      ) : (
        <ProductGrid
          data={results}
          getStoreProductId={getStoreProductId}
          source="search"
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={
            <FadeSlideIn delay={80} distance={8}>
              <Pressable onPress={() => { haptic.selection(); recordSearch(); }} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: semanticSpacing.screenPadding, paddingBottom: semanticSpacing.xs }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: brand.orange }} />
                <Text style={{ color: brand.orange, fontSize: 11, fontWeight: '600', letterSpacing: 0.2 }}>{results.length} results · save search</Text>
              </Pressable>
            </FadeSlideIn>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <FadeSlideIn delay={0} distance={6}>
                <View style={{ padding: semanticSpacing.md, alignItems: 'center' }}>
                  <SkeletonCard width={120} height={16} orientation="carousel" />
                </View>
              </FadeSlideIn>
            ) : null
          }
        />
      )}
    </View>
  );
}
