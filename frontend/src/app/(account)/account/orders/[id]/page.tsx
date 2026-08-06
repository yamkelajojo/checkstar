import type { Metadata } from 'next'
import OrderDetailClient from './OrderDetailClient'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return { title: `Order #${id} — Checkstar` }
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  return <OrderDetailClient id={id} />
}
