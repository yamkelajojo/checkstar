import { afterEach, describe, expect, it, vi } from 'vitest'
import { emitCartAdded, onCartAdded } from '../cart-events'

// cart-events keeps a module-level single listener; every test installs its own.
afterEach(() => {
  vi.restoreAllMocks()
})

describe('cart-events bus', () => {
  it('delivers an emitted event to the registered listener', () => {
    const fn = vi.fn()
    onCartAdded(fn)

    emitCartAdded('Tropika Orange')

    expect(fn).toHaveBeenCalledTimes(1)
    const event = fn.mock.calls[0][0]
    expect(event.name).toBe('Tropika Orange')
    expect(event.quantity).toBe(1)
    expect(typeof event.at).toBe('number')
  })

  it('honours a custom quantity', () => {
    const fn = vi.fn()
    onCartAdded(fn)

    emitCartAdded('Bananas 1kg', 3)

    expect(fn.mock.calls[0][0]).toMatchObject({ name: 'Bananas 1kg', quantity: 3 })
  })

  it('does not deliver after the returned unsubscribe runs', () => {
    const fn = vi.fn()
    const unsubscribe = onCartAdded(fn)

    unsubscribe()
    emitCartAdded('Should not arrive')

    expect(fn).not.toHaveBeenCalled()
  })

  it('replaces a previous listener with the latest subscriber', () => {
    const first = vi.fn()
    const second = vi.fn()
    onCartAdded(first)
    onCartAdded(second)

    emitCartAdded('Only for the latest')

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
    expect(second.mock.calls[0][0].name).toBe('Only for the latest')
  })

  it('unsubscribing an stale callback never removes a newer listener', () => {
    const first = vi.fn()
    const second = vi.fn()
    const unsubscribeFirst = onCartAdded(first)
    onCartAdded(second)

    unsubscribeFirst()
    emitCartAdded('Still delivered')

    expect(second).toHaveBeenCalledTimes(1)
  })
})
