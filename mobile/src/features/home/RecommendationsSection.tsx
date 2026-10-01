import { useMemo } from 'react';
import { View, Text, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { fetchRecommendations } from '../../lib/apiClient';
import { ProductCard } from '../../components/shared/ProductCard';
import { ProductCardSkeleton } from '../../components/shared/ProductCardSkeleton';
import { FadeSlideIn } from '../../components/shared/FadeSlideIn';
import { CrashCascadeIn } from '../../components/shared/CrashCascadeIn';
import { textStyle, fontWeight } from '../../theme/typography';
import { semanticSpacing } from '../../theme/spacing';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { mapProduct, findStoreAvailability, type ProductVO } from '../../lib/product';
import { getGridMetrics } from '../../lib/grid';
import { useSession } from '../../stores/session';
import { useDeliveryStore } from '../../stores/deliveryStore';

export function RecommendationsSection() {
  const theme = useTheme();
  const { columnWidth, screenPadding, gap } = getGridMetrics();
  const sessionStatus = useSession((s) => s.status);
  const store = useDeliveryStore((s) => s.fulfillmentStore);
  const isAuthenticated = sessionStatus === 'authenticated';

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.recommendations,
    queryFn: fetchRecommendations,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const recommendations = useMemo<ProductVO[]>(() => {
    const rawList = (data as any)?.recommendations ?? (data as any)?.data ?? (Array.isArray(data) ? data : []);
    if (!Array.isArray(rawList)) return [];
    const mapped: ProductVO[] = [];
    for (const raw of rawList) {
      if (!raw || typeof raw !== 'object') continue;
      if (Array.isArray(raw.stores) && typeof raw.effectivePriceCents === 'number') {
        mapped.push(raw as ProductVO);
      } else {
        try {
          mapped.push(mapProduct(raw));
        } catch {}
      }
    }
    return mapped;
  }, [data]);

  const isPersonalised = (data as any)?.based_on === 'collaborative' || (data as any)?.isPersonalised === true;

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <View style={{ marginTop: semanticSpacing.md }}>
        <FadeSlideIn delay={60} distance={8}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: semanticSpacing.screenPadding, marginBottom: 8 }}>
            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: theme.colors.surface.elevated, borderWidth: 1, borderColor: theme.colors.border.subtle }} />
            <Text style={{ ...textStyle.h3, color: theme.colors.text.primary, letterSpacing: -0.2, fontWeight: fontWeight.bold }}>Picked for You</Text>
          </View>
        </FadeSlideIn>
        <FlatList horizontal data={[1, 2, 3, 4]} renderItem={({ index }) => (
          <View style={{ width: columnWidth }}>
            <ProductCardSkeleton index={index} />
          </View>
        )} keyExtractor={(_, i) => String(i)} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: screenPadding, gap }} />
      </View>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <FadeSlideIn delay={80} distance={12}>
      <View style={{ marginTop: semanticSpacing.md }}>
        <View style={{ paddingHorizontal: semanticSpacing.screenPadding, marginBottom: 8, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: theme.colors.surface.elevated, borderWidth: 1, borderColor: theme.colors.border.subtle, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 10 }}>✨</Text>
            </View>
            <Text style={{ ...textStyle.h3, color: theme.colors.text.primary, letterSpacing: -0.3, fontWeight: fontWeight.bold }}>{isPersonalised ? 'Picked for You' : 'Recommended for You'}</Text>
            {isPersonalised ? <View style={{ backgroundColor: brand.orange + '15', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}><Text style={{ fontSize: 9, fontWeight: '700', color: brand.orange, letterSpacing: 0.3, textTransform: 'uppercase' }}>For you</Text></View> : null}
          </View>
          {isPersonalised ? <Text style={{ fontSize: 11, color: theme.colors.text.secondary, letterSpacing: -0.1, marginLeft: 28 }}>Based on your recent orders</Text> : null}
        </View>
        <FlatList
          horizontal
          data={recommendations}
          renderItem={({ item, index }) => {
            const storeProductId = store ? (findStoreAvailability(item, store.id)?.storeProductId ?? null) : null;
            return (
              <View style={{ width: columnWidth }}>
                <CrashCascadeIn index={index}>
                  <ProductCard product={item} storeProductId={storeProductId} source="recommendation" />
                </CrashCascadeIn>
              </View>
            );
          }}
          keyExtractor={(item) => String(item.id)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: screenPadding, gap }}
        />
      </View>
    </FadeSlideIn>
  );
}
