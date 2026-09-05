import type { Product } from '@/types'

/**
 * Ingredient → product linking for recipe pages.
 *
 * Given a raw ingredient line ("2 tbsp sugar") and the catalogue, find the
 * product the ingredient most plausibly refers to, so the recipe can render
 * an inline thumbnail that links to the product page.
 *
 * The catalogue is a real retail dataset ("Clover Fresh Full Cream Milk 1L",
 * "Grain Field Chickens Fresh Chicken Drumsticks & Thighs Per kg"), so the
 * full product name can never appear inside an ingredient line. The algorithm
 * therefore works on significant tokens:
 *
 *  1. Skip non-edible ranges (pet food, baby food) — "lamb chops" must not
 *     link to Whiskas cat food.
 *  2. Normalize case/punctuation, strip sizes/units ("1.5kg", "6 x 91g") and
 *     stopwords, and fold simple English plurals on BOTH sides ("mangoes" →
 *     "mango", "apples" → "apple").
 *  3. A product matches when at least one significant token appears as a
 *     whole word in the ingredient.
 *  4. Guards (a wrong link is worse than no link):
 *     - Negation: "Coca-Cola Zero Sugar" must not match "2 tbsp sugar".
 *     - A single-token match must carry the product's head noun ("Festive
 *       Fresh Chicken Thighs" needs "chicken" or "thigh(s)"), unless the
 *       head is a generic word ("drink", "juice", "mix"…) and the matched
 *       token is its flavour ("cola" in "Zip Cola Flavoured Soft Drink").
 *  5. Rank: more matched tokens, then matches closer to the head of the
 *     name, then shorter (more canonical) names.
 */

/** Catalogue ranges that must never be linked from a food recipe. */
const NON_EDIBLE_CATEGORIES = new Set(['pet-supplies', 'baby-toddler'])

const STOPWORDS = new Set(['pack', 'pk', 'each', 'fresh', 'and', 'with', 'the', 'of', 'in', 'per', 'from'])

/** A neighbour of a matched token that voids the match ("Zero Sugar"). */
const NEGATIONS = new Set(['no', 'zero', 'free', 'less', 'light', 'lite'])

/** Head nouns that carry no identity on their own ("… Protein Powder"). */
const GENERIC_HEADS = new Set(['powder', 'juice', 'mix', 'drink', 'water', 'flavoured', 'flavour', 'soft', 'blend'])

const SIZE_UNITS = '(?:g|kg|ml|l|cl|m|cm|pk|pack|caps?|capsules|sachets?|sheets?|tablets?|tabs?|bars?|rolls?|wipes|nappies|units?|each|bottles?|cans?|tins?|pouches?|bags?)'
const SIZE_RE = new RegExp(`^\\d+([.,]\\d+)?${SIZE_UNITS}*$`)
const RANGE_RE = new RegExp(`^\\d+([-–]\\d+)?${SIZE_UNITS}*$`)

/** Lowercase, punctuation → space, collapse whitespace. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

/** Fold simple English plural endings. */
function singular(word: string): string {
  if (word.length > 4 && word.endsWith('ies')) return word.slice(0, -3) + 'y'
  if (word.length > 4 && word.endsWith('oes')) return word.slice(0, -2)
  if (word.length > 4 && /(x|z|s|sh|ch)es$/.test(word)) return word.slice(0, -2)
  if (word.length > 3 && word.endsWith('ss')) return word
  if (word.length > 3 && word.endsWith('s')) return word.slice(0, -1)
  return word
}

/** Significant, singularized tokens of a name or ingredient line. */
function tokens(text: string): string[] {
  return normalize(text)
    .split(' ')
    .filter((word) => word && !/^\d+$/.test(word) && !SIZE_RE.test(word) && !RANGE_RE.test(word) && !STOPWORDS.has(word))
    .map(singular)
}

function isEdible(product: Product): boolean {
  const slug = product.category?.slug
  return !slug || !NON_EDIBLE_CATEGORIES.has(slug)
}

export function findIngredientProduct(ingredient: string, products: Product[]): Product | null {
  const ingredientTokens = new Set(tokens(ingredient))
  if (ingredientTokens.size === 0) return null

  let best: Product | null = null
  let bestScore: [number, number, number] | null = null

  for (const product of products) {
    if (!isEdible(product)) continue
    const toks = tokens(product.name)
    if (toks.length === 0) continue

    const matched: number[] = []
    for (let i = 0; i < toks.length; i++) {
      const token = toks[i]
      if (token.length >= 3 && ingredientTokens.has(token)) matched.push(i)
    }
    if (matched.length === 0) continue

    const last = toks.length - 1
    const negated = matched.some((idx) => NEGATIONS.has(toks[idx - 1] ?? '') || NEGATIONS.has(toks[idx + 1] ?? ''))
    if (negated) continue

    // A lone match must carry the head noun, unless the head is generic and
    // the match is its flavour word ("cola" in "Zip Cola Flavoured Soft
    // Drink"). A lone match ON the generic head itself ("powder" in a
    // protein powder) is never specific enough.
    if (matched.length === 1 && !GENERIC_HEADS.has(toks[last]) && matched[0] !== last) continue
    if (matched.length === 1 && matched[0] === last && GENERIC_HEADS.has(toks[last])) continue

    // Positional strength: a match near the end of the name is head-like.
    const positional = Math.max(...matched.map((idx) => (idx + 1) / toks.length))
    const score: [number, number, number] = [matched.length, positional, -toks.length]
    if (
      !bestScore ||
      score[0] > bestScore[0] ||
      (score[0] === bestScore[0] && (score[1] > bestScore[1] || (score[1] === bestScore[1] && score[2] > bestScore[2])))
    ) {
      best = product
      bestScore = score
    }
  }
  return best
}
