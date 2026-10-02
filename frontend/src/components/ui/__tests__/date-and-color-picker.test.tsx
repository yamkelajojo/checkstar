import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React, { useState } from 'react'

vi.mock('motion/react', async () => (await import('@/test/motion-mock')).default)

import DatePicker, {
  parseIsoParts,
  formatFriendlyDate,
  diffDaysInclusive,
} from '../date-picker'
import ColorPicker, {
  normalizeHex,
  hexToRgb,
  rgbToHex,
  hexToHsv,
  hsvToHex,
  hexToHslString,
  generateHarmoniousColors,
} from '../color-picker'

describe('DatePicker & ColorPicker (White-Box UI, State, Range & Spectrum Coverage)', () => {
  describe('DatePicker helper functions', () => {
    it('parses valid ISO dates and rejects invalid calendar dates (Statement, Branch & Condition coverage)', () => {
      expect(parseIsoParts('2026-10-02')).toEqual({ year: 2026, month0: 9, day: 2 })
      expect(parseIsoParts('2026-10-02T00:00:00Z')).toEqual({ year: 2026, month0: 9, day: 2 })
      expect(parseIsoParts('')).toBeNull()
      expect(parseIsoParts(null)).toBeNull()
      expect(parseIsoParts('not-a-date')).toBeNull()
      expect(parseIsoParts('2026-13-01')).toBeNull()
      expect(parseIsoParts('2026-02-30')).toBeNull()
    })

    it('formats friendly dates and computes inclusive day differences', () => {
      expect(formatFriendlyDate('2026-10-02')).toBe('2 Oct 2026')
      expect(formatFriendlyDate('')).toBe('')
      expect(diffDaysInclusive('2026-10-01', '2026-10-07')).toBe(7)
      expect(diffDaysInclusive('2026-10-07', '2026-10-01')).toBeNull()
      expect(diffDaysInclusive('', '2026-10-07')).toBeNull()
    })
  })

  describe('DatePicker interactive calendar, min/max bounds, and real-time start/end range', () => {
    it('opens the calendar popover on click/focus and selects a date without using native type="date"', () => {
      const onChange = vi.fn()
      render(
        <DatePicker
          id="test-date"
          placeholder="Start date"
          value="2026-10-02"
          onChange={onChange}
        />,
      )

      const input = screen.getByPlaceholderText('Start date') as HTMLInputElement
      expect(input.type).toBe('text')

      // Open calendar popover by clicking the input
      fireEvent.click(input)
      expect(screen.getByRole('dialog', { name: 'Choose date' })).toBeInTheDocument()

      // Select 15 Oct 2026 from the calendar grid
      fireEvent.click(screen.getByRole('button', { name: '15 Oct 2026' }))
      expect(onChange).toHaveBeenCalledWith('2026-10-15')
    })

    it('enforces minDate and maxDate constraints and highlights start-to-end range in real time', () => {
      function RangeHarness() {
        const [start, setStart] = useState('2026-10-05')
        const [end, setEnd] = useState('2026-10-12')
        return (
          <div>
            <DatePicker
              placeholder="Start date"
              value={start}
              onChange={setStart}
              rangeStart={start}
              rangeEnd={end}
              maxDate={end}
            />
            <DatePicker
              placeholder="End date"
              value={end}
              onChange={setEnd}
              rangeStart={start}
              rangeEnd={end}
              minDate={start}
            />
          </div>
        )
      }

      render(<RangeHarness />)

      // Open End date calendar
      fireEvent.click(screen.getByPlaceholderText('End date'))
      expect(screen.getByRole('dialog', { name: 'Choose date' })).toBeInTheDocument()

      // Days before minDate (2026-10-05) are disabled
      expect(screen.getByRole('button', { name: '3 Oct 2026' })).toBeDisabled()
      // Days on or after minDate are enabled
      expect(screen.getByRole('button', { name: '10 Oct 2026' })).not.toBeDisabled()

      // Live range summary footer shows "5 Oct 2026 → 12 Oct 2026 (8d)"
      expect(screen.getByText(/5 Oct 2026 → 12 Oct 2026/)).toBeInTheDocument()
      expect(screen.getByText('(8d)')).toBeInTheDocument()

      // Selecting 10 Oct 2026 updates End date in real time
      fireEvent.click(screen.getByRole('button', { name: '10 Oct 2026' }))
      expect(screen.getByPlaceholderText('End date')).toHaveValue('2026-10-10')
    })

    it('supports month/year navigation across year boundaries and clearing the date', () => {
      const onChange = vi.fn()
      render(<DatePicker placeholder="Pick date" value="2026-01-15" onChange={onChange} />)

      fireEvent.click(screen.getByPlaceholderText('Pick date'))
      // Step backward from January 2026 -> December 2025
      fireEvent.click(screen.getByRole('button', { name: 'Previous month' }))
      expect(screen.getByLabelText('Select month')).toHaveValue('11')
      expect(screen.getByLabelText('Select year')).toHaveValue('2025')

      // Step forward from December 2025 -> January 2026
      fireEvent.click(screen.getByRole('button', { name: 'Next month' }))
      expect(screen.getByLabelText('Select month')).toHaveValue('0')
      expect(screen.getByLabelText('Select year')).toHaveValue('2026')

      // Clear date via clear button
      fireEvent.click(screen.getByRole('button', { name: 'Clear date' }))
      expect(onChange).toHaveBeenCalledWith('')
    })
  })

  describe('ColorPicker helper functions & interactive popover', () => {
    it('normalizes 3-digit and 6-digit hex codes and converts across RGB, HSV (all 6 hue sectors), HSL, and harmonious palettes', () => {
      expect(normalizeHex('#f80')).toBe('#FF8800')
      expect(normalizeHex('eb6522')).toBe('#EB6522')
      expect(normalizeHex('invalid')).toBeNull()

      expect(hexToRgb('#EB6522')).toEqual({ r: 235, g: 101, b: 34 })
      expect(rgbToHex(235, 101, 34)).toBe('#EB6522')

      // Exercise all 6 hue sectors (0..360) in hsvToHex and hexToHsv
      for (const hue of [15, 75, 135, 195, 255, 315]) {
        const hex = hsvToHex(hue, 80, 90)
        expect(hex).toMatch(/^#[0-9A-F]{6}$/)
        const back = hexToHsv(hex)
        expect(back.s).toBeGreaterThan(70)
      }

      expect(hexToHslString('#EB6522')).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/)
      const harm = generateHarmoniousColors('#EB6522')
      expect(harm).toHaveLength(4)
      expect(harm.every((h) => /^#[0-9A-F]{6}$/.test(h.hex))).toBe(true)
    })

    it('opens the Cult UI-style ColorPicker popover, updates via spectrum, hue slider, harmonious swatches, brand swatches, and hex input', () => {
      const onChange = vi.fn()
      render(<ColorPicker value="#EB6522" onChange={onChange} ariaLabel="Primary banner colour" />)

      const trigger = screen.getByRole('button', { name: 'Primary banner colour' })
      fireEvent.click(trigger)

      expect(screen.getByRole('dialog', { name: 'Color picker' })).toBeInTheDocument()

      // 1. Hue slider change
      fireEvent.change(screen.getByLabelText('Hue'), { target: { value: '210' } })
      expect(onChange).toHaveBeenCalled()

      // 2. 2D spectrum pointer interaction
      const spectrum = screen.getByRole('slider', { name: 'Color saturation and brightness' })
      fireEvent.mouseDown(spectrum, { clientX: 120, clientY: 40 })
      fireEvent.mouseUp(window)

      // 3. Harmonious palette click
      const harmButtons = screen.getAllByRole('button', { name: /Use harmonious colour/ })
      expect(harmButtons).toHaveLength(4)
      fireEvent.click(harmButtons[0])
      expect(onChange).toHaveBeenCalled()

      // 4. Brand swatch click
      fireEvent.click(screen.getByRole('button', { name: 'Select swatch #16A34A' }))
      expect(onChange).toHaveBeenLastCalledWith('#16A34A')

      // 5. Live hex input change
      fireEvent.change(screen.getByLabelText('Hex colour'), { target: { value: '#2563eb' } })
      expect(onChange).toHaveBeenLastCalledWith('#2563EB')

      // 6. Copy hex button
      fireEvent.click(screen.getByRole('button', { name: 'Copy hex colour' }))
      expect(screen.getByText('Copied')).toBeInTheDocument()
    })

    it('guards against any native <input type="date"> or <input type="color"> in DatePicker and ColorPicker', () => {
      const { container } = render(
        <div>
          <DatePicker placeholder="Start date" value="2026-10-02" onChange={() => {}} />
          <ColorPicker value="#EB6522" onChange={() => {}} />
        </div>,
      )

      expect(container.querySelector('input[type="date"]')).toBeNull()
      expect(container.querySelector('input[type="color"]')).toBeNull()
    })
  })
})
