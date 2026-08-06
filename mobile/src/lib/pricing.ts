export interface PriceInput {
  basePriceCents: number;
  salePriceCents: number | null;
  collectionSalePriceCents: number | null;
}

/**
 * Applies the Checkstar pricing cascade:
 * product-level `sale_price` → collection special → base price.
 * Mirrors the backend PricingService::effectivePrice rule.
 */
export function effectivePriceCents(input: PriceInput): number {
  if (input.salePriceCents != null) return input.salePriceCents;
  if (input.collectionSalePriceCents != null) return input.collectionSalePriceCents;
  return input.basePriceCents;
}

/**
 * Percentage saved off the base price, rounded to a whole number.
 */
export function savingsPercent(basePriceCents: number, effectivePriceCentsValue: number): number {
  if (basePriceCents <= 0) return 0;
  const diff = basePriceCents - effectivePriceCentsValue;
  return Math.round((diff / basePriceCents) * 100);
}

const COUNT_UNITS = new Set(['each', 'unit', 'pack', 'bundle', 'loaf', 'roll']);

const VOLUME_RE = /^([0-9]+(?:\.[0-9]+)?)\s*(ml|l|L)$/;

/**
 * Normalises a price to per-litre (or identity for count units) so that
 * e.g. a 2L vs 330ml item compare fairly on a price gauge.
 */
export function normalizePricePerUnit(input: { priceCents: number; unit: string }): number {
  if (COUNT_UNITS.has(input.unit)) return input.priceCents;
  const match = input.unit.match(VOLUME_RE);
  if (match == null) return input.priceCents;
  const quantity = parseFloat(match[1]);
  const isLitres = match[2].toLowerCase() === 'l';
  const litres = isLitres ? quantity : quantity / 1000;
  if (litres <= 0) return input.priceCents;
  return Math.round(input.priceCents / litres);
}
