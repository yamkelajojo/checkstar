import type { Metadata } from 'next'
import ProductDetailClient from './ProductDetailClient'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return { title: `${slug.replace(/-/g, ' ')} — Checkstar` }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  return <ProductDetailClient slug={slug} />
}
