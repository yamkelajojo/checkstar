'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Package, Bike, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { useOrder } from '@/lib/query'
import OrderTrackingMap from '@/components/OrderTrackingMap'
import { statusConfig } from '@/lib/motion/variants'
import { formatDateTime } from '@/lib/dates'
import { customerStatusLabel } from '@/lib/labels'

export default function TrackingClient({ id }: { id: string }) {
  const { data: order, isLoading, error } = useOrder(id)

  if (isLoading) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-20 text-center">
        <Loader2 size={32} className="animate-spin mx-auto text-primary" />
        <p className="text-sm text-gray-500 mt-3">Loading order tracking…</p>
      </main>
    )
  }

  if (error || !order) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-16">
        <div className="bg-accent/10 border border-accent/30 text-accent text-sm rounded-lg px-4 py-3">{(error as any)?.message || 'Order not found'}</div>
        <Link href="/account/orders" className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"><ArrowLeft size={14} /> Back to orders</Link>
      </main>
    )
  }

  const isPickup = (order.fulfilment_method ?? 'delivery') === 'pickup'
  const statusCfg = statusConfig[order.status] || statusConfig.pending
  const StatusIcon = statusCfg.icon

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <Link href={`/account/orders/${order.id}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-6">
        <ArrowLeft size={14} /> Back to order #{order.order_number}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">Tracking Order #{order.order_number}</h1>
          <p className="text-sm text-gray-400">{formatDateTime(order.created_at)} • {isPickup ? 'Pickup' : order.delivery_address}</p>
        </div>
        <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${statusCfg.bg} ${statusCfg.color} flex items-center gap-1.5`}>
          <StatusIcon size={14} /> {statusCfg.label}
        </span>
      </div>

      {isPickup ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <Package className="mx-auto text-amber-600 mb-2" size={28} />
          <p className="font-medium text-amber-800">Pickup order — no live tracking</p>
          <p className="text-sm text-amber-700 mt-1">Collect from {order.store?.name || 'store'} at {order.store?.address || 'store address'}</p>
        </div>
      ) : (
        <>
          <OrderTrackingMap
            orderId={order.id}
            orderStatus={order.status}
            storeName={order.store?.name || 'Store'}
            storeLat={order.store?.latitude != null ? Number(order.store.latitude) : undefined}
            storeLng={order.store?.longitude != null ? Number(order.store.longitude) : undefined}
            deliveryLat={order.delivery_latitude != null ? Number(order.delivery_latitude) : undefined}
            deliveryLng={order.delivery_longitude != null ? Number(order.delivery_longitude) : undefined}
            deliveryAddress={order.delivery_address}
            riderName={order.rider?.user?.name || null}
            height={520}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-2"><MapPin size={14} /> Store</div>
              <p className="font-medium">{order.store?.name || '—'}</p>
              <p className="text-sm text-gray-500">{order.store?.address || ''}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-2"><Bike size={14} /> Rider</div>
              {order.rider ? (
                <>
                  <p className="font-medium">{order.rider.user?.name || `Rider #${order.rider.id}`}</p>
                  <p className="text-sm text-gray-500">{order.rider.vehicle_type || 'Motorbike'} • ⭐ {Number(order.rider.average_rating || 0).toFixed(1)}</p>
                </>
              ) : (
                <p className="text-sm text-gray-400">Rider will be assigned shortly</p>
              )}
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-2"><Clock size={14} /> Status</div>
              <p className="font-medium">{customerStatusLabel(order.status)}</p>
              <p className="text-sm text-gray-500">{order.delivery_address || 'Delivery address'}</p>
              {order.status === 'delivered' && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle size={12} /> Delivered</p>}
              {order.status === 'cancelled' && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle size={12} /> Cancelled</p>}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-1">How live tracking works</h3>
            <ul className="text-xs text-blue-800 space-y-1 list-disc pl-4">
              <li>Rider location updates every 30 seconds while they have active deliveries (mobile app sends GPS).</li>
              <li>Customer map polls every 5 seconds for near real-time position.</li>
              <li>Stale detection: if no update for 90s, badge shows STALE and dot turns amber.</li>
              <li>Route polyline is fetched from OSRM when available, otherwise straight dashed line.</li>
              <li>Future: WebSocket via Laravel Reverb/Pusher can replace polling for instant push — API already ready.</li>
            </ul>
          </div>
        </>
      )}
    </main>
  )
}
