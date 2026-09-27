import { getResolvedApiBaseUrlSync } from './apiClient'

/**
 * Media URL normalisation for the mobile app — the same contract the web app
 * enforces in `frontend/src/lib/media.ts`.
 *
 * The API absolutises media paths against whichever host the request arrived
 * on. That is correct for a native device calling the Metro-host API, but it
 * is wrong anywhere the app reaches the API through a same-origin proxy
 * (Expo web behind `/api`, the device simulator): the returned origin cannot
 * serve `/products/**`. Normalising every media URL against the origin the
 * app is *configured* to talk to keeps imagery working on all three targets.
 */
const MEDIA_NAMESPACES = ['/products/', '/recipes/']

/** Origin the app talks to for media, '' for same-origin, null if unknown. */
export function mediaOrigin(): string | null {
  const base = getResolvedApiBaseUrlSync()
  if (base === null) return null
  if (base.startsWith('/')) return ''
  try {
    const trimmed = base.endsWith('/api') ? base.slice(0, -'/api'.length) : base
    return new URL(trimmed).origin
  } catch {
    return null
  }
}

export function resolveMediaUrl(src: string | null | undefined): string | null {
  if (!src) return null

  const origin = mediaOrigin()
  const path = (value: string): string => (value.startsWith('/') ? value : `/${value}`)

  if (!/^https?:\/\//i.test(src)) {
    if (origin === null) return path(src)
    return origin + path(src)
  }

  if (origin === null) return src

  try {
    const url = new URL(src)
    if (MEDIA_NAMESPACES.some((ns) => url.pathname.startsWith(ns))) {
      return origin + url.pathname + url.search
    }
    return src
  } catch {
    return src
  }
}

/** Convenience: the same URL, guaranteed non-null, for render paths. */
export function mediaUri(src: string | null | undefined): string {
  return resolveMediaUrl(src) ?? (src ?? '')
}

/** expo-image / RN Image `source` shape for a possibly-missing media path. */
export function mediaSource(src: string | null | undefined): { uri: string } | null {
  const uri = resolveMediaUrl(src)
  return uri ? { uri } : null
}
