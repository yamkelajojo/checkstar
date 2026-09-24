import { View, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Heart, WifiOff, RefreshCw } from 'lucide-react-native';
import { queryKeys } from '../../lib/queryKeys';
import { fetchFavorites } from '../../lib/apiClient';
import { ProductGrid } from '../../components/shared/ProductGrid';
import { ProductCardSkeleton } from '../../components/shared/ProductCardSkeleton';
import { EmptyState } from '../../components/shared/EmptyState';
import { ScreenHeader } from '../../components/shared/ScreenHeader';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { FadeSlideIn } from '../../components/shared/FadeSlideIn';
import { textStyle, fontWeight } from '../../theme/typography';
import { semanticSpacing, semanticRadius } from '../../theme/spacing';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { useDeliveryStore } from '../../stores/deliveryStore';
import { findStoreAvailability } from '../../lib/product';
import type { ProductVO } from '../../lib/product';

/**
 * Saved products.
 * Shares the exact header, grid and card spec as Browse — the canonical
 * ProductGrid — so cards line up identically on every screen.
 */
export function FavoritesScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const store = useDeliveryStore((s) => s.fulfillmentStore);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.favorites,
    queryFn: () => fetchFavorites(),
  });

  const items = (data as any)?.data ?? data ?? [];
  const products: ProductVO[] = items.map((item: any) => item.product ?? item);

  const storeProductIdOf = (product: ProductVO): number | null => {
    if (!store) return null;
    return findStoreAvailability(product, store.id)?.storeProductId ?? null;
  };

  if (isError) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
        <ScreenHeader title="Favorites" />
        <FadeSlideIn delay={100} distance={12}>
          <EmptyState
            icon={WifiOff}
            title="Couldn't load your favorites"
            caption="Check your connection and try again."
            action={
              <TactilePressable
                onPress={() => refetch()}
                haptic="tap"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: theme.colors.surface.primary,
                  borderColor: theme.colors.border.subtle,
                  borderWidth: 1,
                  borderRadius: semanticRadius.buttonPill,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  marginTop: semanticSpacing.sm,
                }}
              >
                <RefreshCw size={14} color={theme.colors.text.secondary} strokeWidth={2} />
                <Text style={{ color: theme.colors.text.secondary, fontWeight: fontWeight.semibold, fontSize: 12, letterSpacing: 0.2 }}>Retry</Text>
              </TactilePressable>
            }
          />
        </FadeSlideIn>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
        <ScreenHeader title="Favorites" />
        <View style={{ flexDirection: 'row', gap: semanticSpacing.inlineGap, paddingHorizontal: semanticSpacing.screenPadding, marginTop: semanticSpacing.md }}>
          <ProductCardSkeleton index={0} />
          <ProductCardSkeleton index={1} />
        </View>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
        <ScreenHeader title="Favorites" />
        <FadeSlideIn delay={100} distance={12}>
          <EmptyState
            icon={Heart}
            title="No favorites yet"
            caption="Tap the heart on any product to save it here — fresh picks every day"
            action={
              <TactilePressable
                onPress={() => navigation.navigate('Browse' as never)}
                haptic="commit"
                style={{
                  backgroundColor: theme.colors.text.primary,
                  borderRadius: semanticRadius.buttonPill,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  marginTop: semanticSpacing.md,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <Text style={{ color: theme.colors.text.inverse, fontWeight: fontWeight.bold, fontSize: 12, letterSpacing: 0.3, textTransform: 'uppercase' }}>
                  Browse Products
                </Text>
              </TactilePressable>
            }
          />
        </FadeSlideIn>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <ScreenHeader title="Favorites" />
      <FadeSlideIn delay={80} distance={8}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: semanticSpacing.screenPadding, marginBottom: semanticSpacing.xs }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: brand.orange }} />
          <Text style={{ ...textStyle.caption, color: theme.colors.text.secondary, fontSize: 11, letterSpacing: 0.2 }}>
            {items.length} saved {items.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
      </FadeSlideIn>
      <ProductGrid
        data={products}
        keyExtractor={(p) => String(p.id)}
        getStoreProductId={storeProductIdOf}
        source="saved"
      />
    </View>
  );
}
