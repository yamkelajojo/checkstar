import { describe, it, expect } from 'vitest'
import {
  spring,
  ease,
  time,
  shift,
  opacity,
  stagger,
  dampingRatio,
  settleTime,
  type SpringConfig,
} from '../tokens'

describe('Spring Physics', () => {
  describe('dampingRatio', () => {
    it('returns ratio between 0 and 1 for underdamped springs', () => {
      const ratio = dampingRatio(spring.layout)
      expect(ratio).toBeGreaterThan(0)
      expect(ratio).toBeLessThan(1)
    })

    it('returns 1 for critically damped spring', () => {
      const critical: SpringConfig = { stiffness: 400, damping: 40, mass: 1 }
      const ratio = dampingRatio(critical)
      expect(ratio).toBeCloseTo(1.0, 1)
    })

    it('returns > 1 for overdamped spring', () => {
      const over: SpringConfig = { stiffness: 100, damping: 100, mass: 1 }
      expect(dampingRatio(over)).toBeGreaterThan(1)
    })

    it('layout spring is slightly underdamped (ζ ≈ 0.75–0.85)', () => {
      const ratio = dampingRatio(spring.layout)
      expect(ratio).toBeGreaterThanOrEqual(0.75)
      expect(ratio).toBeLessThanOrEqual(0.85)
    })

    it('snap spring is more underdamped than layout (feels snappier)', () => {
      const layoutZ = dampingRatio(spring.layout)
      const snapZ = dampingRatio(spring.snap)
      expect(snapZ).toBeLessThan(layoutZ)
    })

    it('gentle spring is more damped than layout (softer landing)', () => {
      const layoutZ = dampingRatio(spring.layout)
      const gentleZ = dampingRatio(spring.gentle)
      expect(gentleZ).toBeGreaterThan(layoutZ)
    })
  })

  describe('settleTime', () => {
    it('returns positive settle time', () => {
      expect(settleTime(spring.layout)).toBeGreaterThan(0)
    })

    it('snap settles faster than layout', () => {
      expect(settleTime(spring.snap)).toBeLessThan(settleTime(spring.layout))
    })

    it('all springs settle under 500ms', () => {
      for (const s of Object.values(spring)) {
        expect(settleTime(s)).toBeLessThan(0.5)
      }
    })
  })
})

describe('Easing Curves', () => {
  it('decelerate starts at 0,0 and ends at 1,1', () => {
    expect(ease.decelerate[0]).toBe(0)
    expect(ease.decelerate[1]).toBe(0)
    expect(ease.decelerate[2]).toBeCloseTo(0.2, 1)
    expect(ease.decelerate[3]).toBe(1)
  })

  it('accelerate starts slow, ends fast', () => {
    // Control points: first Y should be 0 or low, second Y should be 1
    expect(ease.accelerate[1]).toBe(0)
    expect(ease.accelerate[3]).toBe(1)
  })

  it('all curves are valid cubic bezier (values between 0-1 for y)', () => {
    for (const curve of Object.values(ease)) {
      expect(curve).toHaveLength(4)
      // x values can exceed 0-1 for overshoot, but y should be in range for standard
      expect(curve[1]).toBeGreaterThanOrEqual(0)
      expect(curve[1]).toBeLessThanOrEqual(1)
      expect(curve[3]).toBeGreaterThanOrEqual(0)
      expect(curve[3]).toBeLessThanOrEqual(1)
    }
  })
})

describe('Duration Constants', () => {
  it('durations are monotonically increasing', () => {
    const values = [time.instant, time.fast, time.base, time.slow, time.page]
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1])
    }
  })

  it('interactive durations are under 350ms (Apple HIG ceiling)', () => {
    expect(time.instant).toBeLessThanOrEqual(0.35)
    expect(time.fast).toBeLessThanOrEqual(0.35)
    expect(time.base).toBeLessThanOrEqual(0.35)
    expect(time.slow).toBeLessThanOrEqual(0.35)
  })
})

describe('Spatial Constants', () => {
  it('shift distances are monotonically increasing', () => {
    expect(shift.large).toBeGreaterThan(shift.base)
    expect(shift.base).toBeGreaterThan(shift.tiny)
  })

  it('opacity values are between 0 and 1', () => {
    for (const v of Object.values(opacity)) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })

  it('stagger gaps are positive and ordered', () => {
    expect(stagger.fast).toBeGreaterThan(0)
    expect(stagger.base).toBeGreaterThan(stagger.fast)
    expect(stagger.slow).toBeGreaterThan(stagger.base)
  })

  it('stagger gaps are under 100ms (perceptible but not sluggish)', () => {
    for (const v of Object.values(stagger)) {
      expect(v).toBeLessThan(0.1)
    }
  })
})
