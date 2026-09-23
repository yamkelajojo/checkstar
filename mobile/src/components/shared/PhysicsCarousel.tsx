import React, { useCallback } from 'react';
import { FlatList, type FlatListProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  withSpring,
} from 'react-native-reanimated';
import { CAROUSEL_SPRING } from '../../theme/curves';
import { projectEndpoint, snapDecision } from '../../utils/scrollPhysics';
import { ScrollAwareCard } from './ScrollAwareCard';

const AnimatedFlatList = Animated.createAnimatedComponent(
  FlatList as React.ComponentType<FlatListProps<any>>,
);

interface PhysicsCarouselProps<T> {
  data: T[];
  renderItem: (info: { item: T; index: number }) => React.ReactNode;
  snapInterval: number;
  contentOffset?: number;
  style?: any;
  keyExtractor?: (item: T, index: number) => string;
  showsHorizontalScrollIndicator?: boolean;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  ListEmptyComponent?: React.ReactNode;
  ListHeaderComponent?: React.ReactNode;
}

export function PhysicsCarousel<T>({
  data,
  renderItem,
  snapInterval,
  contentOffset = 16,
  style,
  keyExtractor,
  showsHorizontalScrollIndicator = false,
  onEndReached,
  onEndReachedThreshold,
  ListEmptyComponent,
  ListHeaderComponent,
}: PhysicsCarouselProps<T>) {
  const scrollX = useSharedValue(0);
  const velocity = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
    onMomentumBegin: (event) => {
      velocity.value = event.velocity?.x ?? 0;
    },
  });

  const onMomentumScrollEnd = useCallback(
    (event: any) => {
      const offset = event.contentOffset.x;
      const vel = event.velocity?.x ?? 0;
      const maxIndex = Math.max(0, data.length - 1);

      const predicted = projectEndpoint(offset, vel);
      const { targetOffset } = snapDecision(
        offset,
        predicted,
        vel,
        snapInterval,
        contentOffset,
        maxIndex,
      );

      scrollX.value = withSpring(targetOffset, CAROUSEL_SPRING);
    },
    [data.length, snapInterval, contentOffset],
  );

  const wrappedRenderItem = useCallback(
    (info: { item: T; index: number }) => (
      <ScrollAwareCard
        scrollX={scrollX}
        itemWidth={snapInterval}
        spacing={12}
        index={info.index}
      >
        {renderItem(info) as React.ReactNode}
      </ScrollAwareCard>
    ),
    [scrollX, snapInterval, renderItem],
  );

  return (
    <AnimatedFlatList
      data={data}
      renderItem={wrappedRenderItem as any}
      keyExtractor={keyExtractor as any}
      horizontal
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      snapToInterval={snapInterval}
      decelerationRate="fast"
      onScroll={onScroll}
      onMomentumScrollEnd={onMomentumScrollEnd}
      contentContainerStyle={{ paddingHorizontal: contentOffset }}
      style={style}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      ListEmptyComponent={ListEmptyComponent as any}
      ListHeaderComponent={ListHeaderComponent as any}
    />
  );
}
