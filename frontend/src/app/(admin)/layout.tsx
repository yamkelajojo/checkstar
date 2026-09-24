import { AuthGuard } from '@/components/AuthGuard'
import AdminNav from '@/components/admin/AdminNav'

/**
 * The (admin) group hosts both platform-admin (developer) pages and
 * store-operations pages (banners, staff, messages) that store owners and
 * managers legitimately use — each page applies its own finer-grained gate.
 * Guarding the whole group as developer-only made StaffClient's own
 * store_owner path unreachable.
 *
 * Persistent navigation lives in AdminNav (sidebar on desktop, drawer on
 * mobile): the breadcrumb-only DashboardNav that preceded it was removed —
 * with a highlighted active page and a dashboard link, it added noise.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard staffRoles={['store_owner', 'store_manager', 'logistics_officer', 'developer']}>
      <div className="min-h-screen bg-surface text-foreground">
        <AdminNav />
        <div className="lg:pl-60">
          {children}
        </div>
      </div>
    </AuthGuard>
  )
}
