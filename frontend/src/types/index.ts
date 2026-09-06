export type UserRole = 'developer' | 'store_owner' | 'store_manager' | 'logistics_officer' | 'customer' | 'rider'
export type OrderStatus = 'pending' | 'confirmed' | 'retrying' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'
export type FulfilmentMethod = 'delivery' | 'pickup'
export type PaymentStatus = 'pending' | 'paid' | 'refunded'

export interface User {
  id: number; name: string; email: string; role: UserRole; phone: string | null; avatar: string | null; is_active: boolean
}
export interface Store { id: number; name: string; slug: string; address: string; city: string; phone: string; email: string | null; latitude: number; longitude: number; delivery_radius_km: number; trading_hours: Record<string, string>; logo: string | null; image: string | null; is_active: boolean }
export interface Category { id: number; name: string; slug: string; description: string | null; image: string | null; icon: string | null; sort_order: number }
export interface Product { id: number; category_id: number; name: string; slug: string; description: string | null; image: string | null; images: string[] | null; unit: string; price: number; sale_price: number | null; effective_price?: number | null; tags: string[] | null; is_featured: boolean; category?: Category }
export interface StoreProduct { id: number; store_id: number; product_id: number; stock_quantity: number; is_available: boolean; product?: Product }
export interface CartItem { product: Product; quantity: number; store_product_id?: number }
export interface UserAddress { id: number; user_id: number; label: string; contact_name: string | null; contact_phone: string | null; address: string; latitude: number; longitude: number; is_default: boolean; created_at?: string; updated_at?: string }
export interface Order { id: number; order_number: string; status: OrderStatus; payment_status: PaymentStatus; total: number; subtotal: number; delivery_fee: number; fulfilment_method?: FulfilmentMethod; delivery_latitude?: number | null; delivery_longitude?: number | null; delivery_address: string | null; created_at: string; can_cancel?: boolean; payment_method?: string; items?: OrderItem[]; rider?: Rider; store?: Store; activity_logs?: OrderActivityLog[] }
export interface OrderItem { id: number; product_id: number; quantity: number; unit_price: number; total_price: number; product_snapshot: { name: string; image: string; unit: string; slug: string } }
export interface Rider { id: number; user_id: number; store_id: number | null; is_available: boolean; vehicle_type: string | null; max_radius_km: number; total_deliveries: number; average_rating: number; xp: number; level: number; user?: User }
export interface OrderActivityLog { id: number; order_id: number; user_id: number | null; event_type: string; old_status: string | null; new_status: string | null; metadata: Record<string, unknown>; created_at: string }
export interface Special { id: number; title: string; slug: string; description: string | null; banner_image: string | null; start_date: string; end_date: string; products?: Product[] }
export interface Recipe { id: number; title: string; slug: string; description: string | null; ingredients: string | string[]; method: string; image: string | null; category: string | null; prep_time: number | null; cook_time: number | null; servings: number | null }
export interface CommunityPost { id: number; title: string; slug: string; content: string | null; image: string | null; category: 'gallery' | 'csr'; event_date: string | null }
export interface CareerListing { id: number; title: string; slug: string; description: string; requirements: string | null; location: string; type: string; department: string | null; closes_at: string | null }
export interface Paginated<T> { current_page: number; data: T[]; per_page: number; total: number; last_page: number }
export type DispatchStatus = 'assigned' | 'retrying' | 'cancelled' | 'pickup'
export interface Dispatch {
  status: DispatchStatus
  claim_latency_ms: number | null
  rider_id: number | null
  store_id: number | null
  rider_name?: string | null
  store_name?: string | null
}
export interface OrderPlacementResult { data: Order; dispatch: Dispatch }

export interface FeedEvent {
  id: string
  type: string
  severity: string
  message: string
  entity_type: string
  entity_id: number
  created_at: string
}

export interface EventFeedResponse {
  events: FeedEvent[]
  next_cursor: string | null
}

export interface BannerSlide {
  title: string
  subtitle?: string
  ctaLabel?: string
  url?: string
  bgType: 'solid' | 'gradient' | 'radial'
  colors: string[]
  pattern?: string
}

export interface Banner {
  id: number
  name: string
  slides: BannerSlide[]
  status: 'draft' | 'published'
  start_date?: string | null
  end_date?: string | null
  store?: Store
  created_at: string
}
