'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import SafeImage from '@/components/SafeImage'
import { Heart, Calendar } from 'lucide-react'
import { useCommunityPosts } from '@/lib/query'
import { fadeUp } from '@/lib/motion/variants'

const tabs = [
  { value: null, label: 'All' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'csr', label: 'CSR' },
]

export default function CommunityClient() {
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const { data: posts = [], isLoading: loading, error } = useCommunityPosts(activeTab || undefined)
  const fetchError = error ? "Couldn't load posts" : null

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-8 min-h-[60vh]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl sm:text-4xl font-bold mb-2">Community</h1>
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
              onClick={() => setActiveTab(tab.value)}
className={`px-4 py-2 rounded-lg text-sm font-light transition-colors ${
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
        ) : fetchError ? (
          <div className="text-center py-16 text-gray-500">
            <Heart size={40} className="mx-auto mb-3 opacity-50" />
            <p className="text-lg">{fetchError}</p>
            <p className="text-sm mt-1">Give it another try in a moment.</p>
          </div>
        ) : posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="text-center py-16 text-gray-500"
          >
            <Heart size={40} className="mx-auto mb-3 opacity-50" />
            <p className="text-lg">No posts yet</p>
            <p className="text-sm mt-1">Check back soon for updates.</p>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          >
            {(activeTab === null || activeTab === 'gallery') && (
              <div className={`${activeTab === null ? 'mb-8' : ''} columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4`}>
                {posts.filter(p => p.category === 'gallery').map(post => (
                  <motion.div
                    key={post.id}
                    variants={fadeUp}
                    className="break-inside-avoid bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm"
                  >
                    {post.image && (
                      <div className="relative w-full aspect-[4/3]">
                        <SafeImage src={post.image} alt={post.title} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover" />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs bg-primary-light text-primary px-2 py-0.5 rounded-full font-medium">
                          Gallery
                        </span>
                        {post.event_date && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
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
            )}
            {(activeTab === null || activeTab === 'csr') && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.filter(p => p.category === 'csr').map(post => (
                  <motion.div key={post.id} variants={fadeUp} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                    {post.image && (
                      <div className="relative aspect-video overflow-hidden">
                        <SafeImage src={post.image} alt={post.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs bg-primary-light text-primary px-2 py-0.5 rounded-full font-medium">
                          CSR
                        </span>
                        {post.event_date && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
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
      </div>
    </>
  )
}
