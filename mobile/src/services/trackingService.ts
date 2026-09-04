/**
 * ┌─────────────────────────────────────────────────────────────┐
 * │  TRACKING SERVICE — Behavioral Signal Capture               │
 * │                                                             │
 * │  Every function here is fire-and-forget. If tracking fails, │
 * │  the app continues normally. Tracking must NEVER break UX.  │
 * │                                                             │
 * │  These signals feed the recommendation engine which ranks   │
 * │  products personally for each customer.                     │
 * └─────────────────────────────────────────────────────────────┘
 */

import { getApiBaseUrl, tokenStorage } from '../lib/apiClient';

type EventSource = 'home' | 'feed' | 'search' | 'recommendation' | 'saved' | 'direct';

/**
 * Internal: send a request, swallow errors.
 * Tracking never blocks UI — every failure is silent.
 */
async function fireAndForget(url: string, body: Record<string, unknown>): Promise<void> {
  try {
    const baseUrl = await getApiBaseUrl();
    const token = await tokenStorage.get();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    await fetch(`${baseUrl}${url}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  } catch {
    // Silent — tracking never breaks UX
  }
}

/**
 * Records a product view with duration and source.
 * Duration distinguishes casual browsing from genuine interest.
 */
export async function trackProductView(
  productId: number,
  durationMs: number,
  source: EventSource = 'feed',
): Promise<void> {
  await fireAndForget('/tracking/view', {
    product_id: productId,
    duration_ms: Math.max(Math.floor(durationMs), 1),
    source,
  });
}

/**
 * Records a search query — explicit intent signal.
 */
export async function trackSearch(
  query: string,
  categoryId?: number,
  resultsCount: number = 0,
): Promise<void> {
  await fireAndForget('/tracking/search', {
    query,
    category_id: categoryId ?? null,
    results_count: resultsCount,
  });
}

/**
 * Records an add-to-cart event — strong purchase intent.
 */
export async function trackAddToCart(productId: number, quantity: number): Promise<void> {
  await fireAndForget('/tracking/events', {
    event_type: 'add_to_cart',
    product_id: productId,
    metadata: { quantity },
  });
}

/**
 * Records a remove-from-cart event — negative signal.
 */
export async function trackRemoveFromCart(productId: number): Promise<void> {
  await fireAndForget('/tracking/events', {
    event_type: 'remove_from_cart',
    product_id: productId,
  });
}

/**
 * Records a checkout event — conversion signal.
 */
export async function trackCheckout(orderTotal: number): Promise<void> {
  await fireAndForget('/tracking/events', {
    event_type: 'checkout',
    metadata: { order_total: orderTotal },
  });
}

/**
 * Records a category filter tap — deliberate category selection.
 */
export async function trackCategoryFilterTap(
  categoryId: number,
  categoryName: string,
  resultCount: number,
): Promise<void> {
  await fireAndForget('/tracking/search', {
    query: `category:${categoryName}`,
    category_id: categoryId,
    results_count: resultCount,
  });
}
