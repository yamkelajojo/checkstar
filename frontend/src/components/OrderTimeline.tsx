'use client'

import { motion, useReducedMotion } from 'motion/react'
import { CheckCircle, Clock, Package, Truck, XCircle } from 'lucide-react'
import type { OrderStatus } from '@/types'
import { spring, ease } from '@/lib/motion/tokens'

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
  const shouldReduce = useReducedMotion()

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
      }}
      className="relative"
    >
      {steps.map((step, i) => {
        const isCompleted = i <= currentIdx && !isCancelled
        const isCurrent = i === currentIdx && !isCancelled
        const log = logs?.find(l => l.event_type === `status.${step.status}` || l.new_status === step.status)
        const Icon = step.icon

        return (
          <motion.div
            key={step.status}
            variants={{
              hidden: shouldReduce ? { opacity: 0 } : { opacity: 0, x: -12, filter: 'blur(4px)' },
              visible: {
                opacity: 1,
                x: 0,
                filter: 'blur(0px)',
                transition: { type: 'spring', ...spring.apple, delay: i * 0.04 },
              },
            }}
            className="flex items-start gap-3.5 pb-7 last:pb-0 group"
          >
            <div className="flex flex-col items-center">
              <motion.div
                initial={shouldReduce ? undefined : { scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', ...spring.appleBounce, delay: i * 0.04 + 0.1 }}
                className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm border transition-all duration-300 ${
                  isCompleted
                    ? 'bg-success text-white border-success shadow-[0_2px_8px_rgba(45,106,79,0.25)]'
                    : isCurrent
                      ? 'bg-primary text-white border-primary shadow-[0_2px_8px_rgba(235,101,34,0.3)] scale-[1.05]'
                      : 'bg-white text-gray-400 border-gray-200'
                }`}
              >
                {isCompleted ? <CheckCircle size={16} strokeWidth={2.5} /> : <Icon size={16} strokeWidth={isCurrent ? 2.5 : 2} />}
              </motion.div>
              {i < steps.length - 1 && (
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: i * 0.04 + 0.2, duration: 0.4, ease: ease.apple }}
                  className={`w-0.5 h-full mt-2 origin-top rounded-full ${isCompleted ? 'bg-success/60' : 'bg-gray-200'}`}
                  style={{ minHeight: '24px' }}
                />
              )}
            </div>
            <div className="pt-1.5 min-w-0 flex-1">
              <p className={`text-[14px] font-semibold tracking-tight transition-colors ${isCompleted ? 'text-gray-900' : isCurrent ? 'text-primary' : 'text-gray-400'}`}>
                {step.label}
              </p>
              {log && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 + 0.15 }}
                  className="text-[11px] text-gray-500 mt-1 tabular-nums"
                >
                  {new Date(log.created_at).toLocaleString()}
                </motion.p>
              )}
              {isCurrent && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                >
                  <span className="w-1 h-1 bg-primary rounded-full animate-pulse" />
                  Current
                </motion.div>
              )}
            </div>
          </motion.div>
        )
      })}

      {isCancelled && (
        <motion.div
          initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 8, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ type: 'spring', ...spring.apple }}
          className="flex items-start gap-3.5 pt-3"
        >
          <div className="w-9 h-9 rounded-full bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shadow-sm">
            <XCircle size={16} strokeWidth={2.5} />
          </div>
          <div className="pt-1.5">
            <p className="text-[14px] font-semibold text-red-600 tracking-tight">Cancelled</p>
            <p className="text-[11px] text-gray-500 mt-1">Order was cancelled</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
