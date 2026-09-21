export interface CartItem {
  productId: string;
  quantity: number;
  /** Optional store-scoped product ID for multi-store cart differentiation — normalized to string | null at runtime but accepts number for legacy/test compat. */
  storeProductId?: string | number | null;
}

export interface CartAddTarget {
  productId: string;
  storeProductId?: string | number | null;
}

export { MAX_QUANTITY_PER_ITEM as MAX_QUANTITY } from '../../lib/constants';
