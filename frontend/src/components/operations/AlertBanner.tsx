'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from '@/lib/motion'
import { AlertTriangle, X, Clock, User } from 'lucide-react'

interface Alert {
  id: string
  type: 'order_pending' | 'rider_idle' | 'delivery_slow'
  severity: 'warning' | 'info'
  message: string
  created_at: Date
}

const ALERT_ICONS = {
  order_pending: Clock,
  rider_idle: User,
  delivery_slow: AlertTriangle,
}

export default function AlertBanner() {
  const [alerts, setAlerts] = useState<Alert[]>([])

  const checkAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/operations/metrics', { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()

      const newAlerts: Alert[] = []

      if (data.pending_orders > 3) {
        newAlerts.push({
          id: 'high-pending',
          type: 'order_pending',
          severity: 'warning',
          message: `${data.pending_orders} orders pending — may need attention`,
          created_at: new Date(),
        })
      }

      if (data.active_riders === 0 && data.pending_orders > 0) {
        newAlerts.push({
          id: 'no-riders',
          type: 'rider_idle',
          severity: 'warning',
          message: 'No riders available — orders cannot be dispatched',
          created_at: new Date(),
        })
      }

      setAlerts(newAlerts)
    } catch {
      // Silent fail
    }
  }, [])

  useEffect(() => {
    checkAlerts()
    const interval = setInterval(checkAlerts, 30000)
    return () => clearInterval(interval)
  }, [checkAlerts])

  const dismiss = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
      <AnimatePresence>
        {alerts.map(alert => {
          const Icon = ALERT_ICONS[alert.type]
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`pointer-events-auto flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg border ${
                alert.severity === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-sky-50 border-sky-200 text-sky-800'
              }`}
            >
              <Icon size={15} className="shrink-0" />
              <p className="text-xs font-medium flex-1">{alert.message}</p>
              <button
                onClick={() => dismiss(alert.id)}
                className="p-0.5 rounded hover:bg-black/5 transition-colors shrink-0"
              >
                <X size={13} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
