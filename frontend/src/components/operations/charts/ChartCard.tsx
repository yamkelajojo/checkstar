'use client'

import type { ReactNode } from 'react'

interface ChartCardProps {
  title: string
  loading?: boolean
  hasData: boolean
  emptyMessage?: string
  children: ReactNode
}

export default function ChartCard({
  title,
  loading = false,
  hasData,
  emptyMessage = 'No data available',
  children,
}: ChartCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="text-xs font-semibold text-gray-500 mb-3">{title}</h3>
      {loading ? (
        <div className="h-[220px] bg-gray-50 rounded animate-pulse" />
      ) : hasData ? (
        <div className="h-[220px]">{children}</div>
      ) : (
        <div className="h-[220px] flex items-center justify-center text-xs text-gray-400">
          {emptyMessage}
        </div>
      )}
    </div>
  )
}
