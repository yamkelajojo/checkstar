'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { Mail, Loader2, AlertCircle, CheckCircle, MessageSquare } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { api } from '@/lib/api'

interface Message {
  id: number
  name?: string
  email?: string
  subject?: string
  message?: string
  body?: string
  is_read?: boolean
  reply_body?: string | null
  replied_at?: string | null
  created_at: string
  user?: { name: string; email: string }
}

export default function MessagesClient() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, user, checkAuth } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [replyBody, setReplyBody] = useState<Record<number, string>>({})
  const [replying, setReplying] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login')
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false
    setLoading(true)
    api.getMessages()
      .then((res: unknown) => {
        if (cancelled) return
        const list = Array.isArray(res) ? res : (res as { data: Message[] }).data ?? []
        setMessages(list)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [isAuthenticated])

  if (authLoading || loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Loader2 size={32} className="animate-spin mx-auto text-primary" />
      </main>
    )
  }

  if (user?.role !== 'developer') {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertCircle size={32} className="mx-auto text-accent mb-4" />
        <h1 className="text-xl font-semibold">Developer only</h1>
        <p className="text-sm text-gray-500 mt-2">Contact messages inbox requires developer role.</p>
      </main>
    )
  }

  const handleReply = async (id: number) => {
    const body = replyBody[id]?.trim()
    if (!body) {
      setFeedback({ type: 'error', text: 'Reply body required' })
      return
    }
    setReplying(id)
    setFeedback(null)
    try {
      await api.replyToMessage(id, body)
      setMessages(msgs => msgs.map(m => m.id === id ? { ...m, reply_body: body, replied_at: new Date().toISOString(), is_read: true } : m))
      setFeedback({ type: 'success', text: `Replied to #${id}` })
      setReplyBody(s => ({ ...s, [id]: '' }))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Reply failed'
      setFeedback({ type: 'error', text: msg })
    } finally {
      setReplying(null)
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-2"><Mail size={24} /> Contact Messages</h1>
        <p className="text-gray-500 text-sm mb-6">Inbox · click to mark read · reply persists <code className="bg-gray-100 px-1 rounded">reply_body</code> + <code className="bg-gray-100 px-1 rounded">replied_at</code></p>

        {error && <div className="bg-accent/10 border border-accent/20 text-accent text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
        {feedback && <div className={`mb-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${feedback.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-accent/10 border border-accent/20 text-accent'}`}>{feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />} {feedback.text}</div>}

        {messages.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-100 rounded-xl">
            <MessageSquare size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map(m => (
              <div key={m.id} className={`bg-white border rounded-xl p-5 ${m.is_read ? 'border-gray-100' : 'border-primary/30 bg-primary/5'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{m.subject ?? m.name ?? `Message #${m.id}`}</p>
                    <p className="text-xs text-gray-400">{m.email ?? m.user?.email ?? '—'} · {new Date(m.created_at).toLocaleString('en-ZA')}</p>
                    <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">{m.message ?? m.body ?? ''}</p>
                    {m.reply_body && (
                      <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-xs font-medium text-green-800">Reply {m.replied_at ? `· ${new Date(m.replied_at).toLocaleString('en-ZA')}` : ''}</p>
                        <p className="text-sm text-green-900 mt-1 whitespace-pre-wrap">{m.reply_body}</p>
                      </div>
                    )}
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${m.is_read ? 'bg-gray-100 text-gray-500' : 'bg-primary text-white'}`}>{m.is_read ? 'Read' : 'Unread'}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <input value={replyBody[m.id] ?? ''} onChange={e => setReplyBody(s => ({ ...s, [m.id]: e.target.value }))} placeholder={m.reply_body ? 'Update reply…' : 'Write a reply…'} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" />
                  <button onClick={() => handleReply(m.id)} disabled={replying === m.id} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50 flex items-center gap-1.5">
                    {replying === m.id ? <Loader2 size={14} className="animate-spin" /> : null} Reply
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </main>
  )
}
