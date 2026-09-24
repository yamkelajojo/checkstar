/**
 * Standard empty state: icon, one line of what's missing, one line of what
 * to do, optional action button. Replaces the N slightly different
 * "No X" divs across admin screens.
 */
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  hint?: string
  action?: React.ReactNode
}

export default function EmptyState({ icon: Icon, title, hint, action }: EmptyStateProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
      {Icon && (
        <div className="w-11 h-11 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-3">
          <Icon size={18} className="text-gray-400" />
        </div>
      )}
      <p className="text-sm font-medium text-gray-700">{title}</p>
      {hint && <p className="text-sm text-gray-500 mt-1">{hint}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}
