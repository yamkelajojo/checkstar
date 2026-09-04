import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Heart } from 'lucide-react-native';
import { queryKeys } from '../../lib/queryKeys';
import { fetchFavorites } from '../../lib/apiClient';
import { ProductCard } from '../../components/shared/ProductCard';
import { ProductCardSkeleton } from '../../components/shared/ProductCardSkeleton';
import { EmptyState } from '../../components/shared/EmptyState';
import { TactilePressable } from '../../components/shared/TactilePressable';
import { textStyle } from '../../theme/typography';
import { semanticSpacing } from '../../theme/spacing';
import { useTheme } from '../../theme';

export function FavoritesScreen() {
  const theme = useTheme();
  const navigation = useNavigation();

  const { data, isLoading, refetch } = useQuery({
    queryKey: queryKeys.favorites,
    queryFn: () => fetchFavorites(),
  });

  const items = data?.data ?? data ?? [];

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>Your Favorites</Text>
        <FlatList
          data={[1, 2, 3, 4]}
          numColumns={2}
          renderItem={() => <ProductCardSkeleton />}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.grid}
        />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
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
      <Text style={[styles.title, { color: theme.colors.text.primary }]}>
        Your Favorites ({items.length})
      </Text>
      <FlatList
        data={items}
        numColumns={2}
        renderItem={({ item }) => (
          <ProductCard product={item.product ?? item} source="saved" />
        )}
        keyExtractor={(item) => String(item.product_id ?? item.id)}
        contentContainerStyle={styles.grid}
        onRefresh={refetch}
        refreshing={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { ...textStyle.h3, padding: semanticSpacing.screenPadding, paddingBottom: semanticSpacing.xs },
  grid: { paddingHorizontal: semanticSpacing.screenPadding, gap: semanticSpacing.sm },
  browseButton: { borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12, marginTop: semanticSpacing.md },
});
