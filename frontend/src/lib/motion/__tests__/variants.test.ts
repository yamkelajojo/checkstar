import { describe, it, expect } from 'vitest'
import {
  trans,
  panel,
  item,
  staggerContainer,
  fadeIn,
  slideIn,
  scalePop,
  orchestratedLayout,
} from '../variants'
import type { Variants } from 'motion/react'

describe('Transition Presets', () => {
  it('layout transition is a spring', () => {
    expect(trans.layout).toHaveProperty('type', 'spring')
    expect(trans.layout).toHaveProperty('stiffness')
    expect(trans.layout).toHaveProperty('damping')
  })

  it('enter transition uses decelerate easing', () => {
    expect(trans.enter).toHaveProperty('ease')
    expect(trans.enter).toHaveProperty('duration')
  })

  it('exit transition is faster than enter', () => {
    const enterDur = (trans.enter as any).duration
    const exitDur = (trans.exit as any).duration
    expect(exitDur).toBeLessThan(enterDur)
  })

  it('micro transition is the fastest', () => {
    const microDur = (trans.micro as any).duration
    const enterDur = (trans.enter as any).duration
    expect(microDur).toBeLessThanOrEqual(enterDur)
  })
})

describe('Panel Variants', () => {
  it('has hidden, visible, exit states', () => {
    expect(panel).toHaveProperty('hidden')
    expect(panel).toHaveProperty('visible')
    expect(panel).toHaveProperty('exit')
  })

  it('hidden state has opacity 0 and y offset', () => {
    const hidden = panel.hidden as any
    expect(hidden.opacity).toBe(0)
    expect(hidden.y).toBeGreaterThan(0)
  })

  it('visible state has opacity 1 and y 0', () => {
    const visible = panel.visible as any
    expect(visible.opacity).toBe(1)
    expect(visible.y).toBe(0)
  })
})

describe('Item Variants', () => {
  it('has hidden, visible, exit states', () => {
    expect(item).toHaveProperty('hidden')
    expect(item).toHaveProperty('visible')
    expect(item).toHaveProperty('exit')
  })

  it('hidden and visible have correct opacity', () => {
    expect((item.hidden as any).opacity).toBe(0)
    expect((item.visible as any).opacity).toBe(1)
  })
})

describe('Stagger Container', () => {
  it('returns a Variants object with hidden/visible', () => {
    const container = staggerContainer(0.05)
    expect(container).toHaveProperty('hidden')
    expect(container).toHaveProperty('visible')
  })

  it('visible state configures staggerChildren', () => {
    const container = staggerContainer(0.05)
    const visible = container.visible as any
    expect(visible.transition.staggerChildren).toBe(0.05)
  })

  it('uses default gap of 0.05 when not specified', () => {
    const container = staggerContainer()
    const visible = container.visible as any
    expect(visible.transition.staggerChildren).toBe(0.05)
  })

  it('exit reverses stagger direction', () => {
    const container = staggerContainer(0.05)
    const exit = container.exit as any
    expect(exit.transition.staggerDirection).toBe(-1)
  })
})

describe('Fade In', () => {
  it('hidden starts at opacity 0', () => {
    expect((fadeIn.hidden as any).opacity).toBe(0)
  })

  it('visible reaches opacity 1', () => {
    expect((fadeIn.visible as any).opacity).toBe(1)
  })
})

describe('Slide In', () => {
  it('up variant moves along y axis', () => {
    const variants = slideIn('up')
    const hidden = variants.hidden as any
    expect(hidden.y).toBeLessThan(0)
  })

  it('right variant moves along x axis', () => {
    const variants = slideIn('right')
    const hidden = variants.hidden as any
    expect(hidden.x).toBeGreaterThan(0)
  })

  it('left variant moves along negative x axis', () => {
    const variants = slideIn('left')
    const hidden = variants.hidden as any
    expect(hidden.x).toBeLessThan(0)
  })

  it('uses custom distance', () => {
    const variants = slideIn('up', 40)
    const hidden = variants.hidden as any
    expect(hidden.y).toBe(-40)
  })
})

describe('Scale Pop', () => {
  it('hidden starts small', () => {
    const hidden = scalePop.hidden as any
    expect(hidden.scale).toBeLessThan(1)
  })

  it('visible returns to scale 1', () => {
    const visible = scalePop.visible as any
    expect(visible.scale).toBe(1)
  })
})

describe('Orchestrated Layout', () => {
  it('has a spring config', () => {
    expect(orchestratedLayout.spring).toHaveProperty('type', 'spring')
    expect(orchestratedLayout.spring).toHaveProperty('stiffness')
  })

  it('panel exit fades and scales down', () => {
    const exit = orchestratedLayout.panelExit as any
    expect(exit.opacity).toBe(0)
    expect(exit.scale).toBeLessThan(1)
  })

  it('panel enter fades and scales to 1', () => {
    const enter = orchestratedLayout.panelEnter as any
    expect(enter.opacity).toBe(1)
    expect(enter.scale).toBe(1)
  })
})
