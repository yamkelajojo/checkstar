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
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 0
    table[n] = c
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

// ── helpers ─────────────────────────────────────────────────────────────────
function json(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
  res.end(JSON.stringify(body))
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
const server = http.createServer((req, res) => {
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

  if (req.method === 'POST' && (path === '/api/auth/login' || path === '/api/auth/register' || path === '/api/auth/register/rider')) {
    return json(res, 200, { user: { id: 1, name: 'Test Customer', email: 'test@checkstar.co.za' }, token: 'mock-token' })
  }
  if (path === '/api/auth/user' || path === '/api/user') {
    return json(res, 200, { user: { id: 1, name: 'Test Customer', email: 'test@checkstar.co.za' }, data: { id: 1, name: 'Test Customer', email: 'test@checkstar.co.za' } })
  }
  if (req.method === 'POST' && path === '/api/auth/logout') return json(res, 200, { message: 'Logged out' })
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

  if (path === '/api/addresses' && req.method === 'GET') return json(res, 200, { data: [] })
  if (path === '/api/addresses' && req.method === 'POST') {
    return json(res, 201, { data: { id: 1, user_id: 1, label: 'Home', contact_name: null, contact_phone: null, address: '123 Test Road', latitude: -29.85, longitude: 31.02, is_default: true } })
  }

  if (path === '/api/orders' && req.method === 'POST') {
    return json(res, 201, { data: orderFor(1), dispatch: { status: 'assigned', claim_latency_ms: 120, rider_id: 7, store_id: 1, rider_name: 'Sipho', store_name: stores[0].name } })
  }
  if (path === '/api/orders' && req.method === 'GET') return json(res, 200, { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1 })

  if (path === '/api/cart' && req.method === 'GET') return json(res, 200, { data: [] })
  if (path === '/api/cart/sync' && req.method === 'POST') return json(res, 200, { data: [], dropped: [] })

  if (path === '/api/feed') return json(res, 200, { data: [] })

  json(res, 404, { message: `Mock API: no route for ${req.method} ${path}` })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`mock api on :${PORT} — contract mirrors src/lib/api.ts`)
})
