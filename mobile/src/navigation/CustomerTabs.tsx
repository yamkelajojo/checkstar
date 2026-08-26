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

const Tab = createBottomTabNavigator();

export function CustomerTabs() {
  const theme = useTheme();
  const items = useCart((s) => s.items);
  const count = cartRules.totalQuantity(items);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: brand.orange,
        tabBarInactiveTintColor: theme.name === 'dark' ? theme.colors.text.secondary : theme.colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface.elevated,
          borderTopColor: theme.name === 'dark' ? theme.colors.border.default : theme.colors.border.subtle,
          borderTopWidth: theme.name === 'dark' ? 2 : 1,
          height: 56,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color, size }) => <Home size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Browse"
        component={BrowseScreen}
        options={{ tabBarIcon: ({ color, size }) => <LayoutGrid size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <View>
              <ShoppingCart size={size} color={color} />
              {count > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -10,
                    minWidth: 16,
                    height: 16,
                    borderRadius: semanticRadius.badge,
                    backgroundColor: brand.orange,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 4,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{count}</Text>
                </View>
              )}
            </View>
          ),
          tabBarAccessibilityLabel: `Cart, ${count} items`,
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{ tabBarIcon: ({ color, size }) => <User size={size} color={color} /> }}
      />
    </Tab.Navigator>
  );
}