'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'

const ALLOWED_ROLES = ['developer', 'store_owner', 'store_manager', 'logistics_officer']

export function useRole() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading = useAuthStore((s) => s.isLoading)
  const checkAuth = useAuthStore((s) => s.checkAuth)

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      checkAuth()
    }
  }, [isAuthenticated, isLoading, checkAuth])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  const hasAccess = user ? ALLOWED_ROLES.includes(user.role) : false
  const isDeveloper = user?.role === 'developer'
  const isStoreOwner = user?.role === 'store_owner'
  const isLogisticsOfficer = user?.role === 'logistics_officer'

  return { user, loading: isLoading, hasAccess, isDeveloper, isStoreOwner, isLogisticsOfficer }
}
