import TrackingClient from './TrackingClient'

export const metadata = { title: 'Order Tracking — Checkstar' }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TrackingClient id={id} />
}
