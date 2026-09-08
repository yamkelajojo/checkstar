'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { Loader } from '@/components/Loader'

type StaffRole = 'store_owner' | 'store_manager' | 'logistics_officer' | 'developer'

interface AuthGuardProps {
  requiredRole?: 'customer' | 'rider' | StaffRole
  staffRoles?: StaffRole[]
  redirectTo?: string
  children: React.ReactNode
}

export function AuthGuard({ requiredRole, staffRoles, redirectTo = '/auth/login', children }: AuthGuardProps) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore()

  // Bootstrap the session whenever we are still resolving it. This covers
  // BOTH cold visits and persisted (zustand/localStorage) sessions — with a
  // persisted session `isAuthenticated` is already true on mount, so the old
  // `!isAuthenticated && isLoading` condition never ran checkAuth and the
  // `isLoading` flag stayed true forever (permanent loading spinner).
  useEffect(() => {
    if (isLoading) {
      checkAuth()
    }
  }, [isLoading, checkAuth])

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace(redirectTo)
      return
    }
    if (requiredRole && user?.role !== requiredRole) {
      router.replace('/')
      return
    }
    if (staffRoles && user && !staffRoles.includes(user.role as StaffRole)) {
      router.replace('/')
    }
  }, [isLoading, isAuthenticated, requiredRole, staffRoles, user, router, redirectTo])

  if (isLoading) {
    if (user) return <>{children}</>
    return <Loader />
  }

  if (requiredRole && user?.role !== requiredRole) {
    return null
  }

  if (staffRoles && user && !staffRoles.includes(user.role as StaffRole)) {
    return null
  }

  return <>{children}</>
}
