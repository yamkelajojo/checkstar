import type { Product } from '@/types'

/**
 * Ingredient → product linking for recipe pages — improved.
 *
 * Improvements over original:
 * 1. Expanded stopwords: cooking units (tbsp, tsp, cup, etc.) and descriptors (softened, halved, peeled, etc.)
 * 2. Phrase synonyms: SA and international equivalents (baby marrow ↔ zucchini, brinjal ↔ eggplant, mielie ↔ corn, naartjie ↔ mandarin, etc.)
 * 3. Token synonyms: canonical mapping (cilantro ↔ coriander, capsicum ↔ pepper, chilli ↔ chili, yoghurt ↔ yogurt, etc.)
 * 4. Fuzzy matching: Levenshtein distance ≤1 for tokens ≥4 chars, ≤2 for ≥7 chars, to handle typos (mozzarela → mozzarella)
 * 5. Improved ranking: matched count, coverage of product tokens, positional (head noun), shorter canonical names, plus ingredient coverage bonus
 * 6. Still respects non-edible guard, negation guard, generic head guard
 * 7. Single-token matches must explain the whole ingredient — a leftover
 *    substantive token means the product is a sibling, not the ingredient
 *    ("Tennis biscuits" must not link to "Tim Tam … Biscuits"). Parenthetical
 *    annotations ("for sauce", "optional") are ignored.
 */

const NON_EDIBLE_CATEGORIES = new Set(['pet-supplies', 'baby-toddler'])

const STOPWORDS = new Set([
  // original
  'pack', 'pk', 'each', 'fresh', 'and', 'with', 'the', 'of', 'in', 'per', 'from',
  // cooking units
  'tbsp', 'tbsps', 'tablespoon', 'tablespoons', 'tsp', 'tsps', 'teaspoon', 'teaspoons',
  'cup', 'cups', 'ml', 'l', 'g', 'kg', 'mg', 'oz', 'lb', 'lbs',
  'pinch', 'dash', 'bunch', 'bunches', 'clove', 'cloves', 'piece', 'pieces',
  'stick', 'sticks', 'can', 'cans', 'tin', 'tins', 'jar', 'jars', 'packet', 'packets', 'bottle', 'bottles',
  'box', 'boxes', 'bag', 'bags', 'handful', 'handfuls', 'sprig', 'sprigs',
  'leaf', 'leaves', 'slice', 'slices', 'sliced', // sliced kept as descriptor but slice itself is often not needed; we keep sliced as stopword for ingredients
  'fillet', 'fillets',
  // descriptors / prep
  'softened', 'halved', 'quartered', 'peeled', 'cored', 'chopped', 'grated', 'cooked',
  'skin', 'on', 'off', 'diced', 'minced', 'crushed', 'ground', 'powdered',
  'to', 'a', 'an', 'for', 'into', 'until', 'then', 'over',
  // generic cooking
  'large', 'small', 'medium', 'ripe', 'whole',
])

// Negation guard
const NEGATIONS = new Set(['no', 'zero', 'free', 'less', 'light', 'lite'])

// Generic heads
const GENERIC_HEADS = new Set(['powder', 'juice', 'mix', 'drink', 'water', 'flavoured', 'flavour', 'soft', 'blend', 'syrup'])

// Prep/state descriptors that can remain in an ingredient line after
// stopword removal without naming a different product
// ("1/4 cup butter, cold and cubed" is still just butter).
const DESCRIPTORS = new Set([
  'cold', 'cubed', 'melted', 'thawed', 'boneless', 'skinless', 'optional',
  'extra', 'garnish', 'frying', 'deep', 'finely', 'freshly', 'roughly',
  'lukewarm', 'warm', 'beaten',
])

const SIZE_UNITS = '(?:g|kg|ml|l|cl|m|cm|pk|pack|caps?|capsules|sachets?|sheets?|tablets?|tabs?|bars?|rolls?|wipes|nappies|units?|each|bottles?|cans?|tins?|pouches?|bags?)'
const SIZE_RE = new RegExp(`^\\d+([.,]\\d+)?${SIZE_UNITS}*$`)
const RANGE_RE = new RegExp(`^\\d+([-–]\\d+)?${SIZE_UNITS}*$`)

// Phrase synonyms — replace before tokenization (lowercase, spaces)
// Key is phrase to replace, value is canonical phrase
const PHRASE_SYNONYMS: Array<[RegExp, string]> = [
  [/\bbaby\s*marrow(s)?\b/g, 'zucchini'],
  [/\bcourgette(s)?\b/g, 'zucchini'],
  [/\bbrinjal(s)?\b/g, 'eggplant'],
  [/\baubergine(s)?\b/g, 'eggplant'],
  [/\bmielie(s)?\b/g, 'corn'],
  [/\bnaartjie(s)?\b/g, 'mandarin'],
  [/\bbell\s*pepper(s)?\b/g, 'pepper'],
  [/\bcapsicum(s)?\b/g, 'pepper'],
  [/\bcoriander\b/g, 'cilantro'],
  [/\bchilli\b/g, 'chili'],
  [/\bchillies\b/g, 'chili'],
  [/\byoghurt\b/g, 'yogurt'],
  [/\bchick\s*pea(s)?\b/g, 'chickpea'],
  [/\bgarbanzo(s)?\b/g, 'chickpea'],
  [/\bmozzarella\b/g, 'mozzarella'], // keep canonical but helps with typo handling via fuzzy
]

// Token-level canonical mapping
const TOKEN_SYNONYMS: Record<string, string> = {
  // SA ↔ intl
  'zucchini': 'zucchini',
  'marrow': 'zucchini',
  'eggplant': 'eggplant',
  'brinjal': 'eggplant',
  'aubergine': 'eggplant',
  'corn': 'corn',
  'mielie': 'corn',
  'mandarin': 'mandarin',
  'naartjie': 'mandarin',
  'beet': 'beetroot',
  'beetroot': 'beetroot',
  'pepper': 'pepper',
  'capsicum': 'pepper',
  'cilantro': 'coriander',
  'coriander': 'coriander',
  'chili': 'chili',
  'chilli': 'chili',
  'yogurt': 'yogurt',
  'yoghurt': 'yogurt',
  'chickpea': 'chickpea',
  'garbanzo': 'chickpea',
}

function canonicalToken(t: string): string {
  return TOKEN_SYNONYMS[t] || t
}

function normalize(text: string): string {
  let s = text.toLowerCase()
  // Parentheticals in ingredient lines are annotations ("for sauce",
  // "optional", "for curried mince filling") — drop them so their words can
  // neither create nor block a match.
  s = s.replace(/\([^)]*\)/g, ' ')
  // apply phrase synonyms first
  for (const [re, repl] of PHRASE_SYNONYMS) {
    s = s.replace(re, repl)
  }
  return s
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function singular(word: string): string {
  if (word.length > 4 && word.endsWith('ies')) return word.slice(0, -3) + 'y'
  if (word.length > 4 && word.endsWith('oes')) return word.slice(0, -2)
  if (word.length > 4 && /(x|z|s|sh|ch)es$/.test(word)) return word.slice(0, -2)
  if (word.length > 3 && word.endsWith('ss')) return word
  if (word.length > 3 && word.endsWith('s')) return word.slice(0, -1)
  return word
}

function tokens(text: string): string[] {
  return normalize(text)
    .split(' ')
    .filter((word) => word && !/^\d+$/.test(word) && !SIZE_RE.test(word) && !RANGE_RE.test(word) && !STOPWORDS.has(word))
    .map(singular)
    .map(canonicalToken)
}

// Levenshtein distance for fuzzy matching
function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  const al = a.length, bl = b.length
  if (al === 0) return bl
  if (bl === 0) return al
  // swap to use less memory if needed
  let prev = new Array(bl + 1)
  let curr = new Array(bl + 1)
  for (let j = 0; j <= bl; j++) prev[j] = j
  for (let i = 1; i <= al; i++) {
    curr[0] = i
    const ca = a.charCodeAt(i - 1)
    for (let j = 1; j <= bl; j++) {
      const cb = b.charCodeAt(j - 1)
      const cost = ca === cb ? 0 : 1
      curr[j] = Math.min(
        prev[j] + 1, // deletion
        curr[j - 1] + 1, // insertion
        prev[j - 1] + cost // substitution
      )
    }
    const tmp = prev
    prev = curr
    curr = tmp
  }
  return prev[bl]
}

function isFuzzyMatch(a: string, b: string): boolean {
  if (a.length < 3 || b.length < 3) return false
  if (Math.abs(a.length - b.length) > 2) return false
  const dist = levenshtein(a, b)
  if (a.length >= 7 || b.length >= 7) return dist <= 2
  return dist <= 1
}

function isEdible(product: Product): boolean {
  const slug = product.category?.slug
  return !slug || !NON_EDIBLE_CATEGORIES.has(slug)
}

export function findIngredientProduct(ingredient: string, products: Product[]): Product | null {
  const ingToks = tokens(ingredient)
  const ingredientTokens = new Set(ingToks)
  if (ingredientTokens.size === 0) return null

  let best: Product | null = null
  let bestScore: [number, number, number, number, number] | null = null

  for (const product of products) {
    if (!isEdible(product)) continue
    const toks = tokens(product.name)
    if (toks.length === 0) continue

    const matched: number[] = []
    let fuzzyUsed = 0

    for (let i = 0; i < toks.length; i++) {
      const token = toks[i]
      if (token.length < 3) continue
      if (ingredientTokens.has(token)) {
        matched.push(i)
      } else {
        // fuzzy check against any ingredient token
        for (const ingTok of ingredientTokens) {
          if (isFuzzyMatch(token, ingTok)) {
            matched.push(i)
            fuzzyUsed++
            break
          }
        }
      }
    }
    if (matched.length === 0) continue

    const last = toks.length - 1
    const negated = matched.some((idx) => NEGATIONS.has(toks[idx - 1] ?? '') || NEGATIONS.has(toks[idx + 1] ?? ''))
    if (negated) continue

    if (matched.length === 1 && !GENERIC_HEADS.has(toks[last]) && matched[0] !== last) continue
    if (matched.length === 1 && matched[0] === last && GENERIC_HEADS.has(toks[last])) continue

    // A single shared token only justifies a link when it explains the whole
    // ingredient. If a substantive ingredient token is left unexplained, the
    // product is a sibling, not the ingredient ("2 packets Tennis biscuits"
    // must not link to "Tim Tam Original Biscuits" via 'biscuit' alone).
    if (matched.length === 1) {
      const matchedToken = toks[matched[0]]
      const unexplained = [...ingredientTokens].filter(
        (t) =>
          t !== matchedToken &&
          !isFuzzyMatch(t, matchedToken) &&
          t.length >= 4 &&
          !GENERIC_HEADS.has(t) &&
          !DESCRIPTORS.has(t)
      )
      if (unexplained.length > 0) continue
    }

    // Scoring improvements
    const positional = Math.max(...matched.map((idx) => (idx + 1) / toks.length))
    const coverage = matched.length / toks.length // how much of product name is covered
    const ingredientCoverage = matched.length / ingredientTokens.size // how much of ingredient is explained by product (bonus for specific)
    // Prefer exact matches over fuzzy: penalize fuzzy
    const fuzzyPenalty = fuzzyUsed * 0.1
    // Score tuple: matched count, coverage, positional, ingredientCoverage, -length (shorter canonical preferred)
    // We incorporate fuzzy penalty by slightly reducing coverage
    const score: [number, number, number, number, number] = [
      matched.length,
      coverage - fuzzyPenalty,
      positional,
      ingredientCoverage,
      -toks.length,
    ]

    if (
      !bestScore ||
      score[0] > bestScore[0] ||
      (score[0] === bestScore[0] && (
        score[1] > bestScore[1] ||
        (score[1] === bestScore[1] && (
          score[2] > bestScore[2] ||
          (score[2] === bestScore[2] && (
            score[3] > bestScore[3] ||
            (score[3] === bestScore[3] && score[4] > bestScore[4])
          ))
        ))
      ))
    ) {
      best = product
      bestScore = score
    }
  }
  return best
}

// Export helpers for testing
export const _test = {
  tokens,
  normalize,
  singular,
  levenshtein,
  isFuzzyMatch,
  canonicalToken,
}
