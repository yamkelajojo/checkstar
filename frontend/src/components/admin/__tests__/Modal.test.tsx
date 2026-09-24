import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import Modal from '../Modal'

// Closes itself on close (like a real dialog) and also reports to the spy.
function Stateful({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = React.useState(false)
  const close = () => {
    setOpen(false)
    onClose?.()
  }
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)} data-testid="trigger">
        Open
      </button>
      <Modal open={open} onClose={close} title="Test dialog">
        <p>Dialog body</p>
        <button type="button">First action</button>
        <button type="button" data-testid="last">
          Last action
        </button>
      </Modal>
    </div>
  )
}

describe('Modal', () => {
  it('is labelled, modal, and receives focus on open', () => {
    render(<Stateful onClose={vi.fn()} />)
    fireEvent.click(screen.getByTestId('trigger'))

    const dialog = screen.getByRole('dialog', { name: 'Test dialog' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('role', 'dialog')
    // focus moved into the dialog (first focusable)
    expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus()
  })

  it('closes on Escape and restores focus to the trigger', () => {
    const onClose = vi.fn()
    render(<Stateful onClose={onClose} />)
    fireEvent.click(screen.getByTestId('trigger'))
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('traps Tab focus inside the dialog', () => {
    render(<Stateful onClose={vi.fn()} />)
    fireEvent.click(screen.getByTestId('trigger'))

    const first = screen.getByRole('button', { name: 'Close dialog' })
    const last = screen.getByTestId('last')

    act(() => {
      last.focus()
    })
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(first).toHaveFocus()

    act(() => {
      first.focus()
    })
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(last).toHaveFocus()
  })

  it('locks body scroll while open and releases it on close', () => {
    render(<Stateful onClose={vi.fn()} />)
    fireEvent.click(screen.getByTestId('trigger'))
    expect(document.body.style.overflow).toBe('hidden')

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(document.body.style.overflow).not.toBe('hidden')
  })
})
