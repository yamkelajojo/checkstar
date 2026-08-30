'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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
        const res = await fetch('/api/auth/user', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setUser(data.user ?? data)
        } else {
          router.push('/login')
        }
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
