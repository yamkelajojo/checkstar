import type { Metadata } from 'next'
import SaleDetailClient from './SaleDetailClient'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return {
    title: `${slug.replace(/-/g, ' ')} — Checkstar Sale`,
    description: 'Limited-time sale on your favourite products.',
  }
}

export default async function SaleDetailPage({ params }: Props) {
  const { slug } = await params
  return <SaleDetailClient slug={slug} />
}
