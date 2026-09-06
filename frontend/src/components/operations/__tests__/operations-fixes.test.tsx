import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

import MapLayerToggles, { type MapLayerData } from '@/components/operations/MapLayerToggles'
import EventItem from '@/components/operations/EventItem'
import type { FeedEvent } from '@/types'

// ---- Leaflet shim: capture layer lifecycle without a real map ----
function makeMapStub() {
  const addedTo: unknown[] = []
  const layer = {
    addTo: vi.fn((m: unknown) => { addedTo.push(m); return layer }),
  }
  const L = {
    layerGroup: vi.fn(() => layer),
    circle: vi.fn(() => ({ addTo: vi.fn() })),
    circleMarker: vi.fn(() => ({ addTo: vi.fn() })),
  }
  ;(window as unknown as { L: unknown }).L = L
  const map = { addLayer: vi.fn(), removeLayer: vi.fn() }
  return { map, L, addedTo }
}

const SAMPLE_DATA: MapLayerData = {
  traffic: [{ lat: -29.85, lng: 31.02, count: 5 }],
  routes: [{ rider_id: 7, lat: -29.85, lng: 31.0 }],
  demand: [{ lat: -29.9, lng: 30.9, count: 3 }],
}

describe('MapLayerToggles — late-data sync', () => {
  beforeEach(() => {
    delete (window as unknown as { L?: unknown }).L
  })

  it('activating a layer before data exists renders it once data arrives', async () => {
    const env = makeMapStub()

    const { rerender } = render(<MapLayerToggles map={env.map} data={null} />)

    // Toggle Traffic while data is still null — nothing can be drawn yet.
    fireEvent.click(screen.getByRole('button', { name: 'Traffic' }))
    expect(env.addedTo).toHaveLength(0)

    // Data arrives late → the active layer must now be built and added.
    rerender(<MapLayerToggles map={env.map} data={SAMPLE_DATA} />)
    await waitForEffect()
    expect(env.addedTo).toHaveLength(1)
    expect(env.addedTo[0]).toBe(env.map)
  })

  it('toggle-off after data arrival removes the layer from the map', async () => {
    const env = makeMapStub()

    const { rerender } = render(<MapLayerToggles map={env.map} data={null} />)
    fireEvent.click(screen.getByRole('button', { name: 'Traffic' }))
    rerender(<MapLayerToggles map={env.map} data={SAMPLE_DATA} />)
    await waitForEffect()
    expect(env.addedTo).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: 'Traffic' }))
    expect(env.map.removeLayer).toHaveBeenCalled()
    expect(env.addedTo).toHaveLength(1) // not re-added
  })

  it('inactive layers are not built when data arrives', async () => {
    const env = makeMapStub()
    render(<MapLayerToggles map={env.map} data={SAMPLE_DATA} />)
    await waitForEffect()
    expect(env.addedTo).toHaveLength(0)
    expect(env.L.layerGroup).not.toHaveBeenCalled()
  })

  async function waitForEffect() {
    // Flush the passive effect + microtasks deterministically.
    await new Promise((r) => setTimeout(r, 0))
  }
})

describe('EventItem — relative time hardening', () => {
  const baseEvent = {
    id: 'e1',
    type: 'order_state_change',
    severity: 'info',
    message: 'Order CS-1001 marked preparing',
    created_at: new Date(Date.now() - 30_000).toISOString(),
  } as unknown as FeedEvent

  it('renders recent events with a readable ago label', () => {
    render(<EventItem event={baseEvent} />)
    expect(screen.getByText('30s ago')).toBeInTheDocument()
    expect(screen.getByText(/Order CS-1001/)).toBeInTheDocument()
  })

  it('renders an empty label instead of NaN for invalid dates', () => {
    render(<EventItem event={{ ...baseEvent, created_at: 'not-a-date' }} />)
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument()
  })

  it('falls back to a neutral bullet for unknown event types', () => {
    render(
      <EventItem
        event={{ ...baseEvent, severity: 'mystery' as unknown as FeedEvent['severity'], type: 'unknown_kind' }}
      />
    )
    expect(screen.getByText('•')).toBeInTheDocument()
  })
})
