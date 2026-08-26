import { create } from 'zustand';
import type { ApiUser } from '../lib/types';
import { setAuthToken, tokenStorage, forceTokenRefresh } from '../lib/apiClient';
import { getGlobalSyncRef } from '../lib/cartSync';
import { storage, STORAGE_KEYS } from '../lib/storage';

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
    const token = await tokenStorage.get();
    // Persisted user for instant shell selection without a network round-trip.
    const cached = await storage.get<ApiUser>(STORAGE_KEYS.session);
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
  },

  async signIn(token, user) {
    setAuthToken(token);
    await tokenStorage.set(token);
    await storage.set(STORAGE_KEYS.session, user);
    set({ status: 'authenticated', token, user });
  },

  async signOut() {
    setAuthToken(null);
    await tokenStorage.clear();
    await storage.remove(STORAGE_KEYS.session);
    // Reset global cart sync so next login re-syncs draft cart
    try {
      getGlobalSyncRef().current = false;
    } catch {}
    set({ status: 'guest', token: null, user: null });
  },
}));