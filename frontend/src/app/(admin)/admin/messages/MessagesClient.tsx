'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'

function timeAgo(dateStr: string): string {
  const then = new Date(dateStr).getTime()
  if (Number.isNaN(then)) return ''
  const diffSec = Math.floor((Date.now() - then) / 1000)
  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return formatDayMonth(dateStr)
}
import { Inbox, Send, Loader2, AlertCircle, RefreshCw, MailOpen, Mail, MessageSquare, Lock } from 'lucide-react'
import { fadeUpTight as fadeUp, staggerTight as stagger } from '@/lib/motion/variants'
import { formatDayMonth } from '@/lib/dates'

interface ContactMessage {
  id: number
  name?: string
  email?: string
  subject?: string
  message?: string
  body?: string
  is_read?: boolean
  created_at: string
}

export default function MessagesClient() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [replyError, setReplyError] = useState<string | null>(null)

  // The inbox lives under /api/admin/* which is role:developer only — the UI
  // must not offer it to roles the backend would 403.
  const canView = user?.role === 'developer'

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['contact-messages'],
    queryFn: () => api.getMessages(),
    enabled: canView,
  })

  const markReadMutation = useMutation({
    meta: { silent: true }, // optimistic update reverts + toasts locally
    mutationFn: ({ id, read }: { id: number; read: boolean }) => api.markMessageRead(id, read),
    onMutate: async ({ id, read }) => {
      await queryClient.cancelQueries({ queryKey: ['contact-messages'] })
      const previous = queryClient.getQueryData(['contact-messages'])
      queryClient.setQueryData(['contact-messages'], (old: unknown) => {
        const payload = old as { data?: ContactMessage[] } | ContactMessage[] | undefined
        const list = Array.isArray(payload) ? payload : payload?.data
        if (!list) return old
        const next = list.map((m) => (m.id === id ? { ...m, is_read: read } : m))
        return Array.isArray(payload) ? next : { ...(payload as { data?: ContactMessage[] }), data: next }
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['contact-messages'], context?.previous)
      toast.error('Could not update message')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] })
      queryClient.invalidateQueries({ queryKey: ['admin-health'] })
    },
  })

  const replyMutation = useMutation({
    meta: { silent: true }, // inline error under the composer
    mutationFn: ({ id, body }: { id: number; body: string }) => api.replyToMessage(id, body),
    onSuccess: () => {
      setReplyBody('')
      setReplyError(null)
      toast.success('Reply sent')
    },
    onError: (err) => {
      setReplyError(err instanceof Error ? err.message : 'Could not send reply')
    },
  })

  if (!canView) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
          <Lock size={20} className="text-rose-500" />
        </div>
        <h1 className="text-xl font-semibold">Admin access only</h1>
        <p className="text-sm text-gray-500 mt-2">
          The customer inbox is limited to platform admins and store management.
        </p>
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mt-4">
          Go to Home
        </Link>
      </main>
    )
  }

  const payload = data as { data?: ContactMessage[] } | ContactMessage[] | undefined
  const messages: ContactMessage[] = Array.isArray(payload) ? payload : payload?.data ?? []
  const selected = messages.find((m) => m.id === selectedId) ?? null

  const openMessage = (m: ContactMessage) => {
    setSelectedId(m.id)
    setReplyBody('')
    setReplyError(null)
    if (!m.is_read) markReadMutation.mutate({ id: m.id, read: true })
  }

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    if (!replyBody.trim()) {
      setReplyError('Write a reply before sending')
      return
    }
    replyMutation.mutate({ id: selected.id, body: replyBody.trim() })
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <motion.div initial="hidden" animate="show" variants={stagger}>
        <motion.div variants={fadeUp} className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900 mb-1">Messages</h1>
            <p className="text-gray-500 text-sm">Customer enquiries sent through the contact page.</p>
          </div>
          <button
            onClick={() => refetch()}
            className="p-2 text-gray-400 hover:text-primary transition-colors"
            aria-label="Refresh messages"
          >
            <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </motion.div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="animate-pulse space-y-2">
                  <div className="h-3.5 w-40 bg-gray-100 rounded" />
                  <div className="h-3 w-full bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle size={18} className="text-accent shrink-0" />
            <p className="text-sm text-gray-600">{(error as Error).message}</p>
            <button onClick={() => refetch()} className="ml-auto text-primary text-sm font-medium hover:underline flex items-center gap-1">
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
            <Inbox size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="font-medium text-gray-500">Inbox zero</p>
            <p className="text-xs text-gray-400 mt-1">New customer messages will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => {
              const body = m.message ?? m.body ?? ''
              const expanded = selectedId === m.id
              return (
                <motion.div key={m.id} variants={fadeUp} layout>
                  <button
                    onClick={() => openMessage(m)}
                    className={`w-full text-left bg-white border rounded-xl p-4 transition-all ${expanded ? 'border-primary/40 shadow-sm' : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 shrink-0 ${m.is_read ? 'text-gray-300' : 'text-primary'}`}>
                        {m.is_read ? <MailOpen size={16} /> : <Mail size={16} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm truncate ${m.is_read ? 'text-gray-600' : 'font-semibold text-gray-900'}`}>
                            {m.name || 'Anonymous'}
                          </span>
                          <span className="text-xs text-gray-300">·</span>
                          <span className="text-xs text-gray-400 truncate">{m.email}</span>
                          <span className="text-[11px] text-gray-300 ml-auto shrink-0">
                            {timeAgo(m.created_at)}
                          </span>
                        </div>
                        {m.subject && <p className={`text-sm mt-0.5 ${m.is_read ? 'text-gray-500' : 'font-medium text-gray-800'}`}>{m.subject}</p>}
                        <p className={`text-sm text-gray-500 mt-1 ${expanded ? '' : 'line-clamp-2'}`}>{body}</p>
                      </div>
                    </div>
                  </button>

                  {expanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-gray-50/70 border border-t-0 border-gray-100 rounded-b-xl px-5 py-4 ml-0"
                      style={{ marginTop: -12, paddingTop: 20 }}
                    >
                      <form onSubmit={handleReply}>
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5 mb-2">
                          <MessageSquare size={12} /> Reply to {m.email}
                        </label>
                        <textarea
                          value={replyBody}
                          onChange={(e) => { setReplyBody(e.target.value); if (replyError) setReplyError(null) }}
                          rows={3}
                          placeholder="Write your reply…"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                        />
                        {replyError && (
                          <p className="mt-2 text-xs text-accent flex items-center gap-1.5">
                            <AlertCircle size={12} /> {replyError}
                          </p>
                        )}
                        <div className="flex items-center justify-end gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => markReadMutation.mutate({ id: m.id, read: !m.is_read })}
                            className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5"
                          >
                            Mark as {m.is_read ? 'unread' : 'read'}
                          </button>
                          <button
                            type="submit"
                            disabled={replyMutation.isPending}
                            className="inline-flex items-center gap-1.5 bg-primary text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
                          >
                            {replyMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                            Send reply
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>
    </main>
  )
}
