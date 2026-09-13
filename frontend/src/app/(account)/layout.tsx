import { AuthGuard } from '@/components/AuthGuard'
import DashboardNav from '@/components/DashboardNav'

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-surface text-foreground">
        <DashboardNav />
        {children}
      </div>
    </AuthGuard>
  )
}
