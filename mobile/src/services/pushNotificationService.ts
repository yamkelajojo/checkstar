import { getApiBaseUrl, tokenStorage } from '../lib/apiClient';

export async function registerForPushNotifications(): Promise<void> {
  return;
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
