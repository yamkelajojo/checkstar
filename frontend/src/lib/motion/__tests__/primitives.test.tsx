import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Fade, Slide, Scale, Stagger, StaggerItem, Layout } from '../index'

// Mock framer-motion to avoid animation complexity in unit tests
// We test behavior (renders, classes, structure), not animation values
vi.mock('framer-motion', () => ({
  motion: {
    div: vi.fn(({ children, ...props }: any) => {
      // Strip motion-specific props, keep DOM props including className
      const {
        initial, animate, exit, transition, variants, layout, layoutId,
        whileHover, whileTap, whileFocus, drag, dragConstraints,
        onAnimationComplete, onAnimationStart, ...domProps
      } = props
      return <div {...domProps}>{children}</div>
    }),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  LayoutGroup: ({ children }: any) => <>{children}</>,
  useReducedMotion: () => false,
}))

describe('Fade', () => {
  it('renders children', () => {
    render(<Fade><span>hello</span></Fade>)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('applies className to wrapper', () => {
    const { container } = render(<Fade className="test-class"><span>hi</span></Fade>)
    expect(container.firstChild).toHaveClass('test-class')
  })
})

describe('Slide', () => {
  it('renders children', () => {
    render(<Slide><span>slid</span></Slide>)
    expect(screen.getByText('slid')).toBeInTheDocument()
  })

  it('applies className to wrapper', () => {
    const { container } = render(<Slide className="slide-class"><span>content</span></Slide>)
    expect(container.firstChild).toHaveClass('slide-class')
  })
})

describe('Scale', () => {
  it('renders children', () => {
    render(<Scale><span>scaled</span></Scale>)
    expect(screen.getByText('scaled')).toBeInTheDocument()
  })
})

describe('Stagger', () => {
  it('renders children', () => {
    render(
      <Stagger>
        <StaggerItem><span>one</span></StaggerItem>
        <StaggerItem><span>two</span></StaggerItem>
      </Stagger>
    )
    expect(screen.getByText('one')).toBeInTheDocument()
    expect(screen.getByText('two')).toBeInTheDocument()
  })
})

describe('StaggerItem', () => {
  it('renders children', () => {
    render(<StaggerItem><span>item</span></StaggerItem>)
    expect(screen.getByText('item')).toBeInTheDocument()
  })

  it('applies className to wrapper', () => {
    const { container } = render(<StaggerItem className="item-class"><span>styled</span></StaggerItem>)
    expect(container.firstChild).toHaveClass('item-class')
  })
})

describe('Layout', () => {
  it('renders children', () => {
    render(<Layout><span>layout</span></Layout>)
    expect(screen.getByText('layout')).toBeInTheDocument()
  })
})
