import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import { setApiToken } from '@/lib/api'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const API = (path: string, init?: RequestInit) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Accept': 'application/json', ...init?.headers as Record<string, string> }
  const token = typeof window !== 'undefined' ? JSON.parse(sessionStorage.getItem('auth-storage') || localStorage.getItem('auth-storage') || '{}')?.state?.token : null
  if (token) headers['Authorization'] = `Bearer ${token}`
  return fetch(`/api${path}`, { credentials: 'include', headers, ...init })
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null, token: null, isAuthenticated: false, isLoading: true,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      login: async (email, password) => {
        await API('/sanctum/csrf-cookie')
        const res = await API('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
        if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Login failed') }
        const data = await res.json()
        const token = data.token
        setApiToken(token)
        set({ token, isAuthenticated: true })
        const userRes = await API('/auth/user')
        if (userRes.ok) { const user = await userRes.json(); set({ user }) }
      },
      logout: async () => {
        try { await API('/auth/logout', { method: 'POST' }) } catch { }
        setApiToken(null)
        set({ user: null, token: null, isAuthenticated: false })
      },
      checkAuth: async () => {
        try {
          const token = get().token
          if (!token) { set({ user: null, isAuthenticated: false, isLoading: false }); return }
          setApiToken(token)
          const res = await API('/auth/user')
          if (res.ok) { const user = await res.json(); set({ user, isAuthenticated: true }) }
          else { set({ user: null, token: null, isAuthenticated: false }) }
        } catch { set({ user: null, token: null, isAuthenticated: false }) }
        finally { set({ isLoading: false }) }
      },
    }),
    { name: 'auth-storage', partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }) }
  )
)
