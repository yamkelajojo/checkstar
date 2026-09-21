import { useRef, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useTheme } from '../theme';
import { useCart } from '../features/cart/store';
import { cartRules } from '../features/cart/model';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSharedValue } from 'react-native-reanimated';
import { HomeScreen } from '../features/home/HomeScreen';
import { BrowseScreen } from '../features/catalog/BrowseScreen';
import { FavoritesScreen } from '../features/favorites/FavoritesScreen';
import { CartScreen } from '../features/cart/CartScreen';
import { AccountScreen } from '../features/account/AccountScreen';
import { AnimatedTabBar } from './AnimatedTabBar';
import { TabScreenWrapper, TabTransitionContext } from './TabScreenWrapper';
import { getTabDirection, TAB_ORDER } from './tabTransitions';
import { haptic } from '../lib/haptics';

const TAB_COMPONENTS = [HomeScreen, BrowseScreen, FavoritesScreen, CartScreen, AccountScreen] as const;

export function CustomerTabs() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const items = useCart((s) => s.items);
  const count = cartRules.totalQuantity(items);

  const pagerRef = useRef<PagerView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [directionState, setDirectionState] = useState(0);
  const prevIndexRef = useRef(0);

  // Shared values for fluid, synchronized animations — UI thread
  const scrollPosition = useSharedValue(0);
  const scrollOffset = useSharedValue(0);
  const direction = useSharedValue(0);

  const tabBarHeight = 50 + insets.bottom;

  const handleTabPress = useCallback(
    (index: number) => {
      if (index === activeIndex) return;
      const dir = getTabDirection(activeIndex, index);
      direction.value = dir;
      setDirectionState(dir);
      prevIndexRef.current = activeIndex;
      pagerRef.current?.setPage(index);
    },
    [activeIndex, direction]
  );

  const onPageScroll = useCallback(
    (e: { nativeEvent: { position: number; offset: number } }) => {
      scrollPosition.value = e.nativeEvent.position;
      scrollOffset.value = e.nativeEvent.offset;
    },
    [scrollPosition, scrollOffset]
  );

  const onPageSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      const newIndex = e.nativeEvent.position;
      const dir = getTabDirection(prevIndexRef.current, newIndex);
      direction.value = dir;
      setDirectionState(dir);
      if (newIndex !== prevIndexRef.current) {
        haptic.selection();
      }
      prevIndexRef.current = newIndex;
      setActiveIndex(newIndex);
    },
    [direction]
  );

  // For testing environment where PagerView might not be fully available, fallback to View
  const isPagerAvailable = typeof PagerView !== 'undefined';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <View style={styles.pagerContainer}>
        {isPagerAvailable ? (
          <PagerView
            ref={pagerRef}
            style={styles.pager}
            initialPage={0}
            offscreenPageLimit={1}
            overdrag={false}
            scrollEnabled={true}
            onPageScroll={onPageScroll}
            onPageSelected={onPageSelected}
          >
            {TAB_COMPONENTS.map((Component, index) => {
              const isActive = activeIndex === index;
              return (
                <View key={TAB_ORDER[index]} style={styles.page} collapsable={false}>
                  <TabTransitionContext.Provider
                    value={{
                      isActive,
                      direction: directionState,
                      activeIndex,
                      index,
                    }}
                  >
                    <TabScreenWrapper
                      isActive={isActive}
                      direction={direction}
                      scrollPosition={scrollPosition}
                      scrollOffset={scrollOffset}
                      index={index}
                      activeIndex={activeIndex}
                    >
                      <Component />
                    </TabScreenWrapper>
                  </TabTransitionContext.Provider>
                </View>
              );
            })}
          </PagerView>
        ) : (
          // Fallback for test environment
          <View style={styles.page}>
            {(() => {
              const Component = TAB_COMPONENTS[activeIndex];
              return <Component />;
            })()}
          </View>
        )}
      </View>

      <AnimatedTabBar
        activeIndex={activeIndex}
        scrollPosition={scrollPosition}
        scrollOffset={scrollOffset}
        onTabPress={handleTabPress}
        cartCount={count}
        tabBarHeight={tabBarHeight}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pagerContainer: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
});
