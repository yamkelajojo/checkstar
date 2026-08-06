import type { Metadata } from 'next'
import AdminDashboardClient from './AdminDashboardClient'

export const metadata: Metadata = {
  title: 'Admin Dashboard — Checkstar',
  description: 'Checkstar system administration panel.',
}

export default function AdminDashboardPage() {
  return <AdminDashboardClient />
}
