import type { Metadata } from 'next'
import RidersClient from './RidersClient'
export const metadata: Metadata = { title: 'Riders | Admin', description: 'Manage riders' }
export default function RidersPage() { return <RidersClient /> }
