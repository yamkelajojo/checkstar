'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface User {
  id: number
  name: string
  email: string
  role: string
}

const ALLOWED_ROLES = ['developer', 'store_owner', 'store_manager', 'logistics_officer']

export function useRole() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchUser() {
      try {
        const data = await api.getUser()
        setUser(data.user ?? data as unknown as User)
      } catch {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [router])

  const hasAccess = user ? ALLOWED_ROLES.includes(user.role) : false
  const isDeveloper = user?.role === 'developer'
  const isStoreOwner = user?.role === 'store_owner'
  const isLogisticsOfficer = user?.role === 'logistics_officer'

  return { user, loading, hasAccess, isDeveloper, isStoreOwner, isLogisticsOfficer }
}
