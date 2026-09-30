'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import {
  LayoutDashboard, ShoppingCart, ShoppingBag, Sparkles, Image as ImageIcon, Users,
  Bike, Activity, Package, Tags, Store, UserCog, BookOpen, HeartHandshake, Briefcase,
  MessageSquare, BarChart3, ShieldAlert, HeartPulse, Menu, X, LogOut,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

/**
 * Persistent admin navigation — the (admin) area has 16 pages but no
 * navigation of its own: every screen was reachable only by bouncing back
 * through the dashboard's link grid. This sidebar (desktop) / drawer
 * (mobile) groups the screens by job, filters them by role, and marks the
 * active page. The dashboard stays the overview; this is how you get around.
 *
 * Role lists mirror the backend route middleware exactly.
 */

type Role = 'developer' | 'store_owner' | 'store_manager' | 'logistics_officer'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  roles: Role[]
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const ALL_STAFF: Role[] = ['developer', 'store_owner', 'store_manager', 'logistics_officer']
const OPS_ROLES: Role[] = ['developer', 'store_owner', 'store_manager', 'logistics_officer']

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Store',
    items: [
      { href: '/admin/orders', label: 'Orders', icon: ShoppingCart, roles: OPS_ROLES },
      { href: '/admin/inventory', label: 'Inventory', icon: ShoppingBag, roles: OPS_ROLES },
      { href: '/admin/specials', label: 'Sales', icon: Sparkles, roles: ['developer', 'store_owner', 'store_manager'] },
      { href: '/admin/banners', label: 'Banners', icon: ImageIcon, roles: ['developer', 'store_owner', 'store_manager'] },
      { href: '/admin/staff', label: 'Staff', icon: Users, roles: ['developer', 'store_owner'] },
    ],
  },
  {
    label: 'Fulfillment',
    items: [
      { href: '/account/dispatch', label: 'Dispatch', icon: Bike, roles: OPS_ROLES },
      { href: '/operations', label: 'Live Operations', icon: Activity, roles: OPS_ROLES },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { href: '/admin/products', label: 'Products', icon: Package, roles: ['developer'] },
      { href: '/admin/categories', label: 'Categories', icon: Tags, roles: ['developer'] },
      { href: '/admin/stores', label: 'Stores', icon: Store, roles: ['developer'] },
    ],
  },
  {
    label: 'People',
    items: [
      { href: '/admin/users', label: 'Users', icon: UserCog, roles: ['developer'] },
      { href: '/admin/riders', label: 'Riders', icon: Bike, roles: ['developer'] },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/recipes', label: 'Recipes', icon: BookOpen, roles: ['developer'] },
      { href: '/admin/community', label: 'Community', icon: HeartHandshake, roles: ['developer'] },
      { href: '/admin/careers', label: 'Careers', icon: Briefcase, roles: ['developer'] },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/messages', label: 'Messages', icon: MessageSquare, roles: ['developer'] },
      { href: '/operations/analytics', label: 'Analytics', icon: BarChart3, roles: OPS_ROLES },
      { href: '/operations/audit-logs', label: 'Audit Logs', icon: ShieldAlert, roles: OPS_ROLES },
      { href: '/admin/health', label: 'Health', icon: HeartPulse, roles: ['developer'] },
    ],
  },
]

function NavLinks({ role, pathname, onNavigate }: { role: Role; pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin">
      <Link
        href="/admin/dashboard"
        onClick={onNavigate}
        aria-current={pathname === '/admin/dashboard' ? 'page' : undefined}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          pathname === '/admin/dashboard'
            ? 'bg-primary/10 text-primary'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <LayoutDashboard size={16} />
        Dashboard
      </Link>

      {NAV_GROUPS.map((group) => {
        const items = group.items.filter((i) => i.roles.includes(role))
        if (items.length === 0) return null
        return (
          <div key={group.label} className="mt-5">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {items.map((item) => {
                const Icon = item.icon
                const active = pathname === item.href
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                        active
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon size={16} className={active ? '' : 'text-gray-400'} />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}

export default function AdminNav() {
  const { user, logout } = useAuthStore()
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    setOpen(false)
    try {
      await logout()
    } catch {
      // store clears auth state regardless of network outcome
    }
    // End the admin session explicitly: leaving navigation to the auth
    // guards can race checkAuth and bounce the user back into the
    // dashboard before the session is gone.
    router.push('/auth/login')
  }

  // Close the mobile drawer on navigation and lock body scroll while open.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  if (!user || !ALL_STAFF.includes(user.role as Role)) return null

  const role = user.role as Role

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-60 bg-white border-r border-gray-200 z-40 flex flex-col">
        <div className="px-5 py-5 shrink-0">
          <Link href="/admin/dashboard" className="font-display text-xl font-bold text-gray-900">
            Checkstar
            <span className="ml-2 text-xs font-sans font-medium text-gray-400">Admin</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <NavLinks role={role} pathname={pathname} />
        </div>
        <div className="px-3 py-3 border-t border-gray-100 shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <LogOut size={16} className="text-gray-400" />
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open admin navigation"
            aria-expanded={open}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900 rounded-lg"
          >
            <Menu size={20} />
          </button>
          <Link href="/admin/dashboard" className="font-display text-lg font-bold text-gray-900">
            Checkstar <span className="text-xs font-sans font-medium text-gray-400">Admin</span>
          </Link>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white overflow-y-auto shadow-xl"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="font-display text-lg font-bold text-gray-900">Checkstar Admin</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="p-2 -mr-2 text-gray-500 hover:text-gray-900 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-3 py-4">
              <NavLinks role={role} pathname={pathname} onNavigate={() => setOpen(false)} />
            </div>
            <div className="px-3 py-3 border-t border-gray-100">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <LogOut size={16} className="text-gray-400" />
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
