export interface ApiCategory {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  image?: string | null;
  sort_order: number;
}

export interface ApiProduct {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  price: string;
  sale_price: string | null;
  unit: string;
  category_id: number;
  tags: string[] | null;
  images: string[];
  is_featured: boolean;
  is_active: boolean;
  category?: ApiCategory;
  specials?: ApiSpecial[];
  key_points?: string[] | null;
  storage_tip?: string | null;
  brand?: string | null;
}

export interface ApiSpecial {
  id: number;
  title: string;
  sale_price?: string | null;
  starts_at?: string;
  ends_at?: string;
  is_active?: boolean;
}

export interface ApiStore {
  id: number;
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  delivery_radius_km: number;
  trading_hours?: Record<string, string> | null;
}

export interface ApiOrderItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price_cents: number | null;
  product_snapshot: Record<string, unknown> | null;
}

export interface ApiActivityLog {
  id: number;
  status: string;
  old_status?: string | null;
  reason?: string | null;
  created_at: string;
  user?: { id: number; name: string } | null;
}

export interface ApiOrder {
  id: number;
  order_number?: string;
  status: string;
  payment_status: string;
  payment_method?: string | null;
  can_cancel?: boolean;
  delivery_address?: string | null;
  delivery_notes?: string | null;
  subtotal_cents: number | null;
  delivery_fee_cents: number | null;
  total_cents: number | null;
  customer_confirmed_at?: string | null;
  created_at: string;
  rider_rating?: number | null;
  items: ApiOrderItem[];
  store?: ApiStore | null;
  rider?: { id: number; user?: { name: string } } | null;
  activity_logs?: ApiActivityLog[];
  review?: unknown | null;
}

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: 'developer' | 'store_owner' | 'store_manager' | 'logistics_officer' | 'customer' | 'rider';
  rider?: {
    id: number;
    vehicle_type?: string | null;
    is_available: boolean;
    total_deliveries?: number;
    average_rating?: number | null;
    xp?: number;
    level?: number;
  } | null;
}

export interface ApiAuthResponse {
  user: ApiUser;
  token?: string;
}

export type ApiDispatchStatus = 'assigned' | 'retrying' | 'cancelled';

/** Outcome of the dispatch attempt that followed order placement. */
export interface ApiDispatchOutcome {
  status: ApiDispatchStatus;
  claim_latency_ms?: number | null;
  rider_id?: number | null;
  store_id?: number | null;
  rider_name?: string | null;
  store_name?: string | null;
  reason?: string | null;
}

export interface ApiPlaceOrderResponse {
  data: ApiOrder;
  dispatch: ApiDispatchOutcome;
}

export interface ApiCartSyncLine {
  product_id: number;
  product?: number | Record<string, unknown>;
  quantity: number;
  store_product_id: number | null;
}

export interface ApiCartSyncResponse {
  data: ApiCartSyncLine[];
  dropped: { product_id: number; reason: string }[];
}

export interface ApiPagination<T> {
  data: T[];
  total: number;
  current_page: number;
  last_page: number;
  per_page: number;
}
