'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'motion/react'
import { Clock, Users, ChefHat, ArrowRight } from 'lucide-react'
import { useRecipes } from '@/lib/query'
import { fadeUp } from '@/lib/motion/variants'

export default function RecipesClient() {
  const { data: recipes = [], isLoading: loading, error } = useRecipes()
  const fetchError = error ? 'Failed to load recipes' : null
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const categories = [...new Set(recipes.map(r => r.category).filter(Boolean))] as string[]
  const filtered = activeCategory
    ? recipes.filter(r => r.category === activeCategory)
    : recipes

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl sm:text-4xl font-bold mb-2">Recipes</h1>
          <p className="text-gray-500 mb-8">Discover delicious recipes made with Checkstar ingredients.</p>
        </motion.div>

        {categories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-2 mb-8"
          >
            <button
              onClick={() => setActiveCategory(null)}
className={`px-3 py-1.5 rounded-full text-sm font-light transition-colors ${
                  activeCategory === null
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-normal transition-colors ${
                  activeCategory === cat
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>
        )}

        {fetchError ? (
          <div className="text-center py-16 text-red-500">
            <p className="text-lg font-medium">{fetchError}</p>
            <p className="text-sm mt-1">Please try again later.</p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-gray-50 rounded-xl h-80 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="text-center py-16 text-gray-400"
          >
            <ChefHat size={40} className="mx-auto mb-3 opacity-50" />
            <p className="text-lg">No recipes found</p>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filtered.map(recipe => (
              <motion.div key={recipe.id} variants={fadeUp}>
                <Link href={`/recipes/${recipe.slug}`} className="block group">
                  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
                      {recipe.image ? (
                        <Image
                          src={recipe.image}
                          alt={recipe.title}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                          <ChefHat size={48} />
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-display text-base sm:text-lg font-semibold group-hover:text-primary transition-colors mb-2">
                        {recipe.title}
                      </h3>
                      {recipe.description && (
                        <p className="text-sm text-gray-500 line-clamp-2 mb-4">{recipe.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        {recipe.prep_time && (
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            Prep {recipe.prep_time}min
                          </span>
                        )}
                        {recipe.cook_time && (
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            Cook {recipe.cook_time}min
                          </span>
                        )}
                        {recipe.servings && (
                          <span className="flex items-center gap-1">
                            <Users size={14} />
                            {recipe.servings} servings
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-1 text-sm font-medium text-primary">
                        View Recipe <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </>
  )
}
