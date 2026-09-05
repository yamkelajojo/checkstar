/**
 * Cart "added" announcement bus.
 *
 * Adding to the cart must confirm itself where the user is looking — the
 * header badge is off-screen while scrolling a product grid on a phone, and
 * screen readers get nothing from a badge change. The store itself stays
 * event-free (it is persisted wholesale, so transient UI state must not live
 * there); components emit on add and the single <CartToast /> mounted in the
 * public layout announces it visually and via aria-live.
 */

export interface CartAddedEvent {
  name: string
  quantity: number
  at: number
}

type Listener = (event: CartAddedEvent) => void

let listener: Listener | null = null

export function emitCartAdded(name: string, quantity = 1): void {
  listener?.({ name, quantity, at: Date.now() })
}

export function onCartAdded(fn: Listener): () => void {
  listener = fn
  return () => {
    if (listener === fn) listener = null
  }
}
