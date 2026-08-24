import type { Metadata } from 'next'
import SpecialsClient from './SpecialsClient'

export const metadata: Metadata = {
  title: 'Specials — Checkstar',
  description: 'Check out our latest Specials — limited-time offers on your favourite products.',
}

export default function SpecialsPage() {
  return <SpecialsClient />
}
