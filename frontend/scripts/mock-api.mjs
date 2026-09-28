#!/usr/bin/env node
/**
 * Local dev mock of the Checkstar API (the web app proxies /api -> :8000).
 *
 * Lives IN THE REPO on purpose: every endpoint here mirrors the contract in
 * src/lib/api.ts (the app's own request layer), so the site, the E2E suite
 * and the device simulator all run against a faithful backend without PHP.
 *
 *   node scripts/mock-api.mjs            # :8000
 *   PORT=8000 node scripts/mock-api.mjs
 */
import http from 'node:http'
import zlib from 'node:zlib'

const PORT = Number(process.env.PORT || 8000)

// ── placeholder product imagery (valid PNGs, per-product colour) ───────────
const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function pngChunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  let crc = 0xffffffff
  for (const byte of body) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE((crc ^ 0xffffffff) >>> 0)
  return Buffer.concat([len, body, crcBuf])
}

function png(width, height, r, g, b) {
  const row = Buffer.concat([Buffer.from([0]), ...Array.from({ length: width }, () => Buffer.from([r, g, b]))])
  const raw = Buffer.concat(Array.from({ length: height }, () => row))
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // colour type: truecolour
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

const COLORS = [
  [146, 64, 110], [190, 24, 93], [168, 85, 160], [194, 65, 12], [154, 52, 140],
  [220, 38, 38], [234, 88, 12], [202, 138, 4], [120, 113, 108], [180, 83, 9],
  [217, 119, 6], [101, 163, 13], [22, 163, 74], [13, 148, 136], [59, 130, 246],
  [79, 70, 229], [124, 58, 237], [192, 38, 211], [244, 63, 94], [234, 179, 8],
]

// ── seed data ───────────────────────────────────────────────────────────────
const categories = [
  { id: 1, name: 'Fresh', slug: 'fresh', description: 'Fruit, veg & chilled goods', image: null, icon: 'apple', sort_order: 1 },
  { id: 2, name: 'Pantry', slug: 'pantry', description: 'Staples, condiments & tinned goods', image: null, icon: 'package', sort_order: 2 },
  { id: 3, name: 'Drinks', slug: 'drinks', description: 'Juice, cordials & soft drinks', image: null, icon: 'cup-soda', sort_order: 3 },
  { id: 4, name: 'Home', slug: 'home', description: 'Cleaning & household', image: null, icon: 'home', sort_order: 4 },
  { id: 5, name: 'Care', slug: 'care', description: 'Personal care & hygiene', image: null, icon: 'heart', sort_order: 5 },
  { id: 6, name: 'Other', slug: 'other', description: 'Everything else', image: null, icon: 'shopping-basket', sort_order: 6 },
]

const RAW_PRODUCTS = [
  ['Banting Revolution Lime Flavoured Cordial 48ml', 'banting-revolution-lime-flavoured-cordial-48ml', 3, '48ml', 12.99, null],
  ['Banting Revolution Strawberry Flavoured Cordial 48ml', 'banting-revolution-strawberry-flavoured-cordial-48ml', 3, '48ml', 12.99, null],
  ['Tropika Pineapple Dairy Fruit Mix 500ml', 'tropika-pineapple-dairy-fruit-mix-500ml', 3, '500ml', 12.99, null],
  ['Tropika Orange Dairy Fruit Mix 500ml', 'tropika-orange-dairy-fruit-mix-500ml', 3, '500ml', 12.99, null],
  ['Zip Cola Flavoured Soft Drink 2L', 'zip-cola-flavoured-soft-drink-2l', 3, '2L', 16.99, 14.99],
  ['Zip Zero Cola Flavoured Soft Drink 2L', 'zip-zero-cola-flavoured-soft-drink-2l', 3, '2L', 16.99, null],
  ['Tropika Tropical Dairy Fruit Mix 2L', 'tropika-tropical-dairy-fruit-mix-2l', 3, '2L', 26.99, null],
  ['Pepsi Cola Flavoured Soft Drink 2L', 'pepsi-cola-flavoured-soft-drink-2l', 3, '2L', 26.99, 22.99],
  ['Sun Quick Orange Juice 1.5L', 'sun-quick-orange-juice-15l', 3, '1.5L', 24.99, null],
  ['Lays Salt & Vinegar Chips 125g', 'lays-salt-vinegar-chips-125g', 2, '125g', 18.99, null],
  ['Jungle Oats Porridge 1kg', 'jungle-oats-porridge-1kg', 2, '1kg', 32.99, 28.99],
  ['Sir Fruit Watermelon Splash 330ml', 'sir-fruit-watermelon-splash-330ml', 3, '330ml', 15.99, null],
  ['Checkstar Spring Water 500ml', 'checkstar-spring-water-500ml', 3, '500ml', 7.99, null],
  ['Clover Full Cream Milk 1L', 'clover-full-cream-milk-1l', 1, '1L', 21.99, null],
  ['Ford champ Dishwashing Liquid 750ml', 'ford-dishwashing-liquid-750ml', 4, '750ml', 19.99, null],
  ['Bennys Double Thick Cream 250ml', 'bennys-double-thick-cream-250ml', 1, '250ml', 17.99, null],
]

const products = RAW_PRODUCTS.map(([name, slug, category_id, unit, price, sale], i) => {
  const [r, g, b] = COLORS[i % COLORS.length]
  return {
    id: i + 1,
    category_id,
    name,
    slug,
    description: `${name} — stocked at every Checkstar store.`,
    image: `/products/mock-${i + 1}.png`,
    images: null,
    unit,
    price,
    sale_price: sale,
    effective_price: sale ?? price,
    tags: i % 3 === 0 ? ['special'] : [],
    is_featured: i % 4 === 0,
  }
})

const bySlug = (slug) => products.find((p) => p.slug === slug)

const stores = [
  { id: 1, name: 'Checkstar Durban Central', slug: 'checkstar-durban-central', address: '123 West Street, Durban', latitude: -29.8587, longitude: 31.0218, phone: '031 123 4567', image: null, is_open: true },
  { id: 2, name: 'Checkstar Umhlanga', slug: 'checkstar-umhlanga', address: '9 Lagoon Drive, Umhlanga', latitude: -29.7261, longitude: 31.0836, phone: '031 234 5678', image: null, is_open: true },
  { id: 3, name: 'Checkstar Chatsworth', slug: 'checkstar-chatsworth', address: '45 Chatsworth Main, Chatsworth', latitude: -29.9245, longitude: 30.8836, phone: '031 345 6789', image: null, is_open: true },
]

const banners = [
  {
    id: 1, name: 'Weekly specials', status: 'published', store_id: null,
    start_date: '2026-01-01', end_date: '2027-12-31',
    // Slide shape mirrors components/BannerCarousel.tsx (colors/bgType required).
    slides: [
      { title: 'Weekly specials on now', subtitle: 'Save on your favourites', ctaLabel: 'See specials', url: '/specials', bgType: 'radial', colors: ['#7c2d12', '#431407'], pattern: 'dots' },
      { title: 'Fresh groceries, delivered', subtitle: 'From 3 stores across Durban', ctaLabel: 'Shop now', url: '/products', bgType: 'gradient', colors: ['#f97316', '#ea580c'], pattern: 'lines' },
    ],
  },
]

const specials = [
  { id: 1, title: '2L Soft drinks on sale', slug: '2l-soft-drinks-on-sale', description: 'Zip and Pepsi 2L bottles at knockout prices.', banner_image: null, start_date: '2026-01-01', end_date: '2027-12-31', products: products.filter((p) => p.sale_price !== null) },
]

const recipes = [
  { id: 1, title: 'Tropika Sunrise Smoothie', slug: 'tropika-sunrise-smoothie', description: 'A quick tropical breakfast blend.', ingredients: ['500ml Tropika Orange', '2 bananas', 'Ice'], method: 'Blend everything until smooth. Serve cold.', image: null, category: 'Drinks', prep_time: 5, cook_time: null, servings: 2 },
  { id: 2, title: 'Checkstar Footer Chicken', slug: 'checkstar-footer-chicken', description: 'Roast chicken with lemon and herbs.', ingredients: ['1 whole chicken', 'Lemon', 'Herbs'], method: 'Roast at 180C for 90 minutes.', image: null, category: 'Mains', prep_time: 15, cook_time: 90, servings: 4 },
]

const community = [
  { id: 1, title: 'Checkstar soccer day', slug: 'checkstar-soccer-day', content: 'Community five-a-side hosted by Checkstar.', image: null, category: 'csr', event_date: '2026-08-02' },
  { id: 2, title: 'Store opening gallery', slug: 'store-opening-gallery', content: 'Photos from our latest store opening.', image: null, category: 'gallery', event_date: null },
]

const careers = [
  { id: 1, title: 'Store Packer (Part-time)', slug: 'store-packer-part-time', description: 'Pack shelves and keep the store humming.', requirements: 'Matric preferred, own transport', location: 'Durban Central', type: 'Part-time', department: 'Stores', closes_at: '2027-01-31' },
  { id: 2, title: 'Delivery Rider', slug: 'delivery-rider', description: 'Bring orders to doors across Durban.', requirements: 'Own bike/scooter, PDP', location: 'Durban', type: 'Contract', department: 'Logistics', closes_at: '2027-03-31' },
]

// ── manager surface state (mutable, in-memory) ──────────────────────────────
// Auth: login sets a cs_role cookie — dev@→developer, owner@→store_owner,
// manager@→store_manager, logistics@→logistics_officer, rider@→rider,
// anything else→customer. /api/auth/user resolves the role from it.

const MOCK_USERS = {
  developer: { id: 9, name: 'Dev User', email: 'dev@checkstar.co.za', role: 'developer' },
  store_owner: { id: 2, name: 'Thandi Owner', email: 'owner@checkstar.co.za', role: 'store_owner' },
  store_manager: { id: 3, name: 'Sipho Manager', email: 'manager@checkstar.co.za', role: 'store_manager' },
  logistics_officer: { id: 4, name: 'Lerato Logistics', email: 'logistics@checkstar.co.za', role: 'logistics_officer' },
  rider: { id: 7, name: 'Rider Sipho', email: 'rider@checkstar.co.za', role: 'rider' },
  customer: { id: 1, name: 'Test Customer', email: 'test@checkstar.co.za', role: 'customer' },
}

function roleFromEmail(email) {
  const e = String(email || '').toLowerCase()
  if (e.startsWith('dev')) return 'developer'
  if (e.startsWith('owner')) return 'store_owner'
  if (e.startsWith('manager')) return 'store_manager'
  if (e.startsWith('logistics')) return 'logistics_officer'
  if (e.startsWith('rider')) return 'rider'
  return 'customer'
}

function parseCookies(req) {
  const raw = req.headers.cookie || ''
  return Object.fromEntries(raw.split(';').map((p) => p.trim().split('=').map(decodeURIComponent)).filter((a) => a.length === 2))
}

const SEED_MESSAGES = [
  { id: 1, name: 'Nomsa Dlamini', email: 'nomsa@example.com', subject: 'Delivery to Umlazi?', message: 'Do you deliver to Umlazi on weekends?', is_read: false, reply_body: null, replied_at: null, created_at: '2026-09-04T09:12:00Z' },
  { id: 2, name: 'Pieter van Wyk', email: 'pieter@example.com', subject: 'Bulk pricing', message: 'Looking for bulk pricing on 2L soft drinks for an event.', is_read: true, reply_body: 'Yes — contact our Durban Central branch for bulk rates.', replied_at: '2026-09-05T10:00:00Z', created_at: '2026-09-03T14:30:00Z' },
]
let nextMessageId = 3
let contactMessages = SEED_MESSAGES.map((m) => ({ ...m }))

const SEED_STAFF = [
  { id: 10, user: { id: 2, name: 'Thandi Owner', email: 'owner@checkstar.co.za' }, role: 'store_owner', store_id: 1, created_at: '2026-07-15T08:00:00Z' },
  { id: 11, user: { id: 3, name: 'Sipho Manager', email: 'manager@checkstar.co.za' }, role: 'store_manager', store_id: 1, created_at: '2026-08-01T08:00:00Z' },
  { id: 12, user: { id: 4, name: 'Lerato Logistics', email: 'logistics@checkstar.co.za' }, role: 'logistics_officer', store_id: 1, created_at: '2026-08-09T08:00:00Z' },
]

let staffAssignments = SEED_STAFF.map((a) => ({ ...a, user: { ...a.user } }))

const riders = [
  { rider_id: 7, name: 'Sipho R.', delivery_count: 14, avg_delivery_time: 26, total_distance: 61.5, is_available: true },
  { rider_id: 8, name: 'Ayanda N.', delivery_count: 8, avg_delivery_time: 31, total_distance: 38.2, is_available: true },
  { rider_id: 9, name: 'Kwame M.', delivery_count: 3, avg_delivery_time: 44, total_distance: 12.9, is_available: false },
  { rider_id: 10, name: 'Zanele K.', delivery_count: 11, avg_delivery_time: 29, total_distance: 52.0, is_available: true },
]

// Whole-Rider model shape the API emits (StoreDispatchController::riders and
// the Order rider relation): the dispatch picker and the orders screen read
// user.name, rating and delivery count from it.
const riderModel = (r) => ({
  id: r.rider_id,
  user_id: 900 + r.rider_id,
  store_id: 1,
  is_available: r.is_available,
  vehicle_type: 'Motorbike',
  max_radius_km: 8,
  average_rating: 4 + (r.rider_id % 10) / 10,
  total_deliveries: r.delivery_count * 10,
  user: { id: 900 + r.rider_id, name: r.name, email: `rider${r.rider_id}@example.com` },
})

const SEED_ORDERS = [
  { id: 501, order_number: 'CS-1501', status: 'confirmed', payment_status: 'paid', total: 84.97, subtotal: 76.99, delivery_fee: 7.98, fulfilment_method: 'delivery', delivery_latitude: -29.8587, delivery_longitude: 31.0218, delivery_address: '12 Problem Mkhize Rd, Berea', created_at: '2026-09-06T07:41:00Z', can_cancel: true, rider_id: null, items: [{ id: 1, product_id: 3, quantity: 2, unit_price: 12.99, total_price: 25.98, product_snapshot: { name: 'Tropika Pineapple 500ml', image: '/products/mock-3.png', unit: '500ml', slug: 'tropika-pineapple-dairy-fruit-mix-500ml' } }] },
  { id: 502, order_number: 'CS-1502', status: 'retrying', payment_status: 'paid', total: 45.98, subtotal: 45.98, delivery_fee: 0, fulfilment_method: 'delivery', delivery_latitude: -29.7261, delivery_longitude: 31.0836, delivery_address: '9 Lagoon Drive, Umhlanga', created_at: '2026-09-06T08:03:00Z', can_cancel: true, rider_id: null, items: [] },
  { id: 503, order_number: 'CS-1503', status: 'preparing', payment_status: 'paid', total: 33.98, subtotal: 33.98, delivery_fee: 0, fulfilment_method: 'delivery', delivery_latitude: -29.9245, delivery_longitude: 30.8836, delivery_address: '45 Chatsworth Main', created_at: '2026-09-06T08:20:00Z', can_cancel: true, rider_id: 8, items: [] },
]

let pendingOrders = SEED_ORDERS.map((o) => ({ ...o, items: o.items.map((i) => ({ ...i })) }))

let eventSeq = 900
const seedDay = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)
const analyticsCache = {}
function analyticsFor(period) {
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
  if (analyticsCache[days]) return analyticsCache[days]
  const revenue_over_time = Array.from({ length: days }, (_, i) => ({
    date: seedDay(days - 1 - i),
    revenue: Math.round(1800 + 1400 * Math.sin(i / 3.1) + i * 22),
  }))
  const total_revenue = revenue_over_time.reduce((s, d) => s + d.revenue, 0)
  const total_orders = days * 9 + 5
  const result = {
    total_revenue,
    total_orders,
    avg_order_value: Math.round((total_revenue / total_orders) * 100) / 100,
    revenue_over_time,
    orders_by_hour: Array.from({ length: 24 }, (_, h) => ({ hour: h, count: Math.max(0, Math.round(6 * Math.sin(((h - 6) / 24) * Math.PI * 2)) + (h > 15 && h < 19 ? 5 : 1)) })),
  }
  analyticsCache[days] = result
  return result
}

// ── helpers ─────────────────────────────────────────────────────────────────
function json(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
  res.end(JSON.stringify(body))
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (c) => { data += c })
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')) } catch { resolve({}) }
    })
  })
}

function paginate(list, url) {
  const perPage = Number(url.searchParams.get('per_page') || 10)
  const page = Number(url.searchParams.get('page') || 1)
  const start = (page - 1) * perPage
  return {
    current_page: page,
    data: list.slice(start, start + perPage),
    per_page: perPage,
    total: list.length,
    last_page: Math.max(1, Math.ceil(list.length / perPage)),
  }
}

const orderFor = (id) => ({
  id,
  order_number: `CS-${1000 + id}`,
  status: 'pending',
  payment_status: 'unpaid',
  total: 59.97,
  subtotal: 51.99,
  delivery_fee: 7.98,
  fulfilment_method: 'delivery',
  delivery_latitude: null,
  delivery_longitude: null,
  delivery_address: '123 Test Road, Durban',
  created_at: new Date().toISOString(),
  can_cancel: true,
  items: [],
})

// ── server ──────────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')
  const path = decodeURIComponent(url.pathname)

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    })
    return res.end()
  }

  // placeholder imagery (also what mediaUrl() resolves to via the web app's rewrite)
  if (path.startsWith('/products/mock-')) {
    const idx = Number(path.match(/mock-(\d+)/)?.[1] || 1)
    const [r, g, b] = COLORS[(idx - 1) % COLORS.length]
    res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400', 'Access-Control-Allow-Origin': '*' })
    return res.end(png(480, 480, r, g, b))
  }

  // Test seam: restore every mutable seed to its initial state.
  if (path === '/api/__admin/reset' && req.method === 'POST') {
    contactMessages = SEED_MESSAGES.map((m) => ({ ...m }))
    nextMessageId = SEED_MESSAGES.length + 1
    staffAssignments = SEED_STAFF.map((a) => ({ ...a, user: { ...a.user } }))
    pendingOrders = SEED_ORDERS.map((o) => ({ ...o, items: o.items.map((i) => ({ ...i })) }))
    return json(res, 200, { message: 'reset ok' })
  }

  if (req.method === 'POST' && (path === '/api/auth/login' || path === '/api/auth/register' || path === '/api/auth/register/rider')) {
    const body = await readBody(req)
    const role = roleFromEmail(body.email)
    const user = MOCK_USERS[role]
    // Two cookies: cs_role drives /api/auth/user; laravel_session satisfies the
    // Next middleware's protected-route check (mirrors the real Sanctum setup).
    res.setHeader('Set-Cookie', [
      `cs_role=${role}; Path=/; SameSite=Lax`,
      `laravel_session=mock-session-${role}; Path=/; SameSite=Lax`,
    ])
    return json(res, 200, { user, token: `mock-token-${role}` })
  }
  if (path === '/api/auth/user' || path === '/api/user') {
    // Mirror the real backend: no session → 401 Unauthenticated. A fallback
    // user here made every guest look signed in, which bounced visitors off
    // the login page and lied to the header.
    const role = parseCookies(req).cs_role
    if (!role) return json(res, 401, { message: 'Unauthenticated.' })
    const user = MOCK_USERS[role] ?? MOCK_USERS.customer
    return json(res, 200, { user, data: user })
  }
  if (req.method === 'POST' && path === '/api/auth/logout') {
    res.setHeader('Set-Cookie', [
      'cs_role=; Path=/; Max-Age=0',
      'laravel_session=; Path=/; Max-Age=0',
    ])
    return json(res, 200, { message: 'Logged out' })
  }
  if (req.method === 'POST' && path === '/api/auth/forgot-password') return json(res, 200, { message: 'Reset link sent' })
  if (req.method === 'POST' && path === '/api/auth/reset-password') return json(res, 200, { message: 'Password reset' })
  if (path === '/api/sanctum/csrf-cookie' || path === '/sanctum/csrf-cookie') { res.writeHead(204); return res.end() }

  if (path === '/api/categories') return json(res, 200, { data: categories })
  if (path === '/api/stores') return json(res, 200, { data: stores })
  if (path.startsWith('/api/stores/')) return json(res, 200, { data: stores[0] })
  if (path === '/api/banners') return json(res, 200, { data: banners.filter((b) => b.status === 'published') })
  if (path === '/api/recipes') return json(res, 200, { data: recipes })
  if (path.startsWith('/api/recipes/')) {
    const recipe = recipes.find((r) => r.slug === path.split('/').pop())
    if (!recipe) return json(res, 404, { message: 'Not found' })
    return json(res, 200, { data: recipe })
  }
  if (path === '/api/community-posts') {
    const cat = url.searchParams.get('category')
    return json(res, 200, { data: cat ? community.filter((c) => c.category === cat) : community })
  }
  if (path === '/api/careers') return json(res, 200, { data: careers })
  if (path === '/api/specials') return json(res, 200, { data: specials })

  if (path === '/api/products/trending') return json(res, 200, { data: products.filter((p) => p.is_featured) })
  if (path === '/api/products/popular') return json(res, 200, { data: [...products].sort((a, b) => a.id - b.id).slice(0, 8) })
  if (path === '/api/products/new-arrivals') return json(res, 200, { data: [...products].sort((a, b) => b.id - a.id).slice(0, 8) })

  // /api/products/:slug/related must be matched before /api/products/:slug
  const relatedMatch = path.match(/^\/api\/products\/([^/]+)\/related$/)
  if (relatedMatch) {
    const base = bySlug(relatedMatch[1])
    const limit = Number(url.searchParams.get('limit') || 8)
    const pool = products.filter((p) => p.slug !== relatedMatch[1] && (!base || p.category_id === base.category_id))
    const fallback = pool.length ? pool : products.filter((p) => p.slug !== relatedMatch[1])
    return json(res, 200, { data: fallback.slice(0, limit) })
  }

  const slugMatch = path.match(/^\/api\/products\/([^/]+)$/)
  if (slugMatch && req.method === 'GET') {
    const product = bySlug(slugMatch[1])
    if (!product) return json(res, 404, { message: 'Product not found' })
    return json(res, 200, { data: product })
  }

  if (path === '/api/products') {
    const cat = url.searchParams.get('category')
    const search = (url.searchParams.get('search') || '').toLowerCase()
    let list = products
    if (cat && cat !== 'all') {
      const category = categories.find((c) => c.slug === cat)
      if (category) list = list.filter((p) => p.category_id === category.id)
    }
    if (search) list = list.filter((p) => p.name.toLowerCase().includes(search))
    return json(res, 200, paginate(list, url))
  }

  if (path === '/api/fulfillment/validate' && req.method === 'POST') {
    return json(res, 200, { data: { valid: true, store_id: 1, delivery_fee: 7.98, eta_minutes: 45 } })
  }
  if (path === '/api/fulfillment/nearest-store') {
    return json(res, 200, { data: { store: stores[0], distance_km: 2.4 } })
  }

  // ── Operations dashboard (staff roles; the real backend enforces RBAC) ─────
  if (path === '/api/operations/metrics') {
    return json(res, 200, {
      active_riders: riders.filter((r) => r.is_available).length,
      total_riders: riders.length,
      orders_this_hour: 12,
      pending_orders: pendingOrders.filter((o) => !o.rider_id && o.status !== 'preparing').length,
      active_deliveries: 5,
      delivered_today: 38,
    })
  }
  if (path === '/api/operations/alerts') {
    return json(res, 200, {
      alerts: [
        { id: 'alert-pending-1', type: 'order_pending', severity: 'warning', message: '2 orders waiting longer than 10 minutes for dispatch' },
        { id: 'alert-idle-1', type: 'rider_idle', severity: 'info', message: 'Rider Kwame M. has been idle for 25 minutes' },
      ],
    })
  }
  if (path === '/api/operations/map-layers') {
    return json(res, 200, {
      traffic: [{ lat: -29.8587, lng: 31.0218, count: 7 }, { lat: -29.7261, lng: 31.0836, count: 4 }, { lat: -29.9245, lng: 30.8836, count: 2 }],
      routes: [{ rider_id: 7, lat: -29.85, lng: 31.02 }, { rider_id: 8, lat: -29.73, lng: 31.08 }],
      demand: [{ lat: -29.87, lng: 31.03, count: 9 }, { lat: -29.84, lng: 31.01, count: 5 }],
    })
  }
  if (path === '/api/operations/events') {
    const kinds = [
      { type: 'order.placed', message: 'New order CS-1504 placed — awaiting confirmation' },
      { type: 'order.dispatched', message: 'Order CS-1501 assigned to rider Sipho R.' },
      { type: 'order.delivered', message: 'Order CS-1498 delivered in 24 min' },
      { type: 'rider.online', message: 'Rider Ayanda N. went online' },
      { type: 'rider.offline', message: 'Rider Kwame M. went offline' },
    ]
    const cursor = Number(url.searchParams.get('cursor') || 0)
    const limit = Math.min(50, Number(url.searchParams.get('limit') || 50))
    const minuteBucket = Math.floor(Date.now() / 60000)
    const maxId = 880 + (minuteBucket % 40) * 5
    const all = []
    for (let id = 880; id <= maxId; id++) {
      const k = kinds[id % kinds.length]
      all.push({ id: String(id), type: k.type, message: k.message, order_id: id % 3 === 0 ? 1500 + (id % 5) : null, created_at: new Date(Date.now() - (maxId - id) * 45000).toISOString() })
    }
    const fresh = all.filter((e) => Number(e.id) > cursor)
    const page = fresh.slice(0, limit)
    return json(res, 200, { events: page, next_cursor: page.length ? page[page.length - 1].id : String(cursor) })
  }
  if (path.startsWith('/api/operations/dispatch-suggestion/')) {
    const orderId = Number(path.split('/').pop())
    return json(res, 200, { order_id: orderId, suggested_rider_id: 7, reason: 'Closest available rider (1.2 km, 14 deliveries today)' })
  }
  if (path === '/api/operations/assign-rider' && req.method === 'POST') {
    const body = await readBody(req)
    const order = pendingOrders.find((o) => o.id === Number(body.order_id))
    if (!order) return json(res, 404, { message: 'Order not found' })
    order.rider_id = Number(body.rider_id)
    order.status = 'preparing'
    return json(res, 200, { success: true, order })
  }

  // ── Operations analytics ───────────────────────────────────────────────────
  if (path.startsWith('/api/operations/analytics/sales')) {
    return json(res, 200, analyticsFor(url.searchParams.get('period')))
  }
  if (path.startsWith('/api/operations/analytics/products')) {
    const limit = Number(url.searchParams.get('limit') || 10)
    return json(res, 200, {
      top_products: products.slice(0, limit).map((p, i) => ({ id: p.id, name: p.name, order_count: 40 - i * 3, total_quantity: 90 - i * 7, total_revenue: 920 - i * 74 })),
      search_queries: [{ query: 'tropika', count: 128 }, { query: 'coke 2l', count: 97 }, { query: 'milk', count: 74 }, { query: 'cordial', count: 41 }],
    })
  }
  if (path.startsWith('/api/operations/analytics/riders')) {
    return json(res, 200, {
      rider_utilization: riders,
      fleet_summary: {
        active_riders: riders.filter((r) => r.is_available).length,
        total_riders: riders.length,
        avg_utilization_rate: Math.round((riders.reduce((s, r) => s + r.delivery_count, 0) / (riders.length * 14)) * 100),
      },
    })
  }

  // ── Admin: contact messages (developer) ────────────────────────────────────
  if (path === '/api/admin/messages' && req.method === 'GET') {
    return json(res, 200, { data: [...contactMessages].sort((a, b) => b.id - a.id) })
  }
  const msgReply = path.match(/^\/api\/admin\/messages\/(\d+)\/reply$/)
  if (msgReply && req.method === 'POST') {
    const msg = contactMessages.find((m) => m.id === Number(msgReply[1]))
    if (!msg) return json(res, 404, { message: 'Message not found' })
    const body = await readBody(req)
    if (!body.body || !String(body.body).trim()) return json(res, 422, { message: 'Reply body required' })
    msg.reply_body = String(body.body)
    msg.replied_at = new Date().toISOString()
    msg.is_read = true
    return json(res, 200, { data: msg })
  }
  const msgRead = path.match(/^\/api\/admin\/messages\/(\d+)\/read$/)
  if (msgRead && req.method === 'PATCH') {
    const msg = contactMessages.find((m) => m.id === Number(msgRead[1]))
    if (!msg) return json(res, 404, { message: 'Message not found' })
    const body = await readBody(req)
    msg.is_read = typeof body.read === 'boolean' ? body.read : !msg.is_read
    return json(res, 200, { data: msg })
  }
  if (path === '/api/admin/health') {
    return json(res, 200, { status: 'ok', uptime_s: Math.floor(process.uptime()), services: { api: 'ok', database: 'ok', queue: 'warn', storage: 'ok' } })
  }
  if (path === '/api/contact' && req.method === 'POST') {
    const body = await readBody(req)
    contactMessages.push({ id: nextMessageId++, name: body.name, email: body.email, subject: body.subject ?? '(no subject)', message: body.message, is_read: false, reply_body: null, replied_at: null, created_at: new Date().toISOString() })
    return json(res, 201, { message: 'Message received' })
  }

  // ── Store dispatch (manager/owner/logistics/developer) ─────────────────────
  // Mirror ManualDispatch::pendingForStore — the queue only ever holds
  // confirmed/retrying orders with no rider; assigned orders live on the
  // Orders screen (where reassignment happens).
  if (path === '/api/store/dispatch/pending') {
    return json(res, 200, {
      data: [...pendingOrders]
        .filter((o) => !o.rider_id && (o.status === 'confirmed' || o.status === 'retrying'))
        .sort((a, b) => b.id - a.id),
    })
  }
  if (path === '/api/store/dispatch/riders') {
    // StoreDispatchController::riders only offers available riders.
    return json(res, 200, { data: riders.filter((r) => r.is_available).map(riderModel) })
  }
  if (path === '/api/store/orders' && req.method === 'GET') {
    return json(res, 200, {
      data: [...pendingOrders]
        .sort((a, b) => b.id - a.id)
        .map((o) => ({
          ...o,
          rider: o.rider_id ? riderModel(riders.find((r) => r.rider_id === o.rider_id)) : null,
        })),
    })
  }
  const dispatchMatch = path.match(/^\/api\/store\/orders\/(\d+)\/dispatch$/)
  if (dispatchMatch && req.method === 'POST') {
    const body = await readBody(req)
    const riderId = Number(body.rider_id)
    if (!Number.isInteger(riderId) || riderId <= 0) return json(res, 422, { message: 'rider_id must be a positive integer', reason: 'invalid_rider' })
    if (!riders.some((r) => r.rider_id === riderId)) return json(res, 422, { message: 'Rider not found', reason: 'rider_missing' })
    const order = pendingOrders.find((o) => o.id === Number(dispatchMatch[1]))
    if (!order) return json(res, 404, { message: 'Order not found or already dispatched', reason: 'order_missing' })
    order.rider_id = riderId
    order.status = 'preparing'
    // A dispatched order no longer awaits dispatch — drop it from the queue
    // (mirrors the real endpoint's confirmed/retrying-and-riderless filter).
    pendingOrders = pendingOrders.filter((o) => o.id !== order.id)
    return json(res, 200, { data: order })
  }
  const reassignMatch = path.match(/^\/api\/store\/orders\/(\d+)\/reassign$/)
  if (reassignMatch && req.method === 'POST') {
    const body = await readBody(req)
    const riderId = Number(body.rider_id)
    if (!Number.isInteger(riderId) || riderId <= 0) return json(res, 422, { message: 'rider_id must be a positive integer', reason: 'invalid_rider' })
    if (!riders.some((r) => r.rider_id === riderId)) return json(res, 422, { message: 'Rider not found', reason: 'rider_missing' })
    const order = pendingOrders.find((o) => o.id === Number(reassignMatch[1]))
    if (!order) return json(res, 404, { message: 'Order not found', reason: 'order_missing' })
    if (!order.rider_id) return json(res, 409, { message: 'Order has no rider to reassign', reason: 'no_rider' })
    order.rider_id = riderId
    return json(res, 200, { data: order })
  }

  // ── Store staff assignments (owner/developer) ──────────────────────────────
  if (path === '/api/store/staff' && req.method === 'GET') {
    return json(res, 200, { data: staffAssignments })
  }
  if (path === '/api/store/staff' && req.method === 'POST') {
    const body = await readBody(req)
    const userId = Number(body.user_id)
    if (!Number.isInteger(userId) || userId <= 0) return json(res, 422, { message: 'user_id must be a positive integer' })
    if (staffAssignments.some((s) => s.user.id === userId)) return json(res, 409, { message: 'User already has a store assignment' })
    const known = Object.values(MOCK_USERS).find((u) => u.id === userId)
    const assignment = { id: Math.max(...staffAssignments.map((s) => s.id)) + 1, user: { id: userId, name: known?.name ?? `User #${userId}`, email: known?.email ?? `user${userId}@checkstar.co.za` }, role: body.role === 'logistics_officer' ? 'logistics_officer' : 'store_manager', store_id: Number(body.store_id) || 1, created_at: new Date().toISOString() }
    staffAssignments.push(assignment)
    return json(res, 201, { data: assignment })
  }
  const staffDelete = path.match(/^\/api\/store\/staff\/(\d+)$/)
  if (staffDelete && req.method === 'DELETE') {
    const idx = staffAssignments.findIndex((s) => s.id === Number(staffDelete[1]))
    if (idx === -1) return json(res, 404, { message: 'Assignment not found' })
    if (staffAssignments[idx].role === 'store_owner') return json(res, 403, { message: 'Store owners cannot be removed' })
    staffAssignments.splice(idx, 1)
    return json(res, 200, { message: 'Assignment removed' })
  }

  if (path === '/api/addresses' && req.method === 'GET') return json(res, 200, { data: [] })
  if (path === '/api/addresses' && req.method === 'POST') {
    return json(res, 201, { data: { id: 1, user_id: 1, label: 'Home', contact_name: null, contact_phone: null, address: '123 Test Road', latitude: -29.85, longitude: 31.02, is_default: true } })
  }

  if (path === '/api/orders' && req.method === 'POST') {
    return json(res, 201, { data: orderFor(1), dispatch: { status: 'assigned', claim_latency_ms: 120, rider_id: 7, store_id: 1, rider_name: 'Sipho', store_name: stores[0].name } })
  }
  if (path === '/api/orders' && req.method === 'GET') {
    const sample = [
      { id: 501, order_number: 'CS-1501', status: 'confirmed', payment_status: 'paid', total: 84.97, subtotal: 76.99, delivery_fee: 7.98, fulfilment_method: 'delivery', delivery_latitude: null, delivery_longitude: null, delivery_address: '12 Problem Mkhize Rd, Berea', created_at: '2026-09-06T07:41:00Z', can_cancel: true, items: [] },
      { id: 490, order_number: 'CS-1490', status: 'delivered', payment_status: 'paid', total: 59.97, subtotal: 51.99, delivery_fee: 7.98, fulfilment_method: 'delivery', delivery_latitude: null, delivery_longitude: null, delivery_address: '3 Silverton Way, Umhlanga Ridge', created_at: '2026-09-05T15:12:00Z', can_cancel: false, items: [] },
      { id: 487, order_number: 'CS-1487', status: 'cancelled', payment_status: 'refunded', total: 26.99, subtotal: 26.99, delivery_fee: 0, fulfilment_method: 'pickup', delivery_latitude: null, delivery_longitude: null, delivery_address: null, created_at: '2026-09-04T11:05:00Z', can_cancel: false, items: [] },
      { id: 480, order_number: 'CS-1480', status: 'delivered', payment_status: 'paid', total: 112.45, subtotal: 104.47, delivery_fee: 7.98, fulfilment_method: 'delivery', delivery_latitude: null, delivery_longitude: null, delivery_address: '88 Florida Rd, Morningside', created_at: '2026-09-03T09:47:00Z', can_cancel: false, items: [] },
    ]
    return json(res, 200, paginate(sample, url))
  }

  if (path === '/api/cart' && req.method === 'GET') return json(res, 200, { data: [] })
  if (path === '/api/cart/sync' && req.method === 'POST') return json(res, 200, { data: [], dropped: [] })

  if (path === '/api/feed') return json(res, 200, { data: [] })

  json(res, 404, { message: `Mock API: no route for ${req.method} ${path}` })
})

server.listen(PORT, '0.0.0.0', () => {
  // Self-check: the IEND chunk's CRC is a known constant (0xae426082). If the
  // table-driven CRC above is ever broken again, fail loudly at boot instead
  // of serving images every browser silently refuses to decode.
  const iend = pngChunk('IEND', Buffer.alloc(0))
  // chunk layout: [len:4][type:4][crc:4] → CRC at offset 8
  if (iend.readUInt32BE(8) !== 0xae426082) {
    console.error('mock api PNG CRC self-check FAILED — imagery would be undecodable')
    process.exit(1)
  }
  console.log(`mock api on :${PORT} — contract mirrors src/lib/api.ts`)
})
