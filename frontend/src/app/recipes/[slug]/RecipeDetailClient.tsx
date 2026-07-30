'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Clock, Users, ChefHat, ChevronLeft, Check, ListOrdered } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useRecipe } from '@/lib/query'

export default function RecipeDetailClient({ slug }: { slug: string }) {
  const { data: recipe, isLoading: loading, error } = useRecipe(slug)
  const fetchError = error ? 'Failed to load recipe' : null
  const [checked, setChecked] = useState<Set<number>>(new Set())

  const toggleIngredient = (idx: number) => {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  const ingredients: string[] = recipe?.ingredients
    ? Array.isArray(recipe.ingredients)
      ? recipe.ingredients
      : typeof recipe.ingredients === 'string'
        ? recipe.ingredients.split('\n').filter(Boolean)
        : []
    : []

  const methodSteps: string[] = typeof recipe?.method === 'string'
    ? recipe.method.split('\n').filter(Boolean)
    : Array.isArray(recipe?.method)
      ? recipe.method
      : []

  if (fetchError) {
    return (
      <>
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-red-500 text-lg font-medium">{fetchError}</p>
          <p className="text-sm text-gray-400 mt-1">Please try again later.</p>
          <Link href="/recipes" className="text-primary hover:underline mt-4 inline-block">Back to recipes</Link>
        </main>
        <Footer />
      </>
    )
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-16">
          <div className="animate-pulse space-y-6">
            <div className="h-6 bg-gray-50 rounded w-1/4" />
            <div className="aspect-[2/1] bg-gray-50 rounded-xl" />
            <div className="h-10 bg-gray-50 rounded w-1/2" />
            <div className="h-4 bg-gray-50 rounded w-1/3" />
            <div className="h-40 bg-gray-50 rounded" />
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (!recipe) {
    return (
      <>
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-400 text-lg">Recipe not found.</p>
          <Link href="/recipes" className="text-primary hover:underline mt-4 inline-block">Back to recipes</Link>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Link href="/recipes" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary mb-8 transition-colors">
            <ChevronLeft size={16} />
            All Recipes
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="aspect-[2/1] rounded-xl overflow-hidden bg-gray-50 mb-8"
        >
          {recipe.image ? (
            <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-200">
              <ChefHat size={64} />
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">{recipe.title}</h1>

          {recipe.description && (
            <p className="text-gray-500 leading-relaxed mb-6">{recipe.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8">
            {recipe.prep_time && (
              <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
                <Clock size={16} className="text-primary" />
                Prep: {recipe.prep_time} min
              </span>
            )}
            {recipe.cook_time && (
              <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
                <Clock size={16} className="text-primary" />
                Cook: {recipe.cook_time} min
              </span>
            )}
            {recipe.servings && (
              <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
                <Users size={16} className="text-primary" />
                Serves {recipe.servings}
              </span>
            )}
            {recipe.category && (
              <span className="flex items-center gap-1.5 bg-primary-light text-primary px-3 py-1.5 rounded-full text-xs font-medium">
                {recipe.category}
              </span>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
              <ListOrdered size={20} className="text-primary" />
              Ingredients
            </h2>
            {ingredients.length === 0 ? (
              <p className="text-sm text-gray-400">No ingredients listed.</p>
            ) : (
              <ul className="space-y-1">
                {ingredients.map((ing, idx) => (
                  <li key={idx}>
                    <button
                      onClick={() => toggleIngredient(idx)}
                      className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        checked.has(idx)
                          ? 'bg-green-50 text-green-700 line-through'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        checked.has(idx) ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                      }`}>
                        {checked.has(idx) && <Check size={12} />}
                      </span>
                      {ing}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3"
          >
            <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
              <ChefHat size={20} className="text-primary" />
              Method
            </h2>
            {methodSteps.length === 0 ? (
              <p className="text-sm text-gray-400">No method available.</p>
            ) : (
              <ol className="space-y-4">
                {methodSteps.map((step, idx) => (
                  <li key={idx} className="flex gap-4">
                    <span className="w-7 h-7 rounded-full bg-primary-light text-primary text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-gray-600 leading-relaxed">{step}</p>
                  </li>
                ))}
              </ol>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  )
}
