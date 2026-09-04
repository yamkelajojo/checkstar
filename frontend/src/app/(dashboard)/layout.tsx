import { AuthGuard } from '@/components/AuthGuard'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard staffRoles={['store_owner', 'store_manager', 'logistics_officer', 'developer']}>
      <div className="min-h-screen bg-surface text-foreground">
        {children}
      </div>
    </AuthGuard>
  )
}
