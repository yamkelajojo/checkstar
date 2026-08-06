import { AlertCircle } from 'lucide-react'

export default function LocationFallbackNotice() {
  return (
    <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs rounded-lg px-3 py-2">
      <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
      <p>
        We couldn&apos;t pinpoint your location, so delivery will be routed from Durban central. Check your delivery
        address is correct before placing your order.
      </p>
    </div>
  )
}
