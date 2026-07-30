import type { Metadata } from 'next'
import RiderDashboardClient from './RiderDashboardClient'

export const metadata: Metadata = {
  title: 'Rider Dashboard — Checkstar',
  description: 'Checkstar Rider delivery dashboard.',
}

export default function RiderDashboardPage() {
  return <RiderDashboardClient />
}
