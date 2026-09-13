import { AuthGuard } from '@/components/AuthGuard'
import DashboardNav from '@/components/DashboardNav'

/**
 * The (admin) group hosts both platform-admin (developer) pages and
 * store-operations pages (banners, staff, messages) that store owners and
 * managers legitimately use — each page applies its own finer-grained gate.
 * Guarding the whole group as developer-only made StaffClient's own
 * store_owner path unreachable.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard staffRoles={['store_owner', 'store_manager', 'logistics_officer', 'developer']}>
      <div className="min-h-screen bg-surface text-foreground">
        <DashboardNav />
        {children}
      </div>
    </AuthGuard>
  )
}
