import { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSession } from '../stores/session';
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
import { CustomerTabs } from './CustomerTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const status = useSession((s) => s.status);
  const user = useSession((s) => s.user);
  const [onboardingSeen, setOnboardingSeen] = useState(true);

  useEffect(() => {
    if (status === 'guest') {
      storage.get<boolean>(STORAGE_KEYS.onboardingSeen).then((seen) => setOnboardingSeen(seen !== false));
    }
  }, [status]);

  if (status === 'boot') {
    return <SplashScreen />;
  }

  const isRider = user?.role === 'rider';
  const showOnboarding = status === 'guest' && !onboardingSeen;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {showOnboarding ? (
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Auth" component={AuthScreen} options={{ presentation: 'modal' }} />
        </>
      ) : isRider ? (
        <>
          <Stack.Screen name="RiderHome" component={RiderHomeScreen} />
          <Stack.Screen name="RiderOrderDetail" component={RiderOrderDetailScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Tabs" component={CustomerTabs} />
          <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
          <Stack.Screen name="Search" component={SearchScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="Auth" component={AuthScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="StorePicker" component={StorePickerScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="OrderPlaced" component={OrderPlacedScreen} options={{ gestureEnabled: false }} />
          <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
