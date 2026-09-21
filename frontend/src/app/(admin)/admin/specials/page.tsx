import type { Metadata } from 'next'
import SpecialsAdminClient from './SpecialsAdminClient'
export const metadata: Metadata = { title: 'Specials | Admin', description: 'Manage specials' }
export default function SpecialsAdminPage() { return <SpecialsAdminClient /> }
