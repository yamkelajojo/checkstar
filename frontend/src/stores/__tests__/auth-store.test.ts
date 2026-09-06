import { describe, it, expect, vi, beforeEach } from 'vitest'

// Single-flight checkAuth: concurrent callers must collapse into one
// /auth/user request (root cause fix for duplicate bootstraps in
// AuthGuard + page effects + React strict-mode double-invoke).

const getUser = vi.fn()

vi.mock('@/lib/api', () => ({
  api: {
    getUser: (...args: unknown[]) => getUser(...args),
    login: vi.fn(),
    logout: vi.fn(),
  },
}))

// Minimal localStorage for zustand persist in node env.
const store = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
})

describe('auth-store checkAuth single-flight', () => {
  beforeEach(() => {
    vi.resetModules()
    getUser.mockReset()
    store.clear()
  })

  it('collapses concurrent calls into one API request', async () => {
    let resolveGet!: (v: unknown) => void
    getUser.mockImplementation(() => new Promise((resolve) => { resolveGet = resolve }))

    const { useAuthStore } = await import('@/stores/auth-store')
    const api1 = useAuthStore.getState().checkAuth()
    const api2 = useAuthStore.getState().checkAuth()
    const api3 = useAuthStore.getState().checkAuth()

    resolveGet({ user: { id: 1, name: 'Dev', email: 'dev@checkstar.co.za', role: 'developer' } })
    await Promise.all([api1, api2, api3])

    expect(getUser).toHaveBeenCalledTimes(1)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().isLoading).toBe(false)
  })

  it('skips refetch after resolution — later callers are no-ops', async () => {
    getUser.mockResolvedValue({ user: { id: 1, name: 'Dev', email: 'dev@checkstar.co.za', role: 'developer' } })

    const { useAuthStore } = await import('@/stores/auth-store')
    await useAuthStore.getState().checkAuth()
    await useAuthStore.getState().checkAuth()

    expect(getUser).toHaveBeenCalledTimes(1)
  })

  it('failure marks the session unresolved exactly once', async () => {
    getUser.mockRejectedValue(new Error('401'))

    const { useAuthStore } = await import('@/stores/auth-store')
    await useAuthStore.getState().checkAuth()
    await useAuthStore.getState().checkAuth()

    expect(getUser).toHaveBeenCalledTimes(1)
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().isLoading).toBe(false)
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('logout clears local state even when the API call fails', async () => {
    getUser.mockResolvedValue({ user: { id: 1, name: 'Dev', email: 'dev@checkstar.co.za', role: 'developer' } })
    const { api } = await import('@/lib/api')
    ;(api.logout as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network down'))

    const { useAuthStore } = await import('@/stores/auth-store')
    await useAuthStore.getState().checkAuth()
    expect(useAuthStore.getState().isAuthenticated).toBe(true)

    await useAuthStore.getState().logout()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().isLoading).toBe(false)
  })
})
