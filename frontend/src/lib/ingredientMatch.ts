import type { Product } from '@/types'

/**
 * Ingredient → product matching for recipe pages.
 *
 * Given a raw ingredient line from a recipe (e.g. "1 tsp sugar") and the
 * catalogue, find the product the ingredient most plausibly refers to, so the
 * UI can attach an inline product thumbnail that links to the product page.
 *
 * Matching rules (deliberately conservative — a wrong link is worse than no
 * link):
 *  - Case- and punctuation-insensitive.
 *  - Whole-word matching only: a product named "Milk" must NOT hijack
 *    "500 ml Buttermilk".
 *  - Longest product name wins when several products match ("brown sugar"
 *    prefers "Brown Sugar" over "Sugar").
 *  - Trailing simple plurals are folded ("2 eggs" matches a product named
 *    "Egg" or "Eggs"), but nothing else is fuzzy.
 *  - Product names shorter than 3 characters are ignored.
 */

/** Lowercase, treat any punctuation as whitespace, collapse runs of spaces. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Whole-word pattern for a product name, tolerating a simple plural ending. */
function productPattern(name: string): RegExp {
  const words = name.split(' ').map(escapeRegExp)
  const last = words.length - 1
  const parts = words.map((w, i) => {
    if (i !== last) return w
    // Fold plurals on the final word: "Eggs" should match "3 egg" as well as
    // "3 eggs"; a stem ending in a non-plural 's' ("Sugar") is untouched.
    const stem = w.endsWith('s') ? w.slice(0, -1) : w
    return `${stem}(?:s|es)?`
  })
  return new RegExp(`(^|[^a-z0-9])${parts.join(' ')}([^a-z0-9]|$)`)
}

export function findIngredientProduct(ingredient: string, products: Product[]): Product | null {
  const text = normalize(ingredient)
  if (!text) return null

  let best: Product | null = null
  let bestLength = 0
  for (const product of products) {
    const name = normalize(product.name)
    if (name.length < 3 || name.length <= bestLength) continue
    if (productPattern(name).test(text)) {
      best = product
      bestLength = name.length
    }
  }
  return best
}
