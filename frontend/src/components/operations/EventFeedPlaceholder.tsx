'use client'

import { Stagger, StaggerItem } from '@/lib/motion'

export default function EventFeedPlaceholder() {
  return (
    <div className="rounded-xl bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Event Feed</span>
          <span className="text-[10px] text-gray-400">Live</span>
        </div>
      </div>

      <Stagger className="p-4 space-y-3" gap={0.04}>
        {Array.from({ length: 5 }).map((_, i) => (
          <StaggerItem key={i}>
            <div className="flex items-start gap-3">
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 bg-gray-100 rounded w-3/4" />
                <div className="h-2 bg-gray-50 rounded w-1/2" />
              </div>
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      <p className="text-[11px] text-gray-300 text-center pb-4">
        Events appear here once connected
      </p>
    </div>
  )
}
