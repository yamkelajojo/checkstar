import { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { queryClient } from './src/lib/queryKeys';
import { ThemeProvider } from './src/theme';
import { useThemePreference } from './src/stores/themePreference';
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
import type { ServerMergeResult } from './src/features/cart/model';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Font loading wrapper - keeps hook order stable in main App
function FontLoader({ children }: { children: React.ReactNode }) {
  const [fontsLoaded, fontError] = useFonts({
    'Handlee_400Regular': require('@expo-google-fonts/handlee/400Regular/Handlee_400Regular.ttf'),
    // GOTHAM ROUNDED: Add your licensed font files here when available
    // 'GothamRounded-Regular': require('./assets/fonts/GothamRounded-Regular.otf'),
    // 'GothamRounded-Medium': require('./assets/fonts/GothamRounded-Medium.otf'),
    // 'GothamRounded-Bold': require('./assets/fonts/GothamRounded-Bold.otf'),
  });

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EB6522" />
      </View>
    );
  }

  if (fontError) {
    console.warn('[fonts] Failed to load custom fonts:', fontError);
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFCF9',
  },
});

export default function App() {
  const sessionStatus = useSession((s) => s.status);
  const cartSyncRef = useRef(false);

  useEffect(() => {
    void useThemePreference.getState().init();
  }, []);

  useEffect(() => {
    if (sessionStatus === 'guest') {
      cartSyncRef.current = false;
      return;
    }
    if (sessionStatus !== 'authenticated' || cartSyncRef.current) return;
    
    let cancelled = false;
    void performCartSync(cartSyncRef, {
      syncCart,
      getLocalCart: () => useCart.getState().items,
      setCart: (items, response): ServerMergeResult => {
        if (!cancelled) {
          return useCart.getState().mergeLocalOntoServer(items, response);
        }
        return { items: [], droppedCount: 0 };
      },
    }).catch(() => {
      // Sync is best-effort; keep local draft if server unreachable.
      if (!cancelled) cartSyncRef.current = false;
    });
    
    return () => {
      cancelled = true;
    };
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
    void useDeliveryStore.getState().loadStores().catch((e: unknown) => {
      console.warn('[delivery] failed to load stores:', e);
    });

    void Notifications.requestPermissionsAsync().catch(() => {
      // Best-effort; local notifications simply won't display without consent.
    });
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
    <FontLoader>
      <TamaguiProvider config={config} defaultTheme="light">
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <ThemeProvider>
              <ToastProvider>
                <QueryClientProvider client={queryClient}>
                  <NavigationContainer ref={navigationRef}>
                    <StatusBar style="auto" />
                    <RootNavigator />
                  </NavigationContainer>
                </QueryClientProvider>
              </ToastProvider>
            </ThemeProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </TamaguiProvider>
    </FontLoader>
  );
}
