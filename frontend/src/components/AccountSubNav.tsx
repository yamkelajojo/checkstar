'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/cn'

const links = [
  { href: '/account/profile', label: 'Profile' },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/favorites', label: 'Favorites' },
  { href: '/account/dispatch', label: 'Dispatch', roles: ['store_owner', 'store_manager', 'logistics_officer', 'developer'] },
]

export default function AccountSubNav() {
  const pathname = usePathname()
  const user = useAuthStore(s => s.user)

  return (
    <div className="border-b border-gray-100 bg-white sticky top-[57px] z-20">
      <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
        {links.filter(l => {
          if (!l.roles) return true
          if (!user) return false
          return l.roles.includes(user.role)
        }).map(l => {
          const active = pathname === l.href || pathname.startsWith(l.href + '/')
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                active ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200'
              )}
            >
              {l.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
