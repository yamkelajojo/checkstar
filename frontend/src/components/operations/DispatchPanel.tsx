'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from '@/lib/motion'
import { spring } from '@/lib/motion/tokens'
import { X, Navigation, Clock, User, ChevronRight } from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { formatZar } from '@/lib/money'

interface Rider {
  id: number
  name: string
  distance_meters: number
  eta_seconds: number
  latitude: number
  longitude: number
}

interface Order {
  id: number
  order_number: string
  status: string
  total: number
  delivery_address: string
}

interface DispatchSuggestion {
  order: Order
  nearest_rider: Rider | null
  alternative_riders: Rider[]
}

interface DispatchPanelProps {
  orderId: number | null
  onClose: () => void
  onAssigned?: () => void
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters}m`
  return `${(meters / 1000).toFixed(1)}km`
}

function formatEta(seconds: number): string {
  const mins = Math.ceil(seconds / 60)
  return `${mins} min`
}

export default function DispatchPanel({ orderId, onClose, onAssigned }: DispatchPanelProps) {
  const [suggestion, setSuggestion] = useState<DispatchSuggestion | null>(null)
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Monotonic request id: switching orders quickly must never let a stale
  // response overwrite the suggestion for the currently open order.
  const requestSeq = useRef(0)

  const fetchSuggestion = useCallback(async () => {
    if (!orderId) return
    const seq = ++requestSeq.current
    setLoading(true)
    setError(null)
    try {
      const data = await api.getDispatchSuggestion(orderId) as unknown as DispatchSuggestion
      if (seq !== requestSeq.current) return // superseded by a newer selection
      setSuggestion(data)
    } catch {
      if (seq !== requestSeq.current) return
      setError('Could not load rider suggestions')
    } finally {
      if (seq === requestSeq.current) setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    if (orderId) fetchSuggestion()
    else setSuggestion(null)
  }, [orderId, fetchSuggestion])

  const handleAssign = async (riderId: number) => {
    if (!orderId) return
    setAssigning(true)
    setError(null)
    try {
      await api.assignRider(orderId, riderId)
      onAssigned?.()
      onClose()
    } catch (e) {
      const msg = e instanceof ApiError ? (e.payload as { error?: string })?.error || e.message : e instanceof Error ? e.message : 'Assignment failed'
      setError(msg)
    } finally {
      setAssigning(false)
    }
  }

  return (
    <AnimatePresence>
      {orderId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', ...spring.snap }}
            className="fixed right-0 top-0 bottom-0 w-[380px] max-w-[90vw] bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Dispatch</h2>
                {suggestion?.order && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Order {suggestion.order.order_number} — {formatZar(suggestion.order.total)}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Close dispatch suggestions"
                title="Close"
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {loading && (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse rounded-xl bg-gray-50 p-4 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                      <div className="h-2 bg-gray-100 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-xs text-rose-600">
                  {error}
                </div>
              )}

              {suggestion && !loading && (
                <>
                  {/* Nearest Rider */}
                  {suggestion.nearest_rider ? (
                    <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-full bg-[#F58220] flex items-center justify-center">
                          <Navigation size={13} className="text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-900">Nearest Rider</p>
                          <p className="text-[10px] text-gray-400">{suggestion.nearest_rider.name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Navigation size={11} />
                          {formatDistance(suggestion.nearest_rider.distance_meters)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {formatEta(suggestion.nearest_rider.eta_seconds)}
                        </span>
                      </div>

                      <button
                        onClick={() => handleAssign(suggestion.nearest_rider!.id)}
                        disabled={assigning}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#F58220] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#E07018] transition-colors disabled:opacity-50"
                      >
                        {assigning ? (
                          <span className="animate-pulse">Assigning...</span>
                        ) : (
                          <>
                            <User size={13} />
                            ASSIGN RIDER
                            <ChevronRight size={13} />
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-600">
                      No available riders found for this order.
                    </div>
                  )}

                  {/* Alternative Riders */}
                  {suggestion.alternative_riders.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                        Alternative Riders
                      </p>
                      <div className="space-y-2">
                        {suggestion.alternative_riders.map(rider => (
                          <div
                            key={rider.id}
                            className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-100 px-4 py-3"
                          >
                            <div>
                              <p className="text-xs font-medium text-gray-700">{rider.name}</p>
                              <div className="flex items-center gap-3 mt-0.5 text-[10px] text-gray-400">
                                <span>{formatDistance(rider.distance_meters)}</span>
                                <span>{formatEta(rider.eta_seconds)}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleAssign(rider.id)}
                              disabled={assigning}
                              className="text-[10px] font-semibold text-[#F58220] hover:text-[#E07018] disabled:opacity-50"
                            >
                              ASSIGN
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
