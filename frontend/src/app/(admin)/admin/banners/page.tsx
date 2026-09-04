import type { Metadata } from 'next'
import BannersClient from './BannersClient'

export const metadata: Metadata = {
  title: 'Banners | Checkstar Admin',
  description: 'Manage promotional banners for your store',
}

export default function BannersPage() {
  return <BannersClient />
}
