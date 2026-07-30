import type { Metadata } from 'next'
import CommunityClient from './CommunityClient'

export const metadata: Metadata = {
  title: 'Community — Checkstar',
  description: 'See Checkstar community involvement — gallery and CSR initiatives.',
}

export default function CommunityPage() {
  return <CommunityClient />
}
