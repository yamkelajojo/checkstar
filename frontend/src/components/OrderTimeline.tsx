'use client'

import { motion } from 'motion/react'
import { CheckCircle, Circle, Clock, Package, Truck, XCircle } from 'lucide-react'
import type { OrderStatus } from '@/types'

interface TimelineStep {
  status: OrderStatus
  label: string
  icon: typeof CheckCircle
  date?: string
}

const steps: TimelineStep[] = [
  { status: 'pending', label: 'Order Placed', icon: Clock },
  { status: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { status: 'preparing', label: 'Preparing', icon: Package },
  { status: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: CheckCircle },
]

interface Props {
  currentStatus: OrderStatus
  logs?: { event_type: string; created_at: string; new_status: string | null }[]
}

const statusOrder: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']

export default function OrderTimeline({ currentStatus, logs }: Props) {
  const currentIdx = statusOrder.indexOf(currentStatus)
  const isCancelled = currentStatus === 'cancelled'

  return (
    <div className="relative">
      {steps.map((step, i) => {
        const isCompleted = i <= currentIdx && !isCancelled
        const isCurrent = i === currentIdx && !isCancelled
        const log = logs?.find(l => l.event_type === `status.${step.status}` || l.new_status === step.status)
        const Icon = step.icon

        return (
          <motion.div
            key={step.status}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-3 pb-6 last:pb-0"
          >
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? 'bg-success text-white' : isCurrent ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                {isCompleted ? <CheckCircle size={16} /> : <Icon size={16} />}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-0.5 h-full mt-1 ${isCompleted ? 'bg-success' : 'bg-gray-200'}`} />
              )}
            </div>
            <div className="pt-1">
              <p className={`text-sm font-medium ${isCompleted ? 'text-gray-900' : isCurrent ? 'text-primary' : 'text-gray-400'}`}>
                {step.label}
              </p>
              {log && <p className="text-xs text-gray-400 mt-0.5">{new Date(log.created_at).toLocaleString()}</p>}
            </div>
          </motion.div>
        )
      })}

      {isCancelled && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-start gap-3 pt-2"
        >
          <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center">
            <XCircle size={16} />
          </div>
          <div className="pt-1">
            <p className="text-sm font-medium text-accent">Cancelled</p>
          </div>
        </motion.div>
      )}
    </div>
  )
}
