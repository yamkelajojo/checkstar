export interface CartItem {
  productId: string;
  quantity: number;
  /** Optional store-scoped product ID for multi-store cart differentiation. */
  storeProductId?: number | null;
}

export interface CartAddTarget {
  productId: string;
  storeProductId?: number | null;
}

export { MAX_QUANTITY_PER_ITEM as MAX_QUANTITY } from '../../lib/constants';
