export interface CartItem {
  productId: string;
  storeProductId: number | null;
  quantity: number;
}

export interface CartAddTarget {
  productId: string;
  storeProductId: number | null;
}

export interface ServerCartLine {
  productId: string;
  quantity: number;
  storeProductId: number | null;
}

export const MAX_QUANTITY = 8;
