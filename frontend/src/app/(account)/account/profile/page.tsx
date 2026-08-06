import type { Metadata } from 'next'
import ProfileClient from './ProfileClient'

export const metadata: Metadata = {
  title: 'My Profile — Checkstar',
  description: 'Manage your Checkstar account profile.',
}

export default function ProfilePage() {
  return <ProfileClient />
}
