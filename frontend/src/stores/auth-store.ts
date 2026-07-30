import { create } from 'zustand'
import type { User } from '@/types'
import { api } from '@/lib/api'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  login: (email: string, password: string) => Promise<void>
  register: (data: { name: string; email: string; password: string; password_confirmation: string; phone?: string }) => Promise<void>
  registerRider: (data: { name: string; email: string; password: string; password_confirmation: string; phone?: string; vehicle_type?: string; banking_details?: Record<string, string> }) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null, isAuthenticated: false, isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  login: async (email, password) => {
    const res = await api.login({ email, password })
    set({ user: res.user, isAuthenticated: true })
  },
  register: async (data) => {
    const res = await api.register(data)
    set({ user: res.user, isAuthenticated: true })
  },
  registerRider: async (data) => {
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
}))
