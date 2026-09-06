'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'motion/react'
import { Clock, Users, ChefHat, ChevronLeft, ListOrdered, Package } from 'lucide-react'
import { useRecipe, useAllProducts } from '@/lib/query'
import { findIngredientProduct } from '@/lib/ingredientMatch'
import SafeImage from '@/components/SafeImage'

export default function RecipeDetailClient({ slug }: { slug: string }) {
  const { data: recipe, isLoading: loading, error } = useRecipe(slug)
  const fetchError = error ? 'Failed to load recipe' : null
  const ingredients: string[] = recipe?.ingredients
    ? Array.isArray(recipe.ingredients)
      ? recipe.ingredients
      : typeof recipe.ingredients === 'string'
        ? (() => {
            try {
              const parsed = JSON.parse(recipe.ingredients)
              return Array.isArray(parsed) ? parsed : [recipe.ingredients]
            } catch {
              return recipe.ingredients.split('\n').filter(Boolean)
            }
          })()
        : []
    : []

  const methodSteps: string[] = typeof recipe?.method === 'string'
    ? recipe.method.split('\n').filter(Boolean)
    : Array.isArray(recipe?.method)
      ? recipe.method
      : []

  const { data: allProducts = [] } = useAllProducts()

  if (fetchError) {
    return (
      <>
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-red-500 text-lg font-medium">{fetchError}</p>
          <p className="text-sm text-gray-500 mt-1">Please try again later.</p>
          <Link href="/recipes" className="text-primary hover:underline mt-4 inline-block">Back to recipes</Link>
        </div>
      </>
    )
  }

  if (loading) {
    return (
      <>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-6 bg-gray-50 rounded w-1/4" />
            <div className="aspect-[2/1] bg-gray-50 rounded-xl" />
            <div className="h-10 bg-gray-50 rounded w-1/2" />
            <div className="h-4 bg-gray-50 rounded w-1/3" />
            <div className="h-40 bg-gray-50 rounded" />
          </div>
        </div>
      </>
    )
  }

  if (!recipe) {
    return (
      <>
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-500 text-lg">Recipe not found.</p>
          <Link href="/recipes" className="text-primary hover:underline mt-4 inline-block">Back to recipes</Link>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Link href="/recipes" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-8 transition-colors">
            <ChevronLeft size={16} />
            All Recipes
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative aspect-[2/1] rounded-xl overflow-hidden bg-gray-50 mb-8"
        >
          {recipe.image ? (
            <SafeImage src={recipe.image} alt={recipe.title} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
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
          <h1 className="font-display text-xl sm:text-3xl md:text-4xl font-bold mb-3">{recipe.title}</h1>

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
            <h2 className="font-display text-base sm:text-xl font-bold mb-4 flex items-center gap-2">
              <ListOrdered size={20} className="text-primary" />
              Ingredients
            </h2>
            {ingredients.length === 0 ? (
              <p className="text-sm text-gray-500">No ingredients listed.</p>
            ) : (
              <ul className="space-y-1">
                {ingredients.map((ing, idx) => {
                  const match = findIngredientProduct(ing, allProducts)
                  return (
                    <li
                      key={idx}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-gray-50"
                    >
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 flex-1 min-w-0 text-gray-700">
                        <span>{ing}</span>
                        {match && (
                          <Link
                            href={`/products/${match.slug}`}
                            aria-label={`View ${match.name} product page`}
                            className="inline-flex items-center gap-1.5 bg-primary/5 border border-primary/20 rounded-full pl-1 pr-2.5 py-0.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors flex-shrink-0 no-underline"
                          >
                            {match.image ? (
                              <SafeImage src={match.image} alt={match.name} width={20} height={20} className="rounded-full object-cover" />
                            ) : (
                              <Package size={12} className="flex-shrink-0" />
                            )}
                            <span className="truncate max-w-[80px]">{match.name}</span>
                            <span className="font-semibold">
                              R{(Number(match.effective_price ?? match.sale_price ?? match.price)).toFixed(2)}
                            </span>
                          </Link>
                        )}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3"
          >
            <h2 className="font-display text-base sm:text-xl font-bold mb-4 flex items-center gap-2">
              <ChefHat size={20} className="text-primary" />
              Method
            </h2>
            {methodSteps.length === 0 ? (
              <p className="text-sm text-gray-500">No method available.</p>
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
      </div>
    </>
  )
}
