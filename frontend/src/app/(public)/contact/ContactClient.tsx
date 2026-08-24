'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { Send, MapPin, Phone, Mail, Clock, Loader2, CheckCircle } from 'lucide-react'

const stores = [
  { name: 'Checkstar Berea', address: '123 Berea Road, Berea, Durban', phone: '(031) 201-1234', hours: 'Mon–Sat 7am–8pm, Sun 8am–6pm' },
  { name: 'Checkstar Umbilo', address: '45 Umbilo Road, Durban Central', phone: '(031) 202-5678', hours: 'Mon–Sat 7am–8pm, Sun 8am–6pm' },
  { name: 'Checkstar Phoenix', address: '78 Phoenix Highway, Phoenix, Durban', phone: '(031) 203-9012', hours: 'Mon–Sat 7am–8pm, Sun 8am–6pm' },
]

export default function ContactClient() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError('')
    setSuccess(false)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to send message.')
      setSuccess(true)
      setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch (err: any) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl font-bold mb-2">Contact Us</h1>
          <p className="text-gray-500 mb-12">We&apos;d love to hear from you. Get in touch with our team.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 rounded-xl p-8 text-center"
              >
                <CheckCircle size={40} className="text-green-600 mx-auto mb-3" />
                <h2 className="font-display text-xl font-bold text-green-800 mb-2">Message Sent!</h2>
                <p className="text-green-600 text-sm">We&apos;ll get back to you as soon as possible.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      id="name"
                      required
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    id="phone"
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    placeholder="(031) 000-0000"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <input
                    id="subject"
                    required
                    value={form.subject}
                    onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    placeholder="How can we help?"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
                    placeholder="Tell us more..."
                  />
                </div>
                {error && <p className="text-sm text-accent">{error}</p>}
                <motion.button
                  type="submit"
                  disabled={sending}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-60"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {sending ? 'Sending...' : 'Send Message'}
                </motion.button>
              </form>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="bg-gray-50 rounded-xl p-6 space-y-3">
              <h2 className="font-display text-lg font-semibold">Our Details</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-primary mt-0.5" />
                  <span className="text-gray-600">Durban, South Africa</span>
                </div>
                <div className="flex items-start gap-3">
                  <Phone size={16} className="text-primary mt-0.5" />
                  <span className="text-gray-600">(031) 000-0000</span>
                </div>
                <div className="flex items-start gap-3">
                  <Mail size={16} className="text-primary mt-0.5" />
                  <span className="text-gray-600">info@checkstar.co.za</span>
                </div>
                <div className="flex items-start gap-3">
                  <Clock size={16} className="text-primary mt-0.5" />
                  <span className="text-gray-600">Mon–Sat 7am–8pm<br />Sun 8am–6pm</span>
                </div>
              </div>
            </div>

            {stores.map(store => (
              <div key={store.name} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                <h3 className="font-display font-semibold mb-2">{store.name}</h3>
                <div className="space-y-1.5 text-sm text-gray-500">
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{store.address}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{store.phone}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{store.hours}</span>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </main>
    </>
  )
}
