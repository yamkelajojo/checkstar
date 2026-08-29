'use client'

import { Stagger, StaggerItem } from '@/lib/motion'
import { CountUp } from './CountUp'

interface Metrics {
  active_riders: number
  total_riders: number
  orders_this_hour: number
  pending_orders: number
  active_deliveries: number
  delivered_today: number
}

interface MetricsHudProps {
  metrics: Metrics | null
  loading: boolean
}

const cards = [
  { key: 'active', label: 'Active Fleet', get: (m: Metrics) => m.active_riders, sub: (m: Metrics) => `of ${m.total_riders}`, color: '#16A34A' },
  { key: 'hour', label: 'Orders / Hr', get: (m: Metrics) => m.orders_this_hour, sub: () => 'this hour', color: '#F58220' },
  { key: 'pending', label: 'Pending', get: (m: Metrics) => m.pending_orders, sub: () => 'awaiting dispatch', color: '#CA8A04' },
  { key: 'deliveries', label: 'Active Deliveries', get: (m: Metrics) => m.active_deliveries, sub: () => 'in transit', color: '#2563EB' },
  { key: 'delivered', label: 'Delivered Today', get: (m: Metrics) => m.delivered_today, sub: () => '', color: '#7C3AED' },
]

export default function MetricsHud({ metrics, loading }: MetricsHudProps) {
  return (
    <Stagger className="space-y-2" gap={0.03}>
      {cards.map(card => (
        <StaggerItem key={card.key}>
          <div className="rounded-xl px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm">
            <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">
              {card.label}
            </div>
            {loading ? (
              <div className="h-7 w-14 rounded bg-gray-100 animate-pulse" />
            ) : (
              <div className="flex items-baseline gap-2">
                <CountUp value={metrics ? card.get(metrics) : 0} color={card.color} />
                {metrics && card.sub(metrics) && (
                  <span className="text-[10px] text-gray-400">{card.sub(metrics!)}</span>
                )}
              </div>
            )}
          </div>
        </StaggerItem>
      ))}
    </Stagger>
  )
}
