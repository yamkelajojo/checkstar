import { useEffect, useRef, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSession } from '../stores/session';
import { useNavigationSignal } from '../stores/navigationSignal';
import { storage, STORAGE_KEYS } from '../lib/storage';
import { SplashScreen } from '../features/onboarding/SplashScreen';
import { OnboardingScreen } from '../features/onboarding/OnboardingScreen';
import { StorePickerScreen } from '../features/store/StorePickerScreen';
import { AuthScreen } from '../features/auth/AuthScreen';
import { CheckoutScreen } from '../features/checkout/CheckoutScreen';
import { OrderPlacedScreen } from '../features/orders/OrderPlacedScreen';
import { OrderDetailScreen } from '../features/orders/OrderDetailScreen';
import { ProductDetailScreen } from '../features/product/ProductDetailScreen';
import { SearchScreen } from '../features/search/SearchScreen';
import { RiderHomeScreen } from '../features/rider/RiderHomeScreen';
import { RiderOrderDetailScreen } from '../features/rider/RiderOrderDetailScreen';
import { RiderProfileScreen } from '../features/rider/RiderProfileScreen';
import { RiderHistoryScreen } from '../features/rider/RiderHistoryScreen';
import { RouteExplorerScreen } from '../features/route-explorer/RouteExplorerScreen';
import { CustomerTabs } from './CustomerTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const status = useSession((s) => s.status);
  const user = useSession((s) => s.user);
  const signal = useNavigationSignal((s) => s.v);
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | undefined>(undefined);
  const prevBranch = useRef<string | null>(null);

  useEffect(() => {
    if (status === 'guest') {
      storage.get<boolean>(STORAGE_KEYS.onboardingSeen).then((seen) => setOnboardingSeen(seen === true));
    }
  }, [status, signal]);

  if (status === 'boot') {
    return <SplashScreen />;
  }

  // Show splash while resolving onboarding state for guests
  if (status === 'guest' && onboardingSeen === undefined) {
    return <SplashScreen />;
  }

  const isRider = user?.role === 'rider';
  const showOnboarding = status === 'guest' && onboardingSeen !== true;
  const branch = showOnboarding ? 'onboarding' : isRider ? 'rider' : 'customer';
  const navigatorKey = `${branch}-${signal}`;

  // Keep prev branch in sync for potential analytics/deep-link handling
  prevBranch.current = branch;

  return (
    <Stack.Navigator key={navigatorKey} screenOptions={{ headerShown: false }}>
      {showOnboarding ? (
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Auth" component={AuthScreen} options={{ presentation: 'modal' }} />
        </>
      ) : isRider ? (
        <>
          <Stack.Screen name="RiderHome" component={RiderHomeScreen} />
          <Stack.Screen name="RiderOrderDetail" component={RiderOrderDetailScreen} />
          <Stack.Screen name="RiderProfile" component={RiderProfileScreen} />
          <Stack.Screen name="RiderHistory" component={RiderHistoryScreen} />
          <Stack.Screen name="RouteExplorer" component={RouteExplorerScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Tabs" component={CustomerTabs} />
          <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
          <Stack.Screen name="Search" component={SearchScreen} />
          <Stack.Screen name="Auth" component={AuthScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="StorePicker" component={StorePickerScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="OrderPlaced" component={OrderPlacedScreen} options={{ gestureEnabled: false }} />
          <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
          <Stack.Screen name="RouteExplorer" component={RouteExplorerScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
