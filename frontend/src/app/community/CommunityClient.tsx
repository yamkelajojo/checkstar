'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Image, Heart, Calendar } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { api } from '@/lib/api'
import type { CommunityPost } from '@/types'

const tabs = [
  { value: null, label: 'All' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'csr', label: 'CSR' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function CommunityClient() {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string | null>(null)

  useEffect(() => {
    api.getCommunityPosts(activeTab || undefined)
      .then(res => setPosts(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [activeTab])

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl font-bold mb-2">Community</h1>
          <p className="text-gray-500 mb-8">See how Checkstar connects with the community.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 mb-8"
        >
          {tabs.map(tab => (
            <button
              key={tab.label}
              onClick={() => {
                setActiveTab(tab.value)
                setLoading(true)
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-gray-50 rounded-xl h-72 animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Heart size={40} className="mx-auto mb-3 opacity-50" />
            <p className="text-lg">No posts yet</p>
            <p className="text-sm mt-1">Check back soon for updates.</p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          >
            {activeTab === 'gallery' || (activeTab === null && posts.some(p => p.category === 'gallery')) ? (
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                {(activeTab ? posts : posts.filter(p => p.category === 'gallery')).map(post => (
                  <motion.div
                    key={post.id}
                    variants={fadeUp}
                    className="break-inside-avoid bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm"
                  >
                    {post.image && (
                      <img src={post.image} alt={post.title} className="w-full object-cover" />
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs bg-primary-light text-primary px-2 py-0.5 rounded-full font-medium">
                          Gallery
                        </span>
                        {post.event_date && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(post.event_date).toLocaleDateString('en-ZA')}
                          </span>
                        )}
                      </div>
                      <h3 className="font-medium text-sm">{post.title}</h3>
                      {post.content && <p className="text-xs text-gray-500 mt-1">{post.content}</p>}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(activeTab ? posts : posts.filter(p => p.category === 'csr')).map(post => (
                  <motion.div key={post.id} variants={fadeUp} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                    {post.image && (
                      <div className="aspect-video overflow-hidden">
                        <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs bg-primary-light text-primary px-2 py-0.5 rounded-full font-medium">
                          CSR
                        </span>
                        {post.event_date && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(post.event_date).toLocaleDateString('en-ZA')}
                          </span>
                        )}
                      </div>
                      <h3 className="font-display font-semibold mb-1">{post.title}</h3>
                      {post.content && (
                        <p className="text-sm text-gray-500 leading-relaxed">{post.content}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </main>
      <Footer />
    </>
  )
}
