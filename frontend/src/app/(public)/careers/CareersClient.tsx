'use client'

import { motion } from 'motion/react'
import { Briefcase, MapPin, Clock, Calendar, ArrowRight, Building } from 'lucide-react'
import { useCareers } from '@/lib/query'
import { fadeUp } from '@/lib/motion/variants'

export default function CareersClient() {
  const { data: listings = [], isLoading: loading, error } = useCareers()
  const fetchError = error ? "Couldn't load careers" : null

  const grouped: Record<string, (typeof listings)[number][]> = {}
  listings.forEach(l => {
    const dept = l.department || 'General'
    if (!grouped[dept]) grouped[dept] = []
    grouped[dept].push(l)
  })

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl sm:text-4xl font-bold mb-2">Careers</h1>
          <p className="text-gray-500 mb-8">Join the Checkstar team — view current job openings in Durban.</p>
        </motion.div>

        {fetchError ? (
          <div className="text-center py-16 text-red-500">
            <p className="text-lg font-medium">{fetchError}</p>
            <p className="text-sm mt-1">Give it another try in a moment.</p>
          </div>
        ) : loading ? (
          <div className="space-y-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-6 bg-gray-50 rounded w-1/4" />
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="h-32 bg-gray-50 rounded-xl animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Briefcase size={40} className="mx-auto mb-3 opacity-50" />
            <p className="text-lg">No openings right now</p>
            <p className="text-sm mt-1">Check back soon for new opportunities.</p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
            className="space-y-10"
          >
            {Object.entries(grouped).map(([department, deptListings]) => (
              <motion.div key={department} variants={fadeUp}>
                <h2 className="font-display text-base sm:text-xl font-bold mb-4 flex items-center gap-2">
                  <Building size={20} className="text-primary" />
                  {department}
                </h2>
                <div className="space-y-3">
                  {deptListings.map(listing => (
                    <div
                      key={listing.id}
                      className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-display text-base sm:text-lg font-semibold text-gray-900 mb-2">
                            {listing.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-3">
                            <span className="flex items-center gap-1">
                              <MapPin size={14} />
                              {listing.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Briefcase size={14} />
                              {listing.type}
                            </span>
                            {listing.closes_at && (
                              <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                Closes {new Date(listing.closes_at).toLocaleDateString('en-ZA')}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 leading-relaxed">{listing.description}</p>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors flex-shrink-0"
                          onClick={() => {
                            const body = `Hi, I'm interested in the ${listing.title} position at ${listing.location}.`
                            window.open(`mailto:careers@checkstar.co.za?subject=Application for ${listing.title}&body=${encodeURIComponent(body)}`)
                          }}
                        >
                          Apply <ArrowRight size={14} />
                        </motion.button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </>
  )
}
