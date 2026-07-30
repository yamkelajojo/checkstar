import type { Metadata } from 'next'
import StoreDetailClient from './StoreDetailClient'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return { title: `${slug.replace(/-/g, ' ')} — Checkstar` }
}

export default async function StoreDetailPage({ params }: Props) {
  const { slug } = await params
  return <StoreDetailClient slug={slug} />
}
