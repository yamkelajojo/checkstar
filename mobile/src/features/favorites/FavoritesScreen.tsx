import { View, Text, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Heart, WifiOff, RefreshCw } from 'lucide-react-native';
import { queryKeys } from '../../lib/queryKeys';
import { fetchFavorites } from '../../lib/apiClient';
import { ProductCard } from '../../components/shared/ProductCard';
import { ProductCardSkeleton } from '../../components/shared/ProductCardSkeleton';
import { EmptyState } from '../../components/shared/EmptyState';
import { ScreenHeader } from '../../components/shared/ScreenHeader';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { textStyle, fontWeight } from '../../theme/typography';
import { semanticSpacing } from '../../theme/spacing';
import { semanticRadius } from '../../theme/spacing';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { useDeliveryStore } from '../../stores/deliveryStore';
import { findStoreAvailability } from '../../lib/product';
import type { ProductVO } from '../../lib/product';

/**
 * Saved products. Shares the exact header, grid gutter and card spec as
 * Browse/Cart (ScreenHeader + 2-col grid, inlineGap gutters, screenPadding
 * edges) so every catalogue surface reads as one design system.
 */
export function FavoritesScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const store = useDeliveryStore((s) => s.fulfillmentStore);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.favorites,
    queryFn: () => fetchFavorites(),
  });

  const items = data?.data ?? data ?? [];

  const storeProductIdOf = (product: ProductVO): number | null => {
    if (!store) return null;
    return findStoreAvailability(product, store.id)?.storeProductId ?? null;
  };

  if (isError) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <ScreenHeader title="Favorites" />
        <EmptyState
          icon={WifiOff}
          title="Couldn't load your favorites"
          caption="Check your connection and try again."
          action={
            <TactilePressable
              onPress={() => refetch()}
              haptic="tap"
              accessibilityRole="button"
              accessibilityLabel="Retry loading favorites"
              style={[styles.retryButton, { backgroundColor: theme.colors.surface.primary, borderColor: theme.colors.border.subtle }]}
            >
              <RefreshCw size={16} color={theme.colors.text.secondary} />
              <Text style={{ color: theme.colors.text.secondary, fontWeight: fontWeight.semibold, ...textStyle.caption }}>Retry</Text>
            </TactilePressable>
          }
        />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <ScreenHeader title="Favorites" />
        <View style={styles.grid}>
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </View>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <ScreenHeader title="Favorites" />
        <EmptyState
          icon={Heart}
          title="No favorites yet"
          caption="Tap the heart on any product to save it here"
          action={
            <TactilePressable
              onPress={() => navigation.navigate('Browse' as never)}
              haptic="commit"
              style={[styles.browseButton, { backgroundColor: theme.colors.action.primary.background }]}
            >
              <Text style={{ color: theme.colors.action.primary.foreground, ...textStyle.buttonPrimary }}>
                Browse Products
              </Text>
            </TactilePressable>
          }
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <ScreenHeader title="Favorites" />
      {items.length > 0 && (
        <Text style={[styles.count, { color: theme.colors.text.secondary }]}>
          {items.length} saved {items.length === 1 ? 'item' : 'items'}
        </Text>
      )}
      <FlatList
        data={items}
        numColumns={2}
        renderItem={({ item }) => {
          const product: ProductVO = item.product ?? item;
          return (
            <ProductCard product={product} storeProductId={storeProductIdOf(product)} source="saved" />
          );
        }}
        keyExtractor={(item) => String(item.product_id ?? item.id)}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.gridContent}
        onRefresh={refetch}
        refreshing={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = {
  container: { flex: 1 },
  count: {
    ...textStyle.caption,
    paddingHorizontal: semanticSpacing.screenPadding,
    marginBottom: semanticSpacing.xs,
  },
  // Identical grid spec to Browse: 2 columns, inlineGap gutter, screenPadding edges.
  columnWrapper: { gap: semanticSpacing.inlineGap, paddingHorizontal: semanticSpacing.screenPadding },
  gridContent: { gap: semanticSpacing.inlineGap, paddingVertical: semanticSpacing.xs, paddingBottom: semanticSpacing.xl },
  grid: { flexDirection: 'row', gap: semanticSpacing.inlineGap, paddingHorizontal: semanticSpacing.screenPadding },
  browseButton: { borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12, marginTop: semanticSpacing.md },
  retryButton: { flexDirection: 'row', alignItems: 'center', gap: semanticSpacing.xxs, borderRadius: semanticRadius.buttonPill, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, marginTop: semanticSpacing.md },
} as const;
