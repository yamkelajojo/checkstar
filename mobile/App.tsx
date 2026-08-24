import { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/lib/queryKeys';
import { ThemeContext, useThemeFromSystem } from './src/theme';
import { ToastProvider } from './src/components/shared/GlassToast';
import { useMotionPreferences } from './src/stores/motionPreferences';
import { useSession } from './src/stores/session';
import { useDeliveryStore } from './src/stores/deliveryStore';
import { setUnauthorizedHandler, syncCart } from './src/lib/apiClient';
import { useCart } from './src/features/cart/store';
import { performCartSync } from './src/lib/cartSync';
import { RootNavigator } from './src/navigation/RootNavigator';
import type { RootStackParamList } from './src/navigation/types';
import { TamaguiProvider } from 'tamagui';
import config from './tamagui.config';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function App() {
  const theme = useThemeFromSystem();
  const sessionStatus = useSession((s) => s.status);
  const cartSyncRef = useRef(false);

  useEffect(() => {
    if (sessionStatus === 'guest') cartSyncRef.current = false;
    if (sessionStatus !== 'authenticated' || cartSyncRef.current) return;
    void performCartSync(cartSyncRef, {
      syncCart,
      getLocalCart: () => useCart.getState().items as unknown as import('./src/features/cart/types').CartItem[],
      setCart: (items) => useCart.getState().mergeLocalOntoServer(items as unknown as import('./src/features/cart/types').ServerCartLine[]),
    }).catch(() => {
      // Sync is best-effort; keep local draft if server unreachable.
      cartSyncRef.current = false;
    });
  }, [sessionStatus]);

  useEffect(() => {
    void useMotionPreferences.getState().init();
    return () => {
      useMotionPreferences.getState().dispose();
    };
  }, []);

  useEffect(() => {
    void useSession.getState().boot().catch(() => {
      void useSession.getState().signOut();
    });
    void useDeliveryStore.getState().loadStores().catch(() => {});
    setUnauthorizedHandler(() => {
      void useSession.getState().signOut();
    });

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const orderId = response.notification.request.content.data?.orderId;
      if (typeof orderId === 'number' && navigationRef.isReady()) {
        navigationRef.navigate('OrderDetail', { orderId, fromNotification: true });
      }
    });
    return () => subscription.remove();
  }, []);

  return (
    <TamaguiProvider config={config} defaultTheme="light">
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeContext.Provider value={theme}>
            <ToastProvider>
              <QueryClientProvider client={queryClient}>
                <NavigationContainer ref={navigationRef}>
                  <StatusBar style="auto" />
                  <RootNavigator />
                </NavigationContainer>
              </QueryClientProvider>
            </ToastProvider>
          </ThemeContext.Provider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </TamaguiProvider>
  );
}
