import type { Metadata } from 'next'
import UsersClient from './UsersClient'
export const metadata: Metadata = { title: 'Users | Admin', description: 'Manage users' }
export default function UsersPage() { return <UsersClient /> }
