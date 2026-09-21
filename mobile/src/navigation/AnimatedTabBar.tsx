import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../theme';
import { brand } from '../theme/colors';
import { semanticRadius } from '../theme/spacing';
import { Home, LayoutGrid, Heart, ShoppingCart, User } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useDerivedValue,
  interpolate,
  withDelay,
  type SharedValue,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { springs } from '../theme/motion';
import { TAB_ORDER } from './tabTransitions';
import { haptic } from '../lib/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabName = typeof TAB_ORDER[number];

interface TabConfig {
  name: TabName;
  Icon: typeof Home;
  label: string;
}

const TABS: TabConfig[] = [
  { name: 'Home', Icon: Home, label: 'Home' },
  { name: 'Browse', Icon: LayoutGrid, label: 'Browse' },
  { name: 'Favorites', Icon: Heart, label: 'Saved' },
  { name: 'Cart', Icon: ShoppingCart, label: 'Cart' },
  { name: 'Account', Icon: User, label: 'Account' },
];

interface AnimatedTabBarProps {
  activeIndex: number;
  scrollPosition: SharedValue<number>;
  scrollOffset: SharedValue<number>;
  onTabPress: (index: number) => void;
  cartCount: number;
  tabBarHeight: number;
}

function CartBadge({ count }: { count: number }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (count === 0) return;
    scale.value = withSpring(1.25, springs.bouncy);
    scale.value = withDelay(150, withSpring(1, springs.gentle));
  }, [count]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (count === 0) return null;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: -4,
          right: -8,
          minWidth: 14,
          height: 14,
          borderRadius: semanticRadius.badge,
          backgroundColor: brand.orange,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 3,
        },
        animatedStyle,
      ]}
    >
      <Text style={{ color: '#fff', fontSize: 9, fontWeight: '600' }}>{count > 99 ? '99+' : count}</Text>
    </Animated.View>
  );
}

interface TabItemProps {
  config: TabConfig;
  index: number;
  isActive: boolean;
  activeIndex: number;
  scrollPosition: SharedValue<number>;
  scrollOffset: SharedValue<number>;
  onPress: () => void;
  cartCount?: number;
}

function TabItem({ config, index, isActive, activeIndex, scrollPosition, scrollOffset, onPress, cartCount }: TabItemProps) {
  const theme = useTheme();
  const { Icon } = config;

  // Interpolate scale and opacity based on scroll position for fluid indicator sync
  const progress = useDerivedValue(() => {
    const pos = scrollPosition.value + scrollOffset.value;
    // Distance from this tab
    const dist = Math.abs(pos - index);
    // 1 when active, 0 when far
    return Math.max(0, 1 - dist);
  });

  const iconStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [1, 1.12]);
    const translateY = interpolate(progress.value, [0, 1], [0, -1]);
    return {
      transform: [{ scale }, { translateY }],
    };
  });

  const labelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 0.5, 1], [0.6, 0.8, 1]);
    return { opacity };
  });

  const activeColor = brand.orange;
  const inactiveColor = theme.name === 'dark' ? theme.colors.text.tertiary : theme.colors.text.disabled;

  // Determine color based on progress for smooth transition during swipe
  const color = isActive ? activeColor : inactiveColor;

  return (
    <Pressable
      onPress={onPress}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 }}
      accessibilityRole="button"
      accessibilityLabel={config.label}
      accessibilityState={{ selected: isActive }}
      hitSlop={8}
    >
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={iconStyle}>
          <View>
            <Icon
              size={22}
              color={progress.value > 0.5 ? activeColor : inactiveColor}
              strokeWidth={isActive ? 2.2 : 1.8}
            />
            {config.name === 'Cart' && <CartBadge count={cartCount ?? 0} />}
          </View>
        </Animated.View>
        <Animated.View style={[{ marginTop: 3 }, labelStyle]}>
          <Text
            style={{
              fontSize: 10,
              fontWeight: isActive ? '600' : '500',
              color: progress.value > 0.5 ? activeColor : inactiveColor,
              letterSpacing: 0.2,
            }}
          >
            {config.label}
          </Text>
        </Animated.View>
      </View>
    </Pressable>
  );
}

export function AnimatedTabBar({
  activeIndex,
  scrollPosition,
  scrollOffset,
  onTabPress,
  cartCount,
  tabBarHeight,
}: AnimatedTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const tabWidth = useSharedValue(0);
  const indicatorPosition = useSharedValue(activeIndex);

  // Update indicator when activeIndex changes (tap)
  useEffect(() => {
    indicatorPosition.value = withSpring(activeIndex, {
      damping: 30,
      stiffness: 400,
      mass: 0.8,
    });
  }, [activeIndex]);

  // During swipe, indicator follows scrollPosition + offset directly for 1:1 tracking
  const indicatorStyle = useAnimatedStyle(() => {
    const pos = scrollPosition.value + scrollOffset.value;
    // If actively scrolling (offset !=0), follow directly; else follow spring indicatorPosition
    const isScrolling = Math.abs(scrollOffset.value) > 0.001;
    const targetPos = isScrolling ? pos : indicatorPosition.value;

    // tabWidth may be 0 initially, guard
    const x = targetPos * (tabWidth.value || 1);
    return {
      transform: [{ translateX: x }],
    };
  });

  const containerStyle = {
    backgroundColor: theme.colors.surface.elevated,
    borderTopColor: theme.colors.border.subtle,
    borderTopWidth: 0.5,
    height: tabBarHeight,
    paddingBottom: insets.bottom,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: theme.name === 'dark' ? 0.15 : 0.06,
    shadowRadius: 12,
    elevation: 8,
  };

  return (
    <View style={containerStyle}>
      {/* Indicator track */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2.5,
          backgroundColor: 'transparent',
        }}
        onLayout={(e) => {
          const width = e.nativeEvent.layout.width;
          tabWidth.value = width / TABS.length;
        }}
      >
        {/* Sliding indicator */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${100 / TABS.length}%`,
              height: 2.5,
              backgroundColor: brand.orange,
              borderRadius: 1.25,
              shadowColor: brand.orange,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 6,
            },
            indicatorStyle,
          ]}
        />
      </View>

      {TABS.map((tab, index) => (
        <TabItem
          key={tab.name}
          config={tab}
          index={index}
          isActive={activeIndex === index}
          activeIndex={activeIndex}
          scrollPosition={scrollPosition}
          scrollOffset={scrollOffset}
          cartCount={tab.name === 'Cart' ? cartCount : undefined}
          onPress={() => {
            if (index !== activeIndex) {
              haptic.selection();
            }
            onTabPress(index);
          }}
        />
      ))}
    </View>
  );
}

export { TABS };
