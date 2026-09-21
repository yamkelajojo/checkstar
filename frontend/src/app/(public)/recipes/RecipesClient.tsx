'use client'

import { useState } from 'react'
import Link from 'next/link'
import SafeImage from '@/components/SafeImage'
import { motion, useReducedMotion, AnimatePresence } from 'motion/react'
import { Clock, Users, ChefHat, ArrowRight, Sparkles } from 'lucide-react'
import { useRecipes } from '@/lib/query'
import { spring, ease } from '@/lib/motion/tokens'

export default function RecipesClient() {
  const { data: recipes = [], isLoading: loading, error } = useRecipes()
  const fetchError = error ? "Couldn't load recipes" : null
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const shouldReduce = useReducedMotion()

  const categories = [...new Set(recipes.map(r => r.category).filter(Boolean))] as string[]
  const filtered = activeCategory
    ? recipes.filter(r => r.category === activeCategory)
    : recipes

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Focal moment — hero */}
        <motion.div
          initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.6, ease: ease.apple }}
          className="mb-10"
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center">
              <ChefHat size={16} className="text-primary" strokeWidth={2} />
            </div>
            <span className="text-[11px] font-semibold tracking-widest uppercase text-primary">South African Heritage</span>
          </div>
          <h1 className="font-display text-[28px] sm:text-[40px] font-bold tracking-tight leading-[1.05] mb-3">Recipes</h1>
          <p className="text-[15px] text-gray-500 leading-relaxed max-w-[60ch]">Discover authentic South African dishes and everyday favourites — all made with ingredients from your Checkstar pantry.</p>
        </motion.div>

        {categories.length > 0 && (
          <motion.div
            initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.1, duration: 0.4, ease: ease.apple }}
            className="flex flex-wrap gap-2 mb-8"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all shadow-sm border ${
                activeCategory === null
                  ? 'bg-gray-900 text-white border-gray-900 shadow-[0_2px_8px_rgba(0,0,0,0.15)]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              All
            </motion.button>
            {categories.map((cat, idx) => (
              <motion.button
                key={cat}
                initial={shouldReduce ? undefined : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.12 + idx * 0.03, type: 'spring', ...spring.snap }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all shadow-sm border capitalize ${
                  activeCategory === cat
                    ? 'bg-primary text-white border-primary shadow-[0_2px_8px_rgba(235,101,34,0.25)]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {cat}
              </motion.button>
            ))}
          </motion.div>
        )}

        {fetchError ? (
          <motion.div
            initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            className="text-center py-16 bg-white rounded-[16px] border border-gray-100 shadow-sm"
          >
            <p className="text-[15px] font-medium text-red-600">{fetchError}</p>
            <p className="text-[13px] mt-1 text-gray-500">Give it another try in a moment.</p>
          </motion.div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[16px] h-80 shimmer border border-gray-100" style={{ animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ type: 'spring', ...spring.apple }}
            className="text-center py-20 bg-white rounded-[16px] border border-gray-100 shadow-sm"
          >
            <div className="w-14 h-14 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
              <ChefHat size={22} className="text-gray-400" />
            </div>
            <p className="text-[15px] font-semibold">No recipes found</p>
            <p className="text-[13px] text-gray-500 mt-1">Try a different category</p>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.06, delayChildren: 0.12 } },
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filtered.map((recipe, idx) => (
              <motion.div
                key={recipe.id}
                variants={{
                  hidden: shouldReduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97, filter: 'blur(6px)' },
                  visible: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transition: { type: 'spring', ...spring.apple, delay: idx * 0.03 } },
                }}
                whileHover={shouldReduce ? undefined : { y: -6, scale: 1.01, transition: { type: 'spring', ...spring.snap } }}
                className="group"
              >
                <Link href={`/recipes/${recipe.slug}`} className="block">
                  <div className="bg-white rounded-[16px] border border-gray-100/80 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)] transition-all duration-500">
                    <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-50/50 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none z-10" />
                      {recipe.image ? (
                        <SafeImage
                          src={recipe.image}
                          alt={recipe.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-[1.06] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                          <ChefHat size={40} strokeWidth={1.5} />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 z-20 flex gap-1.5">
                        {recipe.is_featured && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-white/20 text-[10px] font-bold text-gray-900 shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
                            <Sparkles size={10} className="text-primary" /> Featured
                          </span>
                        )}
                        {recipe.category && (
                          <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] font-semibold tracking-wide capitalize border border-white/10">
                            {recipe.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-display text-[16px] sm:text-[17px] font-semibold leading-snug tracking-tight group-hover:text-primary transition-colors line-clamp-2">
                        {recipe.title}
                      </h3>
                      {recipe.description && (
                        <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2 mt-2 max-w-[55ch]">{recipe.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-3.5">
                        {recipe.prep_time && (
                          <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-100 px-2 py-1 rounded-full">
                            <Clock size={12} strokeWidth={2} /> {recipe.prep_time}m prep
                          </span>
                        )}
                        {recipe.cook_time && (
                          <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-100 px-2 py-1 rounded-full">
                            <Clock size={12} strokeWidth={2} /> {recipe.cook_time}m cook
                          </span>
                        )}
                        {recipe.servings && (
                          <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-100 px-2 py-1 rounded-full">
                            <Users size={12} strokeWidth={2} /> {recipe.servings}
                          </span>
                        )}
                      </div>
                      <div className="mt-4 flex items-center gap-1.5 text-[13px] font-semibold text-primary">
                        <span>View Recipe</span>
                        <motion.span initial={{ x: 0 }} whileHover={{ x: 3 }} className="inline-flex">
                          <ArrowRight size={14} strokeWidth={2.5} />
                        </motion.span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </>
  )
}
