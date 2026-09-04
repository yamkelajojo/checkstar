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

  useEffect(() => {
    if (!isAuthenticated && isLoading) {
      checkAuth()
    }
  }, [isAuthenticated, isLoading, checkAuth])

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

  if (isLoading || !isAuthenticated) {
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
