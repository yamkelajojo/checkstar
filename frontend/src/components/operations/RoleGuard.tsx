'use client'

import { useRole } from './useRole'
import { ShieldAlert } from 'lucide-react'
import Link from 'next/link'

export default function RoleGuard({ children }: { children: React.ReactNode }) {
  const { loading, hasAccess } = useRole()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-xs text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto">
            <ShieldAlert size={20} className="text-rose-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Access Denied</h2>
            <p className="text-xs text-gray-500 mt-1">
              You don&apos;t have permission to view this page.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#F58220] hover:text-[#E07018]"
          >
            Go to Home
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
