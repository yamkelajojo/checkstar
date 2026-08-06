import type { Metadata } from 'next'
import CareersClient from './CareersClient'

export const metadata: Metadata = {
  title: 'Careers — Checkstar',
  description: 'Join the Checkstar team — view current job openings in Durban.',
}

export default function CareersPage() {
  return <CareersClient />
}
