import type { ApiProduct, ApiStoreAvailability } from './types';
import { effectivePriceCents } from './pricing';

/** Converts a Rand decimal string ("12.50") from the API into whole cents. */
export function toCents(rand: string | number): number {
  const num = typeof rand === 'string' ? parseFloat(rand) : rand;
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100);
}

export interface StoreAvailabilityVO {
  storeProductId: number;
  id: number;
  name: string;
  slug: string;
  stockQuantity: number;
  isAvailable: boolean;
}

export interface ProductVO {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  unit: string;
  categoryId: number;
  categoryName: string | null;
  tags: string[];
  images: string[];
  basePriceCents: number;
  salePriceCents: number | null;
  collectionPriceCents: number | null;
  effectivePriceCents: number;
  brand: string | null;
  storageTip: string | null;
  keyPoints: string[];
  isFeatured: boolean;
  isActive: boolean;
  stockLabel: string;
  storeCount: number;
  stores: StoreAvailabilityVO[];
}

export function mapProduct(api: ApiProduct): ProductVO {
  const basePriceCents = toCents(api.price);
  const salePriceCents = api.sale_price != null ? toCents(api.sale_price) : null;
  const collectionPriceCents =
    api.specials && api.specials.length > 0
      ? toCents(api.specials[0].sale_price ?? 0) || null
      : null;

  const stores = (api.stores ?? []).map((s: ApiStoreAvailability) => ({
    storeProductId: s.store_product_id,
    id: s.id,
    name: s.name,
    slug: s.slug,
    stockQuantity: s.stock_quantity,
    isAvailable: s.is_available,
  }));

  return {
    id: api.id,
    slug: api.slug,
    name: api.name,
    description: api.description ?? null,
    unit: api.unit,
    categoryId: api.category_id,
    categoryName: api.category?.name ?? null,
    tags: api.tags ?? [],
    images: api.images ?? [],
    basePriceCents,
    salePriceCents,
    collectionPriceCents,
    effectivePriceCents: effectivePriceCents({ basePriceCents, salePriceCents, collectionSalePriceCents: collectionPriceCents }),
    brand: api.brand ?? null,
    storageTip: api.storage_tip ?? null,
    keyPoints: api.key_points ?? [],
    isFeatured: api.is_featured,
    isActive: api.is_active,
    stockLabel: api.is_active ? 'In stock' : 'Out of stock',
    storeCount: api.store_count ?? 0,
    stores,
  };
}

export function findStoreAvailability(product: ProductVO, storeId: number | null): StoreAvailabilityVO | undefined {
  if (!storeId) return undefined;
  return product.stores.find((s) => s.id === storeId && s.isAvailable && s.stockQuantity > 0);
}