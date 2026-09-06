'use client'

import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api'
import { Toaster } from 'sonner'

/**
 * Global safety net for mutations: surfaces every unhandled mutation failure as
 * a toast. Screens that need richer error UI (inline banners, retry buttons)
 * handle onError themselves — those handlers win because they run first and can
 * swallow by returning normally; this fallback still fires, so screens that DO
 * handle errors should set `meta: { silent: true }` on the mutation to opt out.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 10,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        if (mutation.meta?.silent) return
        const message =
          error instanceof ApiError ? error.message :
          error instanceof Error ? error.message :
          'Something went wrong — please try again'
        toast.error(message)
      },
    }),
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors closeButton />
      {children}
    </QueryClientProvider>
  )
}
