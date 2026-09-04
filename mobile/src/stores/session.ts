import { create } from 'zustand';
import type { ApiUser } from '../lib/types';
import { setAuthToken, tokenStorage, forceTokenRefresh } from '../lib/apiClient';
import { getGlobalSyncRef } from '../lib/cartSync';
import { storage, STORAGE_KEYS } from '../lib/storage';
import {
  registerForPushNotifications,
  unregisterPushNotifications,
} from '../services/pushNotificationService';
import { queryClient } from '../lib/queryKeys';
import { BOOT_TIMEOUT_MS } from '../lib/constants';

export type SessionStatus = 'boot' | 'authenticated' | 'guest';

interface SessionState {
  status: SessionStatus;
  token: string | null;
  user: ApiUser | null;
  boot: () => Promise<void>;
  signIn: (token: string, user: ApiUser) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useSession = create<SessionState>((set) => ({
  status: 'boot',
  token: null,
  user: null,

  async boot() {
    try {
      const result = await Promise.race([
        (async () => {
          const token = await tokenStorage.get();
          const cached = await storage.get<ApiUser>(STORAGE_KEYS.session);
          return { token, cached };
        })(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Boot timeout')), BOOT_TIMEOUT_MS)
        ),
      ]);

      const { token, cached } = result;
      if (token) {
        setAuthToken(token);
        set({ status: 'authenticated', token, user: cached ?? null });
        // Try to refresh token and fetch fresh user in background
        if (!cached) {
          try {
            const newToken = await forceTokenRefresh();
            if (newToken) {
              const { fetchCurrentUser } = await import('../lib/apiClient');
              const user = await fetchCurrentUser();
              set({ user });
              await storage.set(STORAGE_KEYS.session, user);
            }
          } catch {
            // If refresh fails, we'll handle 401 on next API call
          }
        }
      } else {
        set({ status: 'guest', token: null, user: null });
      }
    } catch {
      // Timeout or storage error — fall through to guest
      set({ status: 'guest', token: null, user: null });
    }
  },

  async signIn(token, user) {
    setAuthToken(token);
    await tokenStorage.set(token);
    await storage.set(STORAGE_KEYS.session, user);
    set({ status: 'authenticated', token, user });
    registerForPushNotifications();
  },

  async signOut() {
    unregisterPushNotifications();
    setAuthToken(null);
    await tokenStorage.clear();
    await storage.remove(STORAGE_KEYS.session);
    // Reset global cart sync so next login re-syncs draft cart
    try {
      getGlobalSyncRef().current = false;
    } catch {}
    // Clear all cached queries to prevent stale data leakage between sessions
    queryClient.clear();
    set({ status: 'guest', token: null, user: null });
  },
}));