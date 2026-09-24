import { ReactNode, createContext, useContext } from 'react';
import { View } from 'react-native';

interface TabTransitionContextValue {
  isActive: boolean;
  direction: number;
  activeIndex: number;
  index: number;
}

/**
 * Context so inner components can read pager activation state if they
 * ever need it (no motion is derived from it anymore).
 */
export const TabTransitionContext = createContext<TabTransitionContextValue>({
  isActive: false,
  direction: 0,
  activeIndex: 0,
  index: 0,
});

export function useTabTransition() {
  return useContext(TabTransitionContext);
}

interface TabScreenWrapperProps {
  children: ReactNode;
  isActive: boolean;
  index: number;
  activeIndex: number;
}

/**
 * TabScreenWrapper — plain pager page container.
 *
 * No transforms, no blur, no parallax: the native PagerView handles the
 * swipe and everything else is static. This is deliberate — animated
 * wrappers around full screens were a crash source on device.
 */
export function TabScreenWrapper({ children, isActive, index, activeIndex }: TabScreenWrapperProps) {
  return (
    <TabTransitionContext.Provider
      value={{ isActive, direction: 0, activeIndex, index }}
    >
      <View style={{ flex: 1 }}>{children}</View>
    </TabTransitionContext.Provider>
  );
}
