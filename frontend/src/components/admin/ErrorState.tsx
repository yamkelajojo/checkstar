/**
 * Standard error state: what failed + a retry. Replaces per-screen
 * hand-rolled error banners so every failed fetch reads the same.
 */
import { AlertCircle, RotateCw } from 'lucide-react'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 flex items-center gap-3" role="alert">
      <AlertCircle size={16} className="text-accent shrink-0" />
      <span className="text-sm text-gray-700 flex-1">{message || 'Something went wrong loading this data.'}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-sm font-medium text-primary hover:underline flex items-center gap-1.5 shrink-0"
        >
          <RotateCw size={13} /> Retry
        </button>
      )}
    </div>
  )
}
