import { describe, it, expect } from 'vitest'
import { mediaUrl } from '@/lib/media'

/**
 * Backend media arrives as absolute URLs against the API origin (e.g.
 * http://localhost:8000/products/cat/file.webp) or bare paths. next/image
 * only optimises same-origin or allow-listed hosts, so same-backend media
 * must be normalised to the proxied same-origin path (/products/... rewrite
 * in next.config.js). Pins the contract for every Image src in the app.
 */
describe('mediaUrl', () => {
  it('passes already-relative paths through untouched', () => {
    expect(mediaUrl('/products/beverages/x.jpg')).toBe('/products/beverages/x.jpg')
  })

  it('converts absolute backend product URLs to the proxied path', () => {
    expect(mediaUrl('http://localhost:8000/products/beverages/x.jpg')).toBe('/products/beverages/x.jpg')
    expect(mediaUrl('http://127.0.0.1:8000/products/health-beauty/y.webp')).toBe('/products/health-beauty/y.webp')
    expect(mediaUrl('https://api.checkstar.co.za/products/bakery/z.png')).toBe('/products/bakery/z.png')
  })

  it('relative-ises any URL that points at the API origin (stores, banners)', () => {
    // NEXT_PUBLIC_API_URL defaults to http://localhost:8000 in dev.
    expect(mediaUrl('http://localhost:8000/stores/durban-central.jpg')).toBe('/stores/durban-central.jpg')
    expect(mediaUrl('http://localhost:8000/recipes/toast.jpg?w=100')).toBe('/recipes/toast.jpg?w=100')
  })

  it('keeps absolute URLs outside the proxied media namespace intact', () => {
    expect(mediaUrl('https://cdn.example.com/banner.webp')).toBe('https://cdn.example.com/banner.webp')
  })

  it('handles non-http schemes and junk without throwing', () => {
    expect(mediaUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc')
    expect(mediaUrl('')).toBe('')
  })

  it('tolerates nullish input (optional chaining render sites)', () => {
    expect(mediaUrl(null)).toBe('')
    expect(mediaUrl(undefined)).toBe('')
  })
})
