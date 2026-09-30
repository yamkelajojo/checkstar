import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import { api } from '@/lib/api'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  login: (email: string, password: string) => Promise<void>
  register: (data: { name: string; email: string; password: string; password_confirmation: string; phone?: string }) => Promise<void>
  registerRider: (data: { name: string; email: string; password: string; password_confirmation: string; phone?: string; vehicle_type?: string; banking_details: Record<string, string> }) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  forgotPassword: (email: string) => Promise<{ message: string }>
  resetPassword: (data: { token: string; email: string; password: string; password_confirmation: string }) => Promise<{ message: string }>
  requestEmailVerification: () => Promise<{ message: string }>
  verifyEmail: (id: string, hash: string, sig?: { expires: string; signature: string }) => Promise<{ message: string }>
}

// Module-level in-flight handle for checkAuth — shared across all callers.
let checkAuthInFlight: Promise<void> | null = null
let checkAuthVersion = 0

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      login: async (email, password) => {
        await api.getCsrfCookie()
        const res = await api.login({ email, password })
        set({ user: res.user, isAuthenticated: true })
      },
      register: async (data) => {
        await api.getCsrfCookie()
        const res = await api.register(data)
        set({ user: res.user, isAuthenticated: true })
      },
      registerRider: async (data) => {
        await api.getCsrfCookie()
        const res = await api.registerRider(data)
        set({ user: res.user, isAuthenticated: true })
      },
      logout: async () => {
        // Cancel any in-flight checkAuth so it doesn't overwrite cleared state
        checkAuthVersion++
        checkAuthInFlight = null
        // Never let a failing server call (expired session, network drop)
        // leave the user logged in locally — clear state unconditionally.
        try {
          await api.logout()
        } catch {
          // ignore — local state must clear regardless
        }
        // isLoading:false so guards (AuthGuard/Header) react immediately and
        // never re-run checkAuth into a half-logged-out state.
        set({ user: null, isAuthenticated: false, isLoading: false })
      },
      checkAuth: () => {
        // Single-flight: concurrent callers (AuthGuard bootstrap, page-level
        // effects, React strict-mode double-invoke) share one in-flight
        // promise, and once resolved the guard short-circuits — session
        // changes flow through login/logout mutations, never a re-fetch.
        if (!get().isLoading) return Promise.resolve()
        if (checkAuthInFlight) return checkAuthInFlight
        const myVersion = checkAuthVersion
        checkAuthInFlight = (async () => {
          try {
            const res = await api.getUser()
            // If logout was called while we were in-flight, don't overwrite cleared state
            if (checkAuthVersion !== myVersion) return
            set({ user: res.user, isAuthenticated: true, isLoading: false })
          } catch {
            if (checkAuthVersion !== myVersion) return
            set({ user: null, isAuthenticated: false, isLoading: false })
          } finally {
            checkAuthInFlight = null
          }
        })()
        return checkAuthInFlight
      },
      forgotPassword: async (email) => {
        const res = await api.forgotPassword(email)
        return res
      },
      resetPassword: async (data) => {
        const res = await api.resetPassword(data)
        return res
      },
      requestEmailVerification: async () => {
        const res = await api.requestEmailVerification()
        return res
      },
      verifyEmail: async (id, hash, sig) => {
        const res = await api.verifyEmail(id, hash, sig)
        return res
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)
