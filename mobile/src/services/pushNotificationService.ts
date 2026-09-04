import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getApiBaseUrl, tokenStorage } from '../lib/apiClient';

export async function registerForPushNotifications(): Promise<void> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const pushToken = tokenData.data;

    const baseUrl = await getApiBaseUrl();
    const authToken = await tokenStorage.get();
    if (!authToken) return;

    await fetch(`${baseUrl}/auth/device-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ push_token: pushToken, platform: Platform.OS }),
    });

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    // Silent — push registration never breaks UX
  }
}

export async function unregisterPushNotifications(): Promise<void> {
  try {
    const baseUrl = await getApiBaseUrl();
    const authToken = await tokenStorage.get();
    if (!authToken) return;

    await fetch(`${baseUrl}/auth/device-token`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });
  } catch {
    // Silent
  }
}
