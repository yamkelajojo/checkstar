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
import type { ProductVO } from '../../lib/product';

export function RecommendationsSection() {
  const theme = useTheme();
  const { data, isLoading } = useQuery({ queryKey: queryKeys.recommendations, queryFn: fetchRecommendations, staleTime: 5 * 60 * 1000 });
  const recommendations = (data?.recommendations ?? []) as ProductVO[];
  const isPersonalised = (data as any)?.isPersonalised ?? false;

  if (isLoading) {
    return (
      <View style={{ marginBottom: semanticSpacing.sectionGap }}>
        <FadeSlideIn delay={60} distance={8}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: semanticSpacing.screenPadding, marginBottom: 10 }}>
            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: theme.colors.surface.elevated, borderWidth: 1, borderColor: theme.colors.border.subtle }} />
            <Text style={{ ...textStyle.h3, color: theme.colors.text.primary, letterSpacing: -0.2, fontWeight: fontWeight.bold }}>Picked for You</Text>
          </View>
        </FadeSlideIn>
        <FlatList horizontal data={[1, 2, 3, 4]} renderItem={({ index }) => <ProductCardSkeleton index={index} />} keyExtractor={(_, i) => String(i)} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: semanticSpacing.screenPadding, gap: semanticSpacing.sm }} />
      </View>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <FadeSlideIn delay={80} distance={12}>
      <View style={{ marginBottom: semanticSpacing.sectionGap }}>
        <View style={{ paddingHorizontal: semanticSpacing.screenPadding, marginBottom: 10, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: theme.colors.surface.elevated, borderWidth: 1, borderColor: theme.colors.border.subtle, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 10 }}>✨</Text>
            </View>
            <Text style={{ ...textStyle.h3, color: theme.colors.text.primary, letterSpacing: -0.3, fontWeight: fontWeight.bold }}>{isPersonalised ? 'Picked for You' : 'Popular near you'}</Text>
            {isPersonalised ? <View style={{ backgroundColor: brand.orange + '15', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}><Text style={{ fontSize: 9, fontWeight: '700', color: brand.orange, letterSpacing: 0.3, textTransform: 'uppercase' }}>For you</Text></View> : null}
          </View>
          {isPersonalised ? <Text style={{ fontSize: 11, color: theme.colors.text.secondary, letterSpacing: -0.1, marginLeft: 28 }}>Based on your browsing</Text> : null}
        </View>
        <FlatList
          horizontal
          data={recommendations}
          renderItem={({ item, index }) => (
            <CrashCascadeIn index={index}>
              <ProductCard product={item} source="recommendation" />
            </CrashCascadeIn>
          )}
          keyExtractor={(item) => String(item.id)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: semanticSpacing.screenPadding, gap: semanticSpacing.sm }}
        />
      </View>
    </FadeSlideIn>
  );
}
