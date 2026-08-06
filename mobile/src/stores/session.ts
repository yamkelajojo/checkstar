import { create } from 'zustand';
import type { ApiUser } from '../lib/types';
import { setAuthToken, tokenStorage } from '../lib/apiClient';
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
    set({ status: 'guest', token: null, user: null });
  },
}));