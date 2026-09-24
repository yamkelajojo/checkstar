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
import { TabScreenWrapper } from './TabScreenWrapper';
import { haptic } from '../lib/haptics';

const TAB_COMPONENTS = [HomeScreen, BrowseScreen, FavoritesScreen, CartScreen, AccountScreen] as const;

/**
 * CustomerTabs — the 5-tab pager.
 *
 * The native PagerView does the swipe. The only shared values are
 * scroll position/offset, fed solely to the tab bar's sliding indicator
 * (UI-thread-only usage, never read from JS render). Tab content is a
 * plain, static page — no entrance animations, no motion blur.
 */
export function CustomerTabs() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const items = useCart((s) => s.items);
  const count = cartRules.totalQuantity(items);

  const pagerRef = useRef<PagerView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Shared values for the tab bar indicator only — UI thread.
  const scrollPosition = useSharedValue(0);
  const scrollOffset = useSharedValue(0);

  const tabBarHeight = 50 + insets.bottom;

  const handleTabPress = useCallback(
    (index: number) => {
      if (index === activeIndex) return;
      pagerRef.current?.setPage(index);
    },
    [activeIndex],
  );

  const onPageScroll = useCallback(
    (e: { nativeEvent: { position: number; offset: number } }) => {
      scrollPosition.value = e.nativeEvent.position;
      scrollOffset.value = e.nativeEvent.offset;
    },
    [scrollPosition, scrollOffset],
  );

  const onPageSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      const newIndex = e.nativeEvent.position;
      setActiveIndex((prev) => {
        if (prev !== newIndex) {
          haptic.selection();
        }
        return newIndex;
      });
    },
    [],
  );

  // Fallback for test environments where PagerView might not be fully available
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
            {TAB_COMPONENTS.map((Component, index) => (
              <View key={String(index)} style={styles.page} collapsable={false}>
                <TabScreenWrapper
                  isActive={activeIndex === index}
                  index={index}
                  activeIndex={activeIndex}
                >
                  <Component />
                </TabScreenWrapper>
              </View>
            ))}
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
