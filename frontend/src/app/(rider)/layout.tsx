import { AuthGuard } from '@/components/AuthGuard'

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard requiredRole="rider">{children}</AuthGuard>
}
