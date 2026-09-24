import { FlatList, View, type StyleProp, type ViewStyle } from 'react-native';
import { ProductCard } from './ProductCard';
import type { BadgeRect } from './ProductCard';
import { getGridMetrics } from '../../lib/grid';
import { semanticSpacing } from '../../theme/spacing';
import type { ProductVO } from '../../lib/product';
import type { ComponentType, ReactElement } from 'react';

/** FlatList slot: a component or a single element (no raw strings). */
type ListSlot = ComponentType<unknown> | ReactElement | null | undefined;

export interface ProductCardOptions {
  /** Effective store product id for add-to-cart (fulfillment store). */
  getStoreProductId: (product: ProductVO) => number | null;
  /** When provided, the price row opens a quick summary popup. */
  onRequestSummary?: (product: ProductVO, rect: BadgeRect | null) => void;
  source?: 'direct' | 'feed' | 'home' | 'search' | 'recommendation' | 'saved';
}

export interface ProductGridProps extends ProductCardOptions {
  data: ProductVO[];
  keyExtractor?: (item: ProductVO, index: number) => string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  ListFooterComponent?: ListSlot;
  ListHeaderComponent?: ListSlot;
}

/**
 * ProductGrid — the single 2-col product grid used across the app.
 * Card width is fixed by getGridMetrics so cards are identical in every
 * grid and every carousel.
 */
export function ProductGrid({
  data,
  keyExtractor = (p) => String(p.id),
  getStoreProductId,
  onRequestSummary,
  source = 'direct',
  contentContainerStyle,
  onEndReached,
  onEndReachedThreshold,
  ListFooterComponent,
  ListHeaderComponent,
}: ProductGridProps) {
  const { columnWidth, screenPadding, gap } = getGridMetrics();

  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      numColumns={2}
      columnWrapperStyle={{ gap, paddingHorizontal: screenPadding }}
      contentContainerStyle={[
        {
          gap,
          paddingVertical: semanticSpacing.xs,
          paddingBottom: semanticSpacing.xl,
        },
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={false}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      ListFooterComponent={ListFooterComponent}
      ListHeaderComponent={ListHeaderComponent}
      renderItem={({ item }) => (
        <View testID="product-grid-item" style={{ width: columnWidth }}>
          <ProductCard
            product={item}
            storeProductId={getStoreProductId(item)}
            onRequestSummary={onRequestSummary}
            source={source}
          />
        </View>
      )}
    />
  );
}
