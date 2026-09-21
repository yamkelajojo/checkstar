import type { Metadata } from 'next'
import StoresAdminClient from './StoresAdminClient'
export const metadata: Metadata = { title: 'Stores | Admin', description: 'Manage stores' }
export default function StoresAdminPage() { return <StoresAdminClient /> }
