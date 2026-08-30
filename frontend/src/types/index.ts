export type UserRole = 'developer' | 'store_owner' | 'store_manager' | 'logistics_officer' | 'customer' | 'rider'
export type OrderStatus = 'pending' | 'confirmed' | 'retrying' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'refunded'

export interface User {
  id: number; name: string; email: string; role: UserRole; phone: string | null; avatar: string | null; is_active: boolean
}
export interface Store { id: number; name: string; slug: string; address: string; city: string; phone: string; email: string | null; latitude: number; longitude: number; delivery_radius_km: number; trading_hours: any; logo: string | null; image: string | null; is_active: boolean }
export interface Category { id: number; name: string; slug: string; description: string | null; image: string | null; icon: string | null; sort_order: number }
export interface Product { id: number; category_id: number; name: string; slug: string; description: string | null; image: string | null; images: string[] | null; unit: string; price: number; sale_price: number | null; effective_price?: number | null; tags: string[] | null; is_featured: boolean; category?: Category }
export interface StoreProduct { id: number; store_id: number; product_id: number; stock_quantity: number; is_available: boolean; product?: Product }
export interface CartItem { product: Product; quantity: number; store_product_id?: number }
export interface Order { id: number; order_number: string; status: OrderStatus; payment_status: PaymentStatus; total: number; subtotal: number; delivery_fee: number; delivery_address: string | null; created_at: string; can_cancel?: boolean; payment_method?: string; items?: OrderItem[]; rider?: Rider; store?: Store; activity_logs?: OrderActivityLog[] }
export interface OrderItem { id: number; product_id: number; quantity: number; unit_price: number; total_price: number; product_snapshot: any }
export interface Rider { id: number; user_id: number; store_id: number | null; is_available: boolean; vehicle_type: string | null; max_radius_km: number; total_deliveries: number; average_rating: number; xp: number; level: number; user?: User }
export interface OrderActivityLog { id: number; order_id: number; user_id: number | null; event_type: string; old_status: string | null; new_status: string | null; metadata: any; created_at: string }
export interface Special { id: number; title: string; slug: string; description: string | null; banner_image: string | null; start_date: string; end_date: string; products?: Product[] }
export interface Recipe { id: number; title: string; slug: string; description: string | null; ingredients: any; method: string; image: string | null; category: string | null; prep_time: number | null; cook_time: number | null; servings: number | null }
export interface CommunityPost { id: number; title: string; slug: string; content: string | null; image: string | null; category: 'gallery' | 'csr'; event_date: string | null }
export interface CareerListing { id: number; title: string; slug: string; description: string; requirements: string | null; location: string; type: string; department: string | null; closes_at: string | null }
export interface Paginated<T> { current_page: number; data: T[]; per_page: number; total: number; last_page: number }
export type DispatchStatus = 'assigned' | 'retrying' | 'cancelled'
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
  id: number
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
