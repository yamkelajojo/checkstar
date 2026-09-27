import { AlertCircle, Loader2 } from 'lucide-react'

/**
 * The storefront's one error notice.
 *
 * Three lines of information, in order: what failed, why (only if something
 * actually told us), and what the person can do. `role="alert"` so a screen
 * reader announces it instead of leaving a silent hole where the content was.
 *
 * Replaces the family of inline `bg-accent/10 border-accent/30 text-accent`
 * divs — eight of them, some with a retry button and some without, none
 * announced.
 */
interface ErrorNoticeProps {
  /** What failed, in the person's words: "We couldn't load your orders". */
  title?: string
  /** Why, when the API said: an ApiError message or reason. */
  message?: string | null
  /** Pass the query error straight in; its message is used when there is one. */
  error?: unknown
  /** Present = a retry is offered. Absent = the notice is informational. */
  onRetry?: () => void
  /** A retry is in flight: the button disables and says so. */
  retrying?: boolean
  /** Inline form for narrow slots. */
  compact?: boolean
}

function detailFrom(error: unknown): string {
  if (typeof error === 'string') return error.trim()
  if (error instanceof Error) return error.message.trim()
  return ''
}

export default function ErrorNotice({
  title,
  message,
  error,
  onRetry,
  retrying = false,
  compact = false,
}: ErrorNoticeProps) {
  const heading = title?.trim() || 'Something went wrong'
  // Only claim a reason we actually have; otherwise say what to do instead.
  const detail = message?.trim() || detailFrom(error) || 'Please try again in a moment.'

  return (
    <div
      role="alert"
      className={`${compact ? 'px-4 py-3' : 'p-6'} bg-accent/5 border border-accent/20 rounded-2xl flex items-start gap-3`}
    >
      <AlertCircle size={compact ? 16 : 20} aria-hidden="true" className="text-accent shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-gray-800 ${compact ? 'text-sm' : 'text-[15px]'}`}>{heading}</p>
        <p className="text-sm text-gray-500 mt-0.5">{detail}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline disabled:opacity-60 disabled:no-underline"
          >
            {retrying ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : null}
            {retrying ? 'Trying again…' : 'Try again'}
          </button>
        ) : null}
      </div>
    </div>
  )
}
