'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { Clock, Users, ChefHat, ChevronLeft, ListOrdered, Package, Check, ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import { useRecipe, useAllProducts } from '@/lib/query'
import { findIngredientProduct } from '@/lib/ingredientMatch'
import SafeImage from '@/components/SafeImage'
import type { Product } from '@/types'
import { useCartStore } from '@/stores/cart-store'
import { emitCartAdded } from '@/lib/cart-events'
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverContent,
  PopoverFooter,
} from '@/components/ui/popover'
import { spring, ease } from '@/lib/motion/tokens'
import { formatZar } from '@/lib/money'

export default function RecipeDetailClient({ slug }: { slug: string }) {
  const { data: recipe, isLoading: loading, error } = useRecipe(slug)
  const fetchError = error ? "Couldn't load recipe" : null
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
  const shouldReduce = useReducedMotion()

  if (fetchError) {
    return (
      <motion.div initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-card border border-red-100 p-8 shadow-sm">
          <p className="text-red-600 text-[15px] font-semibold">{fetchError}</p>
          <p className="text-[13px] text-gray-500 mt-1">Give it another try in a moment.</p>
          <Link href="/recipes" className="inline-flex mt-5 text-[13px] font-medium text-primary hover:underline">Back to recipes</Link>
        </div>
      </motion.div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="h-6 bg-gray-100 rounded-full w-1/4 shimmer" />
          <div className="aspect-[2/1] bg-gray-100 rounded-xl shimmer" />
          <div className="h-8 bg-gray-100 rounded-full w-1/2 shimmer" />
          <div className="h-4 bg-gray-100 rounded-full w-1/3 shimmer" />
          <div className="h-40 bg-gray-100 rounded-card shimmer" />
        </div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-card border border-gray-100 p-8">
          <p className="text-gray-900 text-[15px] font-semibold">Recipe not found.</p>
          <Link href="/recipes" className="inline-flex mt-4 text-[13px] font-medium text-primary hover:underline">Back to recipes</Link>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:py-16">
      <motion.div initial={shouldReduce ? { opacity: 0 } : { opacity: 0, x: -8, filter: 'blur(4px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} transition={{ ease: ease.apple }}>
        <Link href="/recipes" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-primary mb-8 transition-colors group">
          <motion.span whileHover={{ x: -2 }} className="inline-flex"><ChevronLeft size={16} strokeWidth={2} /></motion.span>
          <span className="group-hover:underline underline-offset-4">All Recipes</span>
        </Link>
      </motion.div>

      <motion.div
        initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.97, filter: 'blur(12px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.7, ease: ease.appleSpring }}
        className="relative aspect-[2/1] rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 mb-8 shadow-[0_8px_32px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)]"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/20 pointer-events-none z-10" />
        {recipe.image ? (
          <SafeImage src={recipe.image} alt={recipe.title} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200">
            <ChefHat size={56} strokeWidth={1.5} />
          </div>
        )}
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } }}
        className="mb-10"
      >
        <motion.h1 variants={{ hidden: shouldReduce ? { opacity: 0 } : { opacity: 0, y: 16, filter: 'blur(6px)' }, visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { ease: ease.apple } } }} className="font-display text-[26px] sm:text-[36px] md:text-[42px] font-bold tracking-tight leading-[1.05] mb-4">{recipe.title}</motion.h1>

        {recipe.description && (
          <motion.p variants={{ hidden: shouldReduce ? { opacity: 0 } : { opacity: 0, y: 12, filter: 'blur(4px)' }, visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { ease: ease.apple } } }} className="text-[15px] text-gray-600 leading-relaxed max-w-[65ch]">{recipe.description}</motion.p>
        )}

        <motion.div variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04, delayChildren: 0.15 } } }} className="flex flex-wrap items-center gap-2.5 mt-6">
          {[
            recipe.prep_time && { icon: Clock, label: `Prep ${recipe.prep_time}m` },
            recipe.cook_time && { icon: Clock, label: `Cook ${recipe.cook_time}m` },
            recipe.servings && { icon: Users, label: `Serves ${recipe.servings}` },
          ]
            .filter(Boolean)
            .map((item: any, i) => (
              <motion.span
                key={i}
                variants={{ hidden: shouldReduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 6 }, visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', ...spring.snap } } }}
                className="inline-flex items-center gap-1.5 bg-white border border-gray-200/80 px-3 py-1.5 rounded-full text-[12px] font-medium text-gray-700 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
              >
                <item.icon size={14} className="text-primary" strokeWidth={2} />
                {item.label}
              </motion.span>
            ))}
          {recipe.category && (
            <motion.span variants={{ hidden: shouldReduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1, transition: { type: 'spring', ...spring.appleBounce } } }} className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide capitalize">
              {recipe.category}
            </motion.span>
          )}
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        <motion.div
          initial={shouldReduce ? { opacity: 0 } : { opacity: 0, x: -16, filter: 'blur(6px)' }}
          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          transition={{ delay: 0.25, type: 'spring', ...spring.apple }}
          className="lg:col-span-2 has-[[aria-expanded=true]]:z-20"
        >
          <div className="lg:sticky lg:top-24">
            <h2 className="font-display text-[18px] sm:text-[20px] font-bold mb-5 flex items-center gap-2.5 tracking-tight">
              <span className="w-7 h-7 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center">
                <ListOrdered size={14} className="text-primary" strokeWidth={2.5} />
              </span>
              Ingredients
            </h2>
            {ingredients.length === 0 ? (
              <p className="text-[13px] text-gray-500">No ingredients listed.</p>
            ) : (
              <motion.ul
                initial="hidden"
                animate="visible"
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.03, delayChildren: 0.3 } } }}
                className="space-y-1.5"
              >
                {ingredients.map((ing, idx) => {
                  const match = findIngredientProduct(ing, allProducts)
                  return (
                    <motion.li
                      key={idx}
                      variants={{
                        hidden: shouldReduce ? { opacity: 0 } : { opacity: 0, x: -8, filter: 'blur(3px)' },
                        visible: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.3, ease: ease.apple } },
                      }}
                      className="group flex items-center gap-3 px-3.5 py-2.5 rounded-button text-[13px] bg-white border border-gray-100/80 hover:border-gray-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all has-[[aria-expanded=true]]:relative has-[[aria-expanded=true]]:z-10"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 group-hover:bg-primary transition-colors shrink-0" />
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 flex-1 min-w-0 text-gray-700 leading-snug">
                        <span>{ing}</span>
                        {match && <IngredientProductPopover product={match} />}
                      </span>
                    </motion.li>
                  )
                })}
              </motion.ul>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={shouldReduce ? { opacity: 0 } : { opacity: 0, x: 16, filter: 'blur(6px)' }}
          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          transition={{ delay: 0.3, type: 'spring', ...spring.apple }}
          className="lg:col-span-3"
        >
          <h2 className="font-display text-[18px] sm:text-[20px] font-bold mb-5 flex items-center gap-2.5 tracking-tight">
            <span className="w-7 h-7 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center">
              <ChefHat size={14} className="text-primary" strokeWidth={2.5} />
            </span>
            Method
          </h2>
          {methodSteps.length === 0 ? (
            <p className="text-[13px] text-gray-500">No method available.</p>
          ) : (
            <motion.ol
              initial="hidden"
              animate="visible"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.35 } } }}
              className="space-y-5"
            >
              {methodSteps.map((step, idx) => (
                <motion.li
                  key={idx}
                  variants={{
                    hidden: shouldReduce ? { opacity: 0 } : { opacity: 0, y: 12, filter: 'blur(4px)' },
                    visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', ...spring.apple } },
                  }}
                  className="flex gap-4 group"
                >
                  <motion.span
                    initial={shouldReduce ? undefined : { scale: 0.8 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: 'spring', ...spring.appleBounce, delay: idx * 0.02 }}
                    className="w-8 h-8 rounded-full bg-gray-900 text-white text-[12px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_2px_8px_rgba(0,0,0,0.15)] group-hover:bg-primary group-hover:shadow-[0_2px_8px_rgba(235,101,34,0.3)] transition-all"
                  >
                    {idx + 1}
                  </motion.span>
                  <p className="text-[14px] text-gray-700 leading-relaxed pt-1 max-w-[65ch]">{step}</p>
                </motion.li>
              ))}
            </motion.ol>
          )}
        </motion.div>
      </div>
    </div>
  )
}

function IngredientProductPopover({ product }: { product: Product }) {
  const addItem = useCartStore(s => s.addItem)
  const [open, setOpen] = useState(false)
  const [added, setAdded] = useState(false)
  const price = Number(product.effective_price ?? product.sale_price ?? product.price)

  const addToCart = () => {
    addItem(product)
    emitCartAdded(product.name)
    setAdded(true)
    setTimeout(() => {
      setOpen(false)
      setAdded(false)
    }, 900)
  }

  return (
    <PopoverRoot open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={`About ${product.name}`}
        className="inline-flex items-center gap-1.5 bg-primary/5 border border-primary/20 rounded-full pl-1 pr-2.5 py-0.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors flex-shrink-0 no-underline"
      >
        {product.image ? (
          <SafeImage src={product.image} alt={product.name} width={20} height={20} className="rounded-full object-cover" />
        ) : (
          <Package size={12} className="flex-shrink-0" />
        )}
        <span className="truncate max-w-[80px]">{product.name}</span>
        <span className="font-semibold">{formatZar(price)}</span>
      </PopoverTrigger>

      <PopoverContent className="w-72 rounded-card border border-gray-100 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        <div className="flex gap-2.5">
          <div className="relative w-11 h-11 rounded-sm bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-100">
            {product.image ? (
              <SafeImage src={product.image} alt={product.name} width={44} height={44} className="object-contain" />
            ) : (
              <Package size={18} className="text-gray-300" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-2">{product.name}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {product.unit}
              {product.unit && product.category?.name ? ' · ' : ''}
              {product.category?.name}
            </p>
          </div>
        </div>

        {product.description && (
          <p className="text-[11px] leading-relaxed text-gray-500 line-clamp-3 mt-2.5">{product.description}</p>
        )}

        <PopoverFooter className="mt-3">
          <span className="font-bold text-sm text-gray-900 tabular-nums">{formatZar(price)}</span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={addToCart}
            aria-label={`Add ${product.name} to cart`}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold text-white transition-colors shadow-sm ${added ? 'bg-green-600' : 'bg-primary hover:bg-primary-dark'}`}
          >
            {added ? <Check size={12} strokeWidth={2.5} /> : <ShoppingCart size={12} strokeWidth={2} />}
            {added ? 'Added' : 'Add'}
          </motion.button>
        </PopoverFooter>

        <Link
          href={`/products/${product.slug}`}
          aria-label={`View ${product.name} product page`}
          className="mt-3 inline-flex text-[11px] font-medium text-gray-400 hover:text-primary transition-colors"
        >
          View product page →
        </Link>
      </PopoverContent>
    </PopoverRoot>
  )
}
