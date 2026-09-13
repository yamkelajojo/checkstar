'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, ChevronRight } from 'lucide-react'

const routeLabels: Record<string, string> = {
  admin: 'Dashboard',
  dashboard: 'Dashboard',
  banners: 'Banners',
  staff: 'Staff',
  messages: 'Messages',
  operations: 'Operations',
  analytics: 'Analytics',
  account: 'Account',
  dispatch: 'Dispatch',
  orders: 'Orders',
  profile: 'Profile',
}

export default function DashboardNav() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  // Build breadcrumb items (skip the first segment if it's "admin" or "account")
  const crumbs: Array<{ label: string; href: string }> = []
  let accumulated = ''

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    accumulated += `/${seg}`

    // Skip "admin" and "account" as root labels — the dashboard link covers them
    if (seg === 'admin' || seg === 'account') {
      // First segment: link back to dashboard
      if (crumbs.length === 0) {
        crumbs.push({ label: 'Dashboard', href: '/admin/dashboard' })
      }
      continue
    }

    // Skip numeric IDs (e.g. order detail pages)
    if (/^\d+$/.test(seg)) continue

    const label = routeLabels[seg] ?? seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    crumbs.push({ label, href: accumulated })
  }

  // Only show nav if we're deeper than the dashboard itself
  if (crumbs.length <= 1) return null

  const backHref = crumbs.length > 1 ? crumbs[crumbs.length - 2].href : '/admin/dashboard'

  return (
    <nav className="max-w-6xl mx-auto px-4 pt-4 pb-2 flex items-center gap-1.5 text-xs text-gray-400" aria-label="Breadcrumb">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <ArrowLeft size={13} />
        <span className="sr-only sm:not-sr-only">Back</span>
      </Link>

      {crumbs.length > 1 && (
        <>
          <ChevronRight size={12} className="text-gray-300" />
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1
            return isLast ? (
              <span key={crumb.href} className="text-gray-600 font-medium">{crumb.label}</span>
            ) : (
              <Link key={crumb.href} href={crumb.href} className="hover:text-gray-600 transition-colors">
                {crumb.label}
              </Link>
            )
          })}
        </>
      )}
    </nav>
  )
}
