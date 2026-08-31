import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ShoppingCart, Home, LayoutGrid, User } from 'lucide-react-native';
import { HomeScreen } from '../features/home/HomeScreen';
import { BrowseScreen } from '../features/catalog/BrowseScreen';
import { CartScreen } from '../features/cart/CartScreen';
import { AccountScreen } from '../features/account/AccountScreen';
import { useTheme } from '../theme';
import { brand } from '../theme/colors';
import { useCart } from '../features/cart/store';
import { cartRules } from '../features/cart/model';
import { Text, View } from 'react-native';
import { semanticRadius } from '../theme/spacing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withDelay } from 'react-native-reanimated';
import { springs } from '../theme/motion';

const Tab = createBottomTabNavigator();

function CartTabBadge({ count }: { count: number }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (count === 0) return;
    scale.value = withSequence(
      withSpring(1.3, springs.bouncy),
      withDelay(150, withSpring(1, springs.gentle)),
    );
  }, [count]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

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
      <Text style={{ color: '#fff', fontSize: 9, fontWeight: '600' }}>{count}</Text>
    </Animated.View>
  );
}

export function CustomerTabs() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const items = useCart((s) => s.items);
  const count = cartRules.totalQuantity(items);

  const tabBarHeight = 50 + insets.bottom;
  const iconSize = 22;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: brand.orange,
        tabBarInactiveTintColor: theme.name === 'dark' ? theme.colors.text.tertiary : theme.colors.text.disabled,
        tabBarStyle: {
          backgroundColor: theme.colors.surface.elevated,
          borderTopColor: theme.name === 'dark' ? theme.colors.border.subtle : theme.colors.border.subtle,
          borderTopWidth: 0.5,
          height: tabBarHeight,
          paddingTop: 4,
          paddingBottom: insets.bottom,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500', marginTop: 2 },
        tabBarIconStyle: { marginBottom: 1 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color, size }) => <Home size={iconSize} color={color} /> }}
      />
      <Tab.Screen
        name="Browse"
        component={BrowseScreen}
        options={{ tabBarIcon: ({ color, size }) => <LayoutGrid size={iconSize} color={color} /> }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <View>
              <ShoppingCart size={iconSize} color={color} />
              <CartTabBadge count={count} />
            </View>
          ),
          tabBarAccessibilityLabel: `Cart, ${count} items`,
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{ tabBarIcon: ({ color, size }) => <User size={iconSize} color={color} /> }}
      />
    </Tab.Navigator>
  );
}