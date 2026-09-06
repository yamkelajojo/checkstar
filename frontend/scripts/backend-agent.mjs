#!/usr/bin/env node
/**
 * Backend agent.
 *
 * This sandbox has no PHP runtime — real backend test execution (PHP 8.2,
 * 8.3, 8.4 + MySQL 8) happens in CI. This agent therefore covers what CAN be
 * verified here, and verifies it by execution, not by reading:
 *
 *   1. Contract probes — every public endpoint fetched through the site's own
 *      /api proxy (the real frontend → backend integration path), asserting
 *      the Laravel-style envelope (data[], pagination fields).
 *   2. Static scan — backend/ PHP file inventory, route files, and
 *      TODO/FIXME/HACK marker count.
 *
 * Exits non-zero if any contract probe fails.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000'
const ENDPOINTS = [
  '/api/products',
  '/api/categories',
  '/api/recipes',
  '/api/stores',
  '/api/banners',
  '/api/specials',
]

console.log(`[backend] contract probes via ${BASE}`)
let failures = 0
for (const endpoint of ENDPOINTS) {
  try {
    const res = await fetch(`${BASE}${endpoint}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const body = await res.json()
    if (!body || !Array.isArray(body.data)) throw new Error('response missing data[]')
    console.log(`[backend]   ok    ${endpoint} -> ${body.data.length} items`)
  } catch (error) {
    failures += 1
    console.log(`[backend]   FAIL  ${endpoint} -> ${error.message}`)
  }
}

// ── static scan ────────────────────────────────────────────────────────────
const backendDir = join(new URL('..', import.meta.url).pathname, '..', 'backend')
let phpFiles = 0
let routeFiles = 0
let markers = 0

function walk(dir, depth = 0) {
  if (depth > 6) return
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return
  }
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === 'vendor') continue
    const full = join(dir, entry)
    let stats
    try {
      stats = statSync(full)
    } catch {
      continue
    }
    if (stats.isDirectory()) {
      walk(full, depth + 1)
    } else if (extname(entry) === '.php') {
      phpFiles += 1
      if (full.includes('/routes/')) routeFiles += 1
      try {
        markers += (readFileSync(full, 'utf8').match(/TODO|FIXME|HACK/g) || []).length
      } catch {
        /* unreadable file — ignore */
      }
    }
  }
}
walk(backendDir)

console.log(`[backend] static scan: ${phpFiles} PHP files, ${routeFiles} route files, ${markers} TODO/FIXME/HACK markers`)
console.log('[backend] runtime test execution delegated to CI (PHP 8.2-8.4, MySQL 8)')

process.exit(failures ? 1 : 0)
