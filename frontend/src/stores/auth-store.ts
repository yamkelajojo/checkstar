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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
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
        await api.logout()
        set({ user: null, isAuthenticated: false })
      },
      checkAuth: async () => {
        try {
          const res = await api.getUser()
          set({ user: res.user, isAuthenticated: true, isLoading: false })
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false })
        }
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
