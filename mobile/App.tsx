import { useEffect } from 'react';
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
import { setUnauthorizedHandler } from './src/lib/apiClient';
import { RootNavigator } from './src/navigation/RootNavigator';
import type { RootStackParamList } from './src/navigation/types';

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

  useEffect(() => {
    void useMotionPreferences.getState().init();
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
  );
}
