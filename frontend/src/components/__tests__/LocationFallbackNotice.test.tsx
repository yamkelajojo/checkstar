import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LocationFallbackNotice from '../LocationFallbackNotice'

describe('LocationFallbackNotice', () => {
  it('renders the Durban central fallback notice', () => {
    render(<LocationFallbackNotice />)

    expect(screen.getByText(/Durban central/i)).toBeInTheDocument()
    expect(screen.getByText(/pinpoint your location/i)).toBeInTheDocument()
  })
})
