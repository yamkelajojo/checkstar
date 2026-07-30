import type { Category, Product, Store, Order, Rider, Special, Recipe, CommunityPost, CareerListing, User, CartItem } from '@/types'

const BASE = '/api'
let token: string | null = null

export function setApiToken(t: string | null) { token = t }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Accept': 'application/json', ...init?.headers as Record<string, string> }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, { credentials: 'include', headers, ...init })
  if (!res.ok) { const err = await res.json().catch(() => ({ message: res.statusText })); throw new Error(err.message || `Request failed: ${res.status}`) }
  return res.json()
}

export const api = {
  // Public
  getCategories: () => request<{ data: Category[] }>('/categories'),
  getProducts: (params?: Record<string, string>) => request<{ data: Product[] }>(`/products?${new URLSearchParams(params || {})}`),
  getProduct: (slug: string) => request<Product>(`/products/${slug}`),
  getSpecials: () => request<{ data: Special[] }>('/specials'),
  getStores: () => request<{ data: Store[] }>('/stores'),
  getStore: (slug: string) => request<Store>(`/stores/${slug}`),
  getRecipes: () => request<{ data: Recipe[] }>('/recipes'),
  getRecipe: (slug: string) => request<Recipe>(`/recipes/${slug}`),
  getCommunityPosts: (category?: string) => request<{ data: CommunityPost[] }>(`/community-posts${category ? `?category=${category}` : ''}`),
  getCareers: () => request<{ data: CareerListing[] }>('/careers'),
  // Auth
  getCsrfCookie: () => request<void>('/sanctum/csrf-cookie'),
  register: (data: { name: string; email: string; password: string; password_confirmation: string; phone?: string }) => request<{ user: User; token: string }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  registerRider: (data: { name: string; email: string; password: string; password_confirmation: string; phone?: string; vehicle_type?: string; banking_details?: string }) => request<{ user: User; token: string }>('/auth/register/rider', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) => request<{ user: User; token: string }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  getUser: () => request<User>('/auth/user'),
  // Customer
  getOrders: () => request<{ data: Order[] }>('/orders'),
  getOrder: (id: number) => request<Order>(`/orders/${id}`),
  placeOrder: (data: { store_id: number; items: { product_id: number; quantity: number }[]; delivery_address?: string }) => request<Order>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  cancelOrder: (id: number) => request<Order>(`/orders/${id}/cancel`, { method: 'POST' }),
  confirmDelivery: (id: number) => request<Order>(`/orders/${id}/confirm`, { method: 'POST' }),
  reviewRider: (id: number, data: { rating: number; comment?: string }) => request<any>(`/orders/${id}/review`, { method: 'POST', body: JSON.stringify(data) }),
  getCart: () => request<{ items: CartItem[] }>('/cart'),
  syncCart: (items: { product_id: number; quantity: number }[]) => request<{ items: CartItem[] }>('/cart/sync', { method: 'POST', body: JSON.stringify({ items }) }),
  updateProfile: (data: Partial<User>) => request<User>('/profile', { method: 'PUT', body: JSON.stringify(data) }),
  // Rider
  getAvailableOrders: () => request<{ data: Order[] }>('/rider/available-orders'),
  claimOrder: (id: number) => request<Order>(`/rider/claim/${id}`, { method: 'POST' }),
  markItemsBought: (id: number) => request<Order>(`/rider/items-bought/${id}`, { method: 'POST' }),
  markOutForDelivery: (id: number) => request<Order>(`/rider/out-for-delivery/${id}`, { method: 'POST' }),
  markDelivered: (id: number) => request<Order>(`/rider/delivered/${id}`, { method: 'POST' }),
  toggleAvailability: () => request<Rider>('/rider/toggle-availability', { method: 'POST' }),
  getRiderStats: () => request<any>('/rider/stats'),
  getRiderHistory: () => request<{ data: Order[] }>('/rider/history'),
}
