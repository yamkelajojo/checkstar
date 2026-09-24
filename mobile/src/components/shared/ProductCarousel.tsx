import { FlatList, View } from 'react-native';
import type { ComponentType, ReactElement } from 'react';
import { ProductCard } from './ProductCard';
import type { ProductCardOptions } from './ProductGrid';
import { getGridMetrics } from '../../lib/grid';
import { semanticSpacing } from '../../theme/spacing';
import type { ProductVO } from '../../lib/product';

export interface ProductCarouselProps extends ProductCardOptions {
  data: ProductVO[];
  keyExtractor?: (item: ProductVO, index: number) => string;
  ListEmptyComponent?: ComponentType<unknown> | ReactElement | null;
}

/**
 * ProductCarousel — plain horizontal product rail.
 *
 * Deliberately simple: a stock FlatList with native snapping. No
 * Reanimated scroll handlers, no per-card transforms, no momentum
 * springs — those paths were the source of on-device crashes and the
 * "motiony" feel. Card width equals the 2-col grid column width so
 * cards look identical here and in grids.
 */
export function ProductCarousel({
  data,
  keyExtractor = (p) => String(p.id),
  getStoreProductId,
  onRequestSummary,
  source = 'home',
  ListEmptyComponent,
}: ProductCarouselProps) {
  const { columnWidth, screenPadding, gap } = getGridMetrics();

  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={columnWidth + gap}
      decelerationRate="normal"
      contentContainerStyle={{
        paddingHorizontal: screenPadding,
        gap,
        paddingVertical: semanticSpacing.xxs,
      }}
      ListEmptyComponent={ListEmptyComponent}
      renderItem={({ item }) => (
        <View testID="product-carousel-item" style={{ width: columnWidth }}>
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
