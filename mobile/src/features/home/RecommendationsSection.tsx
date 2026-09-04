import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { fetchRecommendations } from '../../lib/apiClient';
import { ProductCard } from '../../components/shared/ProductCard';
import { ProductCardSkeleton } from '../../components/shared/ProductCardSkeleton';
import { FadeSlideIn } from '../../components/shared/FadeSlideIn';
import { textStyle } from '../../theme/typography';
import { semanticSpacing } from '../../theme/spacing';
import { useTheme } from '../../theme';
import type { ProductVO } from '../../lib/product';

export function RecommendationsSection() {
  const theme = useTheme();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.recommendations,
    queryFn: fetchRecommendations,
    staleTime: 5 * 60 * 1000,
  });

  const recommendations = (data?.recommendations ?? []) as ProductVO[];
  const isPersonalised = data?.isPersonalised ?? false;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>Picked for You</Text>
        <FlatList
          horizontal
          data={[1, 2, 3, 4]}
          renderItem={() => <ProductCardSkeleton />}
          keyExtractor={(_, i) => String(i)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
        />
      </View>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <FadeSlideIn>
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          {isPersonalised ? 'Picked for You' : 'Popular near you'}
        </Text>
        {isPersonalised && (
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
            Based on your browsing
          </Text>
        )}
        <FlatList
          horizontal
          data={recommendations}
          renderItem={({ item }) => (
            <ProductCard product={item} source="recommendation" />
          )}
          keyExtractor={(item) => String(item.id)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
        />
      </View>
    </FadeSlideIn>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: semanticSpacing.sectionGap },
  title: { ...textStyle.h3, paddingHorizontal: semanticSpacing.screenPadding, marginBottom: semanticSpacing.xs },
  subtitle: { ...textStyle.bodySmall, paddingHorizontal: semanticSpacing.screenPadding, marginBottom: semanticSpacing.sm },
  list: { paddingHorizontal: semanticSpacing.screenPadding, gap: semanticSpacing.sm },
});
