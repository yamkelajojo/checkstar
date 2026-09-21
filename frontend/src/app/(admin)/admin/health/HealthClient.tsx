'use client'

import { useAdminHealth } from '@/lib/query'
import { useAuthStore } from '@/stores/auth-store'
import { Loader2, CheckCircle, Server, Clock, Code } from 'lucide-react'

export default function HealthClient() {
  const { user } = useAuthStore()
  const canView = user?.role === 'developer'
  const { data, isLoading, error, refetch } = useAdminHealth()

  if (!canView) return <div className="max-w-3xl mx-auto p-8"><p className="text-red-600">Forbidden — developer only.</p></div>
  if (isLoading) return <div className="max-w-3xl mx-auto p-8 flex items-center gap-2"><Loader2 className="animate-spin" /> Checking health…</div>
  if (error) return <div className="max-w-3xl mx-auto p-8"><p className="text-red-600">Failed: {(error as any).message}</p><button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg">Retry</button></div>

  const h = data as any

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3"><Server className="text-primary" /><h1 className="text-2xl font-bold">System Health</h1></div>
      <div className="bg-white border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-green-600"><CheckCircle size={20} /><span className="font-semibold">{h?.status || 'unknown'}</span></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2"><Clock size={16} className="text-gray-400" /><span className="text-gray-500">Timestamp:</span><span className="font-mono">{h?.timestamp || '—'}</span></div>
          <div className="flex items-center gap-2"><Code size={16} className="text-gray-400" /><span className="text-gray-500">PHP:</span><span className="font-mono">{h?.php_version || '—'}</span></div>
          <div className="flex items-center gap-2"><Code size={16} className="text-gray-400" /><span className="text-gray-500">Laravel:</span><span className="font-mono">{h?.laravel_version || '—'}</span></div>
        </div>
        <pre className="bg-gray-50 border rounded-lg p-4 text-xs overflow-auto">{JSON.stringify(h, null, 2)}</pre>
        <button onClick={() => refetch()} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Refresh</button>
      </div>
    </div>
  )
}
