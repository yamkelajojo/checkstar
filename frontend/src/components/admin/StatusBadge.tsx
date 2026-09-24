import type { Special } from '@/types'

/**
 * One badge pattern for all admin status pills (sales, banners).
 * A sale's status is derived from its data — the list never shows a
 * stale "Live" badge for a window that has passed.
 */

export type SaleStatus = 'live' | 'scheduled' | 'expired' | 'paused'

export function getSaleStatus(
  s: Pick<Special, 'is_active' | 'start_date' | 'end_date'>,
  now: Date = new Date()
): SaleStatus {
  if (s.is_active === false) return 'paused'
  if (new Date(s.start_date) > now) return 'scheduled'
  if (new Date(s.end_date) < now) return 'expired'
  return 'live'
}

const SALE_STATUS_META: Record<SaleStatus, { label: string; className: string; dot: string }> = {
  live: { label: 'Live', className: 'bg-success/10 text-success', dot: 'bg-success' },
  scheduled: { label: 'Scheduled', className: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  expired: { label: 'Expired', className: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
  paused: { label: 'Paused', className: 'bg-red-50 text-red-600', dot: 'bg-red-400' },
}

const BANNER_STATUS_META: Record<string, { label: string; className: string; dot: string }> = {
  published: { label: 'Published', className: 'bg-success/10 text-success', dot: 'bg-success' },
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
}

export function SaleStatusBadge({ special, now }: { special: Special; now?: Date }) {
  const status = getSaleStatus(special, now)
  const meta = SALE_STATUS_META[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${meta.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      {meta.label}
    </span>
  )
}

export function BannerStatusBadge({ status }: { status: string }) {
  const meta = BANNER_STATUS_META[status] ?? BANNER_STATUS_META.draft
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${meta.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      {meta.label}
    </span>
  )
}
